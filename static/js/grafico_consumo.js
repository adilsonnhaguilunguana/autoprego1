// ===============================
// GRÁFICO DE CONSUMO MENSAL - APENAS MARCADORES NO FIM DO DIA
// ===============================

let graficoConsumo = null;
let intervaloAtualizacao = null;
let ultimaAtualizacaoDOM = null;

// Plugin para separadores de dias
Chart.register({
    id: 'separadorDias',
    beforeDraw: function(chart) {
        if (!chart.$separadoresDias || chart.$separadoresDias.length === 0) return;
        
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1.5;
        
        chart.$separadoresDias.forEach(posX => {
            if (posX > xAxis.left && posX < xAxis.right) {
                ctx.beginPath();
                ctx.moveTo(posX, yAxis.top);
                ctx.lineTo(posX, yAxis.bottom);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
});

// Plugin para marcadores de fim de dia
Chart.register({
    id: 'marcadoresFimDia',
    afterDatasetsDraw: function(chart) {
        if (!chart.$marcadoresFimDia || chart.$marcadoresFimDia.length === 0) return;
        
        const ctx = chart.ctx;
        
        ctx.save();
        
        chart.$marcadoresFimDia.forEach(marcador => {
            if (!marcador.x || !marcador.y) return;
            
            // Desenhar ponto grande (6px) com borda branca
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(marcador.x, marcador.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(marcador.x, marcador.y, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Adicionar linha vertical pequena
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(marcador.x, marcador.y - 10);
            ctx.lineTo(marcador.x, marcador.y + 10);
            ctx.stroke();
        });
        
        ctx.restore();
    }
});

// Buscar dados
async function buscarDadosPzem1() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal?_=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        return await resposta.json();
    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        return null;
    }
}

// Processar dados - APENAS MARCADORES NO FIM DO DIA
function processarDados(registros) {
    if (!registros || !Array.isArray(registros)) return null;
    
    const resultado = {
        labels: [],           // Labels do eixo X (apenas números)
        data: [],             // Dados de potência
        timestamps: [],       // Para tooltips
        tensoes: [],
        correntes: [],
        energias: [],
        diasLabels: [],       // Labels dos dias (2 dez, 3 dez...)
        separadores: [],      // Posições dos separadores ENTRE dias
        marcadores: []        // Marcadores de FIM DE DIA (apenas estes serão visíveis)
    };
    
    let diaAnterior = '';
    let ultimoPontoDoDia = null;
    let primeiroPontoDoDia = true;
    let indicePonto = 0;
    
    // Agrupar registros por dia
    const registrosPorDia = {};
    
    registros.forEach(reg => {
        const timestamp = reg.data_hora || reg.timestamp || '';
        let diaAtual = '';
        
        if (timestamp) {
            const match = timestamp.toString().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                diaAtual = match[0];
                if (!registrosPorDia[diaAtual]) {
                    registrosPorDia[diaAtual] = [];
                }
                registrosPorDia[diaAtual].push({
                    ...reg,
                    timestamp: timestamp
                });
            }
        }
    });
    
    // Processar cada dia
    Object.keys(registrosPorDia).sort().forEach((diaKey, diaIndex) => {
        const registrosDia = registrosPorDia[diaKey];
        
        // Para cada registro do dia
        registrosDia.forEach((reg, idxDia) => {
            const potencia = parseFloat(reg.potencia || reg.power || 0);
            const timestamp = reg.timestamp;
            
            // Adicionar ponto
            resultado.labels.push(indicePonto.toString());
            resultado.data.push(potencia);
            resultado.timestamps.push(timestamp);
            resultado.tensoes.push(parseFloat(reg.tensao || reg.voltage || 220));
            resultado.correntes.push(parseFloat(reg.corrente || reg.current || 0));
            resultado.energias.push(parseFloat(reg.energia || reg.energy || 0));
            
            // Primeiro ponto do dia: adicionar label
            if (idxDia === 0) {
                const partes = diaKey.split('-');
                if (partes.length === 3) {
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mes = meses[parseInt(partes[1]) - 1] || '';
                    const dia = parseInt(partes[2]) || 1;
                    
                    resultado.diasLabels.push({
                        indice: indicePonto,
                        label: `${dia} ${mes}`
                    });
                }
            }
            
            // Último ponto do dia: marcar como fim do dia
            if (idxDia === registrosDia.length - 1) {
                resultado.marcadores.push({
                    indice: indicePonto,
                    valor: potencia
                });
            }
            
            indicePonto++;
        });
        
        // Adicionar separador APÓS cada dia (exceto o último)
        if (diaIndex < Object.keys(registrosPorDia).length - 1) {
            resultado.separadores.push(indicePonto - 0.5);
        }
    });
    
    console.log('📊 Processado:', {
        totalPontos: resultado.data.length,
        dias: resultado.diasLabels.length,
        marcadoresFimDia: resultado.marcadores.length,
        separadores: resultado.separadores.length
    });
    
    return resultado;
}

// Formatar data para tooltip
function formatarDataTooltip(timestamp) {
    if (!timestamp) return '';
    
    try {
        const data = new Date(timestamp);
        if (isNaN(data.getTime())) return timestamp;
        
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const mes = meses[data.getMonth()];
        const dia = data.getDate();
        const hora = data.getHours().toString().padStart(2, '0');
        const minuto = data.getMinutes().toString().padStart(2, '0');
        
        return `${dia} ${mes} - ${hora}:${minuto}`;
    } catch (e) {
        return timestamp;
    }
}

// Atualizar gráfico
function atualizarGrafico(dados) {
    const canvas = document.getElementById('graficoConsumo');
    if (!canvas) return;
    
    const container = canvas.parentElement.parentElement;
    
    // Verificar dados
    if (!dados || !dados.sucesso || !dados.registos || dados.registos.length === 0) {
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        if (!container.querySelector('.sem-dados')) {
            canvas.style.display = 'none';
            container.innerHTML += `
                <div class="sem-dados text-center text-muted py-5">
                    <i class="bi bi-lightning display-4 d-block mb-3"></i>
                    <h5 class="mb-2">Aguardando dados do PZEM 1</h5>
                    <p class="mb-0">O sensor principal ainda não enviou dados válidos...</p>
                </div>
            `;
        }
        return;
    }
    
    // Remover mensagem
    const mensagem = container.querySelector('.sem-dados');
    if (mensagem) mensagem.remove();
    canvas.style.display = 'block';
    
    // Processar dados
    const dadosProcessados = processarDados(dados.registos);
    if (!dadosProcessados) return;
    
    // Atualizar timestamp
    if (ultimaAtualizacaoDOM) {
        ultimaAtualizacaoDOM.textContent = `Atualizado: ${new Date().toLocaleTimeString()}`;
    }
    
    // Destruir gráfico anterior
    if (graficoConsumo) {
        graficoConsumo.destroy();
        graficoConsumo = null;
    }
    
    // Criar novo gráfico
    const ctx = canvas.getContext('2d');
    
    graficoConsumo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosProcessados.labels,
            datasets: [{
                label: 'PZEM 1 - Potência (W)',
                data: dadosProcessados.data,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.05)',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0,           // SEM PONTOS NA LINHA
                pointHoverRadius: 0,      // SEM PONTOS NO HOVER
                cubicInterpolationMode: 'monotone'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 400,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    titleFont: {
                        size: 13,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        title: function(context) {
                            const indice = context[0].dataIndex;
                            const timestamp = dadosProcessados.timestamps[indice];
                            const formatado = formatarDataTooltip(timestamp);
                            
                            // Verificar se é um marcador de fim de dia
                            const isFimDia = dadosProcessados.marcadores.some(m => m.indice === indice);
                            if (isFimDia) {
                                return `🔴 FIM DO DIA - ${formatado}`;
                            }
                            
                            return formatado;
                        },
                        label: function(context) {
                            const valor = context.parsed.y;
                            const indice = context.dataIndex;
                            
                            // Verificar se é fim de dia
                            const isFimDia = dadosProcessados.marcadores.some(m => m.indice === indice);
                            const prefixo = isFimDia ? '🔴 ' : '';
                            
                            return `${prefixo}Potência: ${valor.toFixed(1)} W`;
                        },
                        afterBody: function(context) {
                            const indice = context[0].dataIndex;
                            const isFimDia = dadosProcessados.marcadores.some(m => m.indice === indice);
                            
                            const info = [
                                `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`,
                                `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`,
                                `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`
                            ];
                            
                            if (isFimDia) {
                                info.unshift('───── FIM DO DIA ─────');
                            }
                            
                            return info;
                        },
                        footer: function(context) {
                            const indice = context[0].dataIndex;
                            const isFimDia = dadosProcessados.marcadores.some(m => m.indice === indice);
                            
                            if (isFimDia) {
                                return '⠀'; // Espaço invisível para separar
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function(value, index) {
                            // Mostrar APENAS no primeiro ponto de cada dia
                            const labelObj = dadosProcessados.diasLabels.find(l => l.indice === index);
                            return labelObj ? labelObj.label : '';
                        },
                        maxTicksLimit: 31, // Máximo 31 dias
                        autoSkip: false,   // NÃO pular ticks
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#555',
                        padding: 5
                    },
                    title: {
                        display: true,
                        text: 'Dias do Mês',
                        color: '#666',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: {top: 10, bottom: 5}
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grace: '10%',
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#555',
                        callback: function(value) {
                            return value + ' W';
                        },
                        padding: 5
                    },
                    title: {
                        display: true,
                        text: 'Potência (W)',
                        color: '#666',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: {top: 0, bottom: 10}
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone',
                    borderCapStyle: 'round'
                },
                point: {
                    radius: 0,
                    hoverRadius: 0
                }
            }
        }
    });
    
    // Calcular posições dos separadores
    if (graficoConsumo.scales.x) {
        graficoConsumo.$separadoresDias = dadosProcessados.separadores.map(pos => {
            return graficoConsumo.scales.x.getPixelForValue(pos);
        });
    }
    
    // Calcular posições dos marcadores de fim de dia
    graficoConsumo.$marcadoresFimDia = [];
    if (graficoConsumo.scales.x && graficoConsumo.scales.y) {
        dadosProcessados.marcadores.forEach(marcador => {
            const xPos = graficoConsumo.scales.x.getPixelForValue(marcador.indice);
            const yPos = graficoConsumo.scales.y.getPixelForValue(marcador.valor);
            
            if (xPos && yPos) {
                graficoConsumo.$marcadoresFimDia.push({
                    x: xPos,
                    y: yPos,
                    indice: marcador.indice,
                    valor: marcador.valor
                });
            }
        });
    }
    
    console.log('✅ Gráfico criado com:', {
        separadores: graficoConsumo.$separadoresDias?.length || 0,
        marcadores: graficoConsumo.$marcadoresFimDia?.length || 0
    });
}

// Função principal
async function carregarEAtualizar() {
    try {
        const dados = await buscarDadosPzem1();
        if (dados) {
            atualizarGrafico(dados);
        }
    } catch (erro) {
        console.error('Erro:', erro);
    }
}

// Inicializar
function iniciarGrafico() {
    console.log('🚀 Iniciando gráfico PZEM 1 (sem pontos, apenas marcadores)...');
    
    ultimaAtualizacaoDOM = document.getElementById('ultimaAtualizacao');
    
    // Primeira carga
    carregarEAtualizar();
    
    // Atualizar a cada 10s
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    intervaloAtualizacao = setInterval(carregarEAtualizar, 10000);
    
    // Redimensionar
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (graficoConsumo) {
                graficoConsumo.resize();
                
                // Recalcular posições dos marcadores após redimensionamento
                if (graficoConsumo.$marcadoresFimDia && graficoConsumo.scales.x && graficoConsumo.scales.y) {
                    graficoConsumo.$marcadoresFimDia.forEach(marcador => {
                        marcador.x = graficoConsumo.scales.x.getPixelForValue(marcador.indice);
                        marcador.y = graficoConsumo.scales.y.getPixelForValue(marcador.valor);
                    });
                }
                
                graficoConsumo.update('none');
            }
        }, 150);
    });
}

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarGrafico);
} else {
    setTimeout(iniciarGrafico, 100);
}

// Debug
window.graficoPzem1 = {
    atualizar: carregarEAtualizar,
    getDados: () => graficoConsumo?.data,
    forcarRedraw: () => {
        if (graficoConsumo) {
            graficoConsumo.update();
        }
    }
};