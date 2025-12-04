// ===============================
// GRÁFICO DE CONSUMO MENSAL - PZEM 1 CORRIGIDO
// ===============================

let graficoConsumo = null;
let intervaloAtualizacao = null;
let dadosCache = [];
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
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1;
        
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

// Buscar dados da API
async function buscarDadosPzem1() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal?_=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        console.log('📊 Dados recebidos:', {
            sucesso: dados.sucesso,
            total: dados.registos?.length,
            periodo: dados.periodo
        });
        
        return dados;
    } catch (erro) {
        console.error('❌ Erro ao buscar dados:', erro);
        return null;
    }
}

// Processar dados para evitar quedas para zero
function processarDados(registros) {
    if (!registros || !Array.isArray(registros)) return null;
    
    const resultado = {
        labels: [],        // Labels do eixo X
        data: [],          // Dados de potência
        timestamps: [],    // Timestamps para tooltip
        tensoes: [],       // Dados de tensão
        correntes: [],     // Dados de corrente
        energias: [],      // Dados de energia
        diasLabels: [],    // Labels dos dias (2 dez, 3 dez...)
        separadores: []    // Posições dos separadores
    };
    
    let diaAnterior = '';
    let primeiroPontoDoDia = true;
    let ultimaPotenciaValida = 0;
    
    // Primeiro passada: processar dados reais
    registros.forEach((reg, indice) => {
        const timestamp = reg.data_hora || reg.timestamp || '';
        let potencia = parseFloat(reg.potencia || reg.power || 0);
        const tensao = parseFloat(reg.tensao || reg.voltage || 220);
        const corrente = parseFloat(reg.corrente || reg.current || 0);
        const energia = parseFloat(reg.energia || reg.energy || 0);
        
        // EVITAR QUEDA PARA ZERO: Se potência for 0 mas anterior não, manter último valor
        if (potencia === 0 && ultimaPotenciaValida > 0 && indice > 0) {
            potencia = ultimaPotenciaValida;
        }
        
        // Atualizar último valor válido
        if (potencia > 0) {
            ultimaPotenciaValida = potencia;
        }
        
        // Extrair dia (YYYY-MM-DD)
        let diaAtual = '';
        if (timestamp) {
            const match = timestamp.toString().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                diaAtual = match[0];
            }
        }
        
        // Detectar mudança de dia
        if (diaAnterior !== '' && diaAtual !== '' && diaAtual !== diaAnterior) {
            // Adicionar separador entre dias
            resultado.separadores.push(indice - 0.5);
            primeiroPontoDoDia = true;
        }
        
        // Adicionar label no primeiro ponto de cada dia
        if (primeiroPontoDoDia && diaAtual) {
            const partes = diaAtual.split('-');
            if (partes.length === 3) {
                const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                              'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                const mes = meses[parseInt(partes[1]) - 1] || '';
                const dia = parseInt(partes[2]) || 1;
                
                resultado.diasLabels.push({
                    indice: indice,
                    label: `${dia} ${mes}`
                });
            }
            primeiroPontoDoDia = false;
        }
        
        // Atualizar dia anterior
        if (diaAtual) diaAnterior = diaAtual;
        
        // Armazenar dados
        resultado.labels.push(indice.toString());
        resultado.data.push(potencia);
        resultado.timestamps.push(timestamp);
        resultado.tensoes.push(tensao);
        resultado.correntes.push(corrente);
        resultado.energias.push(energia);
    });
    
    console.log('✅ Dados processados:', {
        pontos: resultado.data.length,
        dias: resultado.diasLabels.length,
        separadores: resultado.separadores.length,
        minPotencia: Math.min(...resultado.data.filter(d => d > 0)),
        maxPotencia: Math.max(...resultado.data)
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
    if (!canvas) {
        console.error('❌ Canvas não encontrado!');
        return;
    }
    
    const container = canvas.parentElement.parentElement;
    
    // Verificar se há dados
    if (!dados || !dados.sucesso || !dados.registos || dados.registos.length === 0) {
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        const mensagemExistente = container.querySelector('.sem-dados');
        if (!mensagemExistente) {
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
    
    // Remover mensagem se existir
    const mensagem = container.querySelector('.sem-dados');
    if (mensagem) {
        mensagem.remove();
    }
    canvas.style.display = 'block';
    
    // Processar dados
    const dadosProcessados = processarDados(dados.registos);
    if (!dadosProcessados) return;
    
    // Atualizar timestamp
    const agora = new Date();
    if (ultimaAtualizacaoDOM) {
        ultimaAtualizacaoDOM.textContent = `Última atualização: ${agora.toLocaleTimeString()}`;
    }
    
    // Se gráfico já existe, atualizar
    if (graficoConsumo) {
        // Atualizar dados
        graficoConsumo.data.labels = dadosProcessados.labels;
        graficoConsumo.data.datasets[0].data = dadosProcessados.data;
        
        // Atualizar separadores
        graficoConsumo.$separadoresDias = dadosProcessados.separadores.map(pos => {
            return graficoConsumo.scales.x.getPixelForValue(pos);
        });
        
        // Atualizar tooltips
        graficoConsumo.options.plugins.tooltip.callbacks.title = function(context) {
            const indice = context[0].dataIndex;
            return formatarDataTooltip(dadosProcessados.timestamps[indice]);
        };
        
        graficoConsumo.options.plugins.tooltip.callbacks.afterBody = function(context) {
            const indice = context[0].dataIndex;
            return [
                `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`,
                `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`,
                `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`
            ];
        };
        
        // Atualizar labels do eixo X
        graficoConsumo.options.scales.x.ticks.callback = function(value, index) {
            const labelObj = dadosProcessados.diasLabels.find(l => l.indice === index);
            return labelObj ? labelObj.label : '';
        };
        
        graficoConsumo.update('active');
        console.log('🔄 Gráfico atualizado');
        return;
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
                tension: 0.4, // Linha mais suave
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#0d6efd',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                cubicInterpolationMode: 'monotone' // Evita overshoot
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 300,
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
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
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
                            return formatarDataTooltip(dadosProcessados.timestamps[indice]);
                        },
                        label: function(context) {
                            const valor = context.parsed.y;
                            return `Potência: ${valor.toFixed(1)} W`;
                        },
                        afterBody: function(context) {
                            const indice = context[0].dataIndex;
                            return [
                                `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`,
                                `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`,
                                `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`
                            ];
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
                            // CORREÇÃO: Mostrar labels como "2 dez", "3 dez"
                            const labelObj = dadosProcessados.diasLabels.find(l => l.indice === index);
                            return labelObj ? labelObj.label : '';
                        },
                        maxTicksLimit: 15,
                        autoSkip: true,
                        autoSkipPadding: 20,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#555'
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
                        }
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
                    cubicInterpolationMode: 'monotone'
                },
                point: {
                    radius: 0
                }
            }
        }
    });
    
    // Armazenar separadores
    graficoConsumo.$separadoresDias = dadosProcessados.separadores.map(pos => {
        return graficoConsumo.scales.x.getPixelForValue(pos);
    });
    
    console.log('✅ Gráfico criado com sucesso');
    console.log('📊 Labels do eixo X:', dadosProcessados.diasLabels.map(d => d.label));
}

// Função principal
async function carregarEAtualizarGrafico() {
    try {
        const dados = await buscarDadosPzem1();
        if (dados) {
            atualizarGrafico(dados);
        }
    } catch (erro) {
        console.error('❌ Erro na atualização:', erro);
    }
}

// Inicializar
function iniciarGrafico() {
    console.log('🚀 Iniciando gráfico PZEM 1...');
    
    // Encontrar elemento de atualização
    ultimaAtualizacaoDOM = document.getElementById('ultimaAtualizacao');
    
    // Primeira carga
    carregarEAtualizarGrafico();
    
    // Atualizar a cada 10 segundos
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(carregarEAtualizarGrafico, 10000);
    
    // Redimensionar
    window.addEventListener('resize', function() {
        if (graficoConsumo) {
            setTimeout(() => {
                graficoConsumo.resize();
                graficoConsumo.update('none');
            }, 100);
        }
    });
}

// Iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarGrafico);
} else {
    iniciarGrafico();
}

// Debug
window.debugPzem1 = {
    atualizar: carregarEAtualizarGrafico,
    getGrafico: () => graficoConsumo
};