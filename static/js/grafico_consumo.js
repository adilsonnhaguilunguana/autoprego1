// ===============================
// GRÁFICO DE CONSUMO MENSAL - PZEM 1
// ===============================

let graficoConsumo = null;
let intervaloAtualizacao = null;
let ultimosDados = null;
let ultimaPotencia = null;

// Plugin para separadores de dias
const separadorDiasPlugin = {
    id: 'separadorDias',
    beforeDraw(chart) {
        const separadores = chart.$separadoresDias;
        if (!separadores || separadores.length === 0) return;
        
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1;
        
        separadores.forEach(posX => {
            if (posX > xAxis.left && posX < xAxis.right) {
                ctx.beginPath();
                ctx.moveTo(posX, yAxis.top);
                ctx.lineTo(posX, yAxis.bottom);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
};

// Plugin para marcadores de fim de dia
const marcadorFimDiaPlugin = {
    id: 'marcadorFimDia',
    afterDatasetsDraw(chart) {
        const marcadores = chart.$marcadoresFimDia;
        if (!marcadores || marcadores.length === 0) return;
        
        const ctx = chart.ctx;
        
        ctx.save();
        
        marcadores.forEach(marcador => {
            const ponto = chart.getDatasetMeta(0).data[marcador.indice];
            if (!ponto) return;
            
            // Desenhar ponto vermelho
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(ponto.x, ponto.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Adicionar borda branca
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(ponto.x, ponto.y, 4, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.restore();
    }
};

// Registrar plugins
if (typeof Chart !== 'undefined') {
    Chart.register(separadorDiasPlugin, marcadorFimDiaPlugin);
}

// Buscar dados da API
async function buscarDados() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal?_=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        // Atualizar última atualização
        const agora = new Date();
        const elementoAtualizacao = document.getElementById('ultimaAtualizacao');
        if (elementoAtualizacao) {
            elementoAtualizacao.textContent = 
                `Última atualização: ${agora.toLocaleTimeString()}`;
        }
        
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        return null;
    }
}

// Processar dados para o gráfico
function processarDados(registros) {
    if (!registros || !Array.isArray(registros)) {
        return null;
    }
    
    const dadosProcessados = {
        indices: [],
        potencias: [],
        timestamps: [],
        tensoes: [],
        correntes: [],
        energias: [],
        labelsDias: [],
        separadoresDias: [],
        marcadoresFimDia: []
    };
    
    let diaAnterior = null;
    let ultimoPontoDia = null;
    let primeiroPontoNovoDia = true;
    
    registros.forEach((registro, indice) => {
        // Extrair dados
        const timestamp = registro.data_hora || registro.timestamp || '';
        const potencia = parseFloat(registro.potencia || registro.power || 0);
        const tensao = parseFloat(registro.tensao || registro.voltage || 0);
        const corrente = parseFloat(registro.corrente || registro.current || 0);
        const energia = parseFloat(registro.energia || registro.energy || 0);
        
        // Extrair dia (YYYY-MM-DD)
        let diaAtual = '';
        if (timestamp) {
            const match = timestamp.toString().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                diaAtual = match[0];
            }
        }
        
        // Detectar mudança de dia
        if (diaAnterior !== null && diaAtual && diaAtual !== diaAnterior) {
            // Adicionar separador no ponto médio entre dias
            dadosProcessados.separadoresDias.push(indice - 0.5);
            
            // Adicionar marcador no último ponto do dia anterior (se tiver valor)
            if (ultimoPontoDia !== null && dadosProcessados.potencias[ultimoPontoDia] > 0) {
                dadosProcessados.marcadoresFimDia.push({
                    indice: ultimoPontoDia,
                    valor: dadosProcessados.potencias[ultimoPontoDia]
                });
            }
            
            primeiroPontoNovoDia = true;
        }
        
        // Adicionar label no primeiro ponto de cada dia
        if (primeiroPontoNovoDia && diaAtual) {
            const partes = diaAtual.split('-');
            if (partes.length === 3) {
                const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                              'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                const mes = meses[parseInt(partes[1]) - 1] || 'jan';
                const dia = parseInt(partes[2]) || 1;
                
                dadosProcessados.labelsDias.push({
                    indice: indice,
                    label: `${mes} ${dia}`
                });
            }
            primeiroPontoNovoDia = false;
        }
        
        // Atualizar referências
        if (diaAtual) {
            diaAnterior = diaAtual;
        }
        ultimoPontoDia = indice;
        
        // Armazenar dados
        dadosProcessados.indices.push(indice);
        dadosProcessados.potencias.push(potencia);
        dadosProcessados.timestamps.push(timestamp);
        dadosProcessados.tensoes.push(tensao);
        dadosProcessados.correntes.push(corrente);
        dadosProcessados.energias.push(energia);
    });
    
    // Adicionar último marcador de fim de dia
    if (ultimoPontoDia !== null && dadosProcessados.potencias[ultimoPontoDia] > 0) {
        dadosProcessados.marcadoresFimDia.push({
            indice: ultimoPontoDia,
            valor: dadosProcessados.potencias[ultimoPontoDia]
        });
    }
    
    return dadosProcessados;
}

// Atualizar gráfico com novos dados
function atualizarGraficoComDados(dados) {
    const canvas = document.getElementById('graficoConsumo');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    const container = canvas.parentElement.parentElement;
    
    // Verificar se há dados
    if (!dados || !dados.sucesso || !dados.registos || dados.registos.length === 0) {
        // Destruir gráfico se existir
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        // Mostrar mensagem
        const mensagemExistente = container.querySelector('.sem-dados');
        if (!mensagemExistente) {
            canvas.style.display = 'none';
            container.innerHTML += `
                <div class="sem-dados text-center text-muted py-5">
                    <i class="bi bi-lightning display-4 d-block mb-3"></i>
                    <h5 class="mb-2">Aguardando dados do PZEM 1</h5>
                    <p class="mb-0">O sensor principal ainda não enviou dados...</p>
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
    
    // Preparar labels do eixo X
    const labelsX = dadosProcessados.indices.map((indice, idx) => {
        const labelObj = dadosProcessados.labelsDias.find(l => l.indice === idx);
        return labelObj ? labelObj.label : '';
    });
    
    // Verificar se é uma atualização ou criação
    if (graficoConsumo) {
        // ATUALIZAÇÃO: Manter gráfico existente
        
        // Se a potência atual for 0, mas a anterior não era, manter o último valor
        // (evitar cair artificialmente para 0)
        const ultimoValor = dadosProcessados.potencias[dadosProcessados.potencias.length - 1];
        if (ultimoValor === 0 && ultimaPotencia !== null && ultimaPotencia > 0) {
            // Não atualizar para evitar queda artificial
            return;
        }
        
        // Atualizar último valor de potência
        ultimaPotencia = ultimoValor;
        
        // Atualizar dados
        graficoConsumo.data.labels = labelsX;
        graficoConsumo.data.datasets[0].data = dadosProcessados.potencias;
        
        // Atualizar separadores
        graficoConsumo.$separadoresDias = dadosProcessados.separadoresDias.map(pos => {
            return graficoConsumo.scales.x.getPixelForValue(pos);
        });
        
        // Atualizar marcadores
        graficoConsumo.$marcadoresFimDia = dadosProcessados.marcadoresFimDia;
        
        // Atualizar tooltips
        graficoConsumo.options.plugins.tooltip.callbacks.title = function(context) {
            const indice = context[0].dataIndex;
            const timestamp = dadosProcessados.timestamps[indice];
            
            if (timestamp) {
                try {
                    const data = new Date(timestamp);
                    if (!isNaN(data.getTime())) {
                        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                      'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                        const mes = meses[data.getMonth()];
                        const dia = data.getDate();
                        const hora = data.getHours().toString().padStart(2, '0');
                        const minuto = data.getMinutes().toString().padStart(2, '0');
                        return `${mes} ${dia} - ${hora}:${minuto}`;
                    }
                } catch (e) {
                    // Fallback
                }
            }
            return `Ponto ${indice + 1}`;
        };
        
        graficoConsumo.options.plugins.tooltip.callbacks.label = function(context) {
            const indice = context.dataIndex;
            const potencia = dadosProcessados.potencias[indice];
            return `Potência: ${potencia.toFixed(1)} W`;
        };
        
        graficoConsumo.options.plugins.tooltip.callbacks.afterBody = function(context) {
            const indice = context[0].dataIndex;
            return [
                `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`,
                `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`,
                `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`
            ];
        };
        
        // Atualizar suavemente
        graficoConsumo.update('active');
        
    } else {
        // CRIAÇÃO: Criar novo gráfico
        
        // Resetar última potência
        ultimaPotencia = null;
        
        // Destruir gráfico anterior se existir
        if (graficoConsumo) {
            graficoConsumo.destroy();
        }
        
        // Criar novo gráfico
        const ctx = canvas.getContext('2d');
        
        graficoConsumo = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsX,
                datasets: [{
                    label: 'PZEM 1 - Potência (W)',
                    data: dadosProcessados.potencias,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#0d6efd',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 500,
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
                                size: 12
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
                                const timestamp = dadosProcessados.timestamps[indice];
                                
                                if (timestamp) {
                                    try {
                                        const data = new Date(timestamp);
                                        if (!isNaN(data.getTime())) {
                                            const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                                          'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                                            const mes = meses[data.getMonth()];
                                            const dia = data.getDate();
                                            const hora = data.getHours().toString().padStart(2, '0');
                                            const minuto = data.getMinutes().toString().padStart(2, '0');
                                            return `${mes} ${dia} - ${hora}:${minuto}`;
                                        }
                                    } catch (e) {
                                        // Fallback
                                    }
                                }
                                return `Ponto ${indice + 1}`;
                            },
                            label: function(context) {
                                const indice = context.dataIndex;
                                const potencia = dadosProcessados.potencias[indice];
                                return `Potência: ${potencia.toFixed(1)} W`;
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
                                const labelObj = dadosProcessados.labelsDias.find(l => l.indice === index);
                                return labelObj ? labelObj.label : '';
                            },
                            maxTicksLimit: 15,
                            autoSkip: true,
                            autoSkipPadding: 30,
                            font: {
                                size: 11
                            },
                            color: '#666'
                        },
                        title: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: true,
                        grace: '5%',
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#666',
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
                        tension: 0.3,
                        cubicInterpolationMode: 'monotone'
                    }
                }
            }
        });
        
        // Armazenar separadores e marcadores
        graficoConsumo.$separadoresDias = dadosProcessados.separadoresDias.map(pos => {
            return graficoConsumo.scales.x.getPixelForValue(pos);
        });
        
        graficoConsumo.$marcadoresFimDia = dadosProcessados.marcadoresFimDia;
    }
}

// Função principal para carregar e atualizar
async function carregarEAtualizar() {
    try {
        const dados = await buscarDados();
        
        if (dados && dados.sucesso) {
            atualizarGraficoComDados(dados);
            ultimosDados = dados;
        }
    } catch (erro) {
        console.error('Erro na atualização:', erro);
    }
}

// Inicializar gráfico
function inicializarGrafico() {
    // Primeira carga
    carregarEAtualizar();
    
    // Configurar atualização automática a cada 10 segundos
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(carregarEAtualizar, 10000);
    
    // Redimensionar gráfico quando a janela mudar de tamanho
    let timeoutRedimensionamento;
    window.addEventListener('resize', function() {
        clearTimeout(timeoutRedimensionamento);
        timeoutRedimensionamento = setTimeout(() => {
            if (graficoConsumo) {
                graficoConsumo.resize();
                graficoConsumo.update('none');
            }
        }, 200);
    });
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarGrafico);
} else {
    inicializarGrafico();
}

// Exportar para debug
window.debugGraficoPzem1 = {
    atualizar: carregarEAtualizar,
    getDados: () => ultimosDados,
    getGrafico: () => graficoConsumo
};

console.log('✅ Gráfico PZEM 1 inicializado - Mostrando apenas dados do sensor principal');