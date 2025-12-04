// ===============================
// GRÁFICO DE CONSUMO MENSAL CORRIGIDO
// ===============================

let graficoConsumo = null;
let intervaloAtualizacao = null;
let dadosOriginais = []; // Armazenar dados originais

// Função para buscar dados
async function carregarDados() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal?_=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error('Erro na resposta da API: ' + resposta.status);
        }
        
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            // Verificar se os dados são diferentes
            if (JSON.stringify(dados.registos) !== JSON.stringify(dadosOriginais)) {
                dadosOriginais = dados.registos;
                atualizarGrafico(dados.registos);
            }
        } else {
            console.error('API retornou erro:', dados.mensagem);
        }
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
    }
}

// Função para atualizar o gráfico
function atualizarGrafico(registros) {
    const canvas = document.getElementById('graficoConsumo');
    if (!canvas) return;
    
    const container = canvas.parentElement.parentElement;
    
    // Se não houver registros
    if (!registros || registros.length === 0) {
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        const mensagemExistente = container.querySelector('.sem-dados');
        if (!mensagemExistente) {
            canvas.style.display = 'none';
            container.innerHTML += `
                <div class="sem-dados text-center text-muted py-5">
                    <i class="bi bi-inbox display-4 d-block mb-3"></i>
                    <h5 class="mb-2">Sem dados disponíveis</h5>
                    <p class="mb-0">Aguardando dados do sistema...</p>
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
    const dadosProcessados = processarDados(registros);
    
    // Se já existe gráfico, atualizar dados
    if (graficoConsumo) {
        graficoConsumo.data.labels = dadosProcessados.labels;
        graficoConsumo.data.datasets[0].data = dadosProcessados.potencias;
        
        // Atualizar separadores
        if (dadosProcessados.marcadoresFimDia && dadosProcessados.marcadoresFimDia.length > 0) {
            atualizarMarcadoresFimDia(graficoConsumo, dadosProcessados.marcadoresFimDia);
        }
        
        graficoConsumo.update();
        return;
    }
    
    // Criar novo gráfico
    const ctx = canvas.getContext('2d');
    
    graficoConsumo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosProcessados.labels,
            datasets: [{
                label: 'Potência (W)',
                data: dadosProcessados.potencias,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.3, // Linha suave
                fill: false,
                pointRadius: 0, // Sem pontos na linha principal
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#0d6efd',
                segment: {
                    borderColor: ctx => 'rgba(13, 110, 253, 1)' // Linha contínua sem interrupções
                }
            },
            // Dataset adicional para marcadores de fim de dia
            {
                label: 'Fim do Dia',
                data: dadosProcessados.marcadoresData,
                borderColor: '#ff6b6b',
                backgroundColor: '#ff6b6b',
                borderWidth: 0,
                pointRadius: 4, // Pontos visíveis apenas para fim de dia
                pointHoverRadius: 8,
                pointStyle: 'circle',
                showLine: false // Não conectar os pontos com linha
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        filter: function(item) {
                            return item.text !== 'Fim do Dia'; // Esconder legenda dos marcadores
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const reg = registros[index];
                            const dataHora = reg.data_hora || reg.timestamp || reg.hora || '';
                            
                            if (dataHora) {
                                try {
                                    const data = new Date(dataHora);
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
                                    // Fallback para formato string
                                    return dataHora;
                                }
                            }
                            return `Ponto ${index + 1}`;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const reg = registros[index];
                            const potencia = parseFloat(reg.potencia || reg.power || 0);
                            const datasetLabel = context.dataset.label || '';
                            
                            if (datasetLabel === 'Fim do Dia') {
                                return `Fim do dia: ${potencia.toFixed(1)} W`;
                            }
                            return `Potência: ${potencia.toFixed(1)} W`;
                        },
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const reg = registros[index];
                            const tensao = parseFloat(reg.tensao || reg.voltage || 0);
                            const corrente = parseFloat(reg.corrente || reg.current || 0);
                            const energia = parseFloat(reg.energia || reg.energy || 0);
                            
                            return [
                                `Tensão: ${tensao.toFixed(1)} V`,
                                `Corrente: ${corrente.toFixed(2)} A`,
                                `Energia: ${energia.toFixed(3)} kWh`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(value, index) {
                            const labelObj = dadosProcessados.labelsDias.find(l => l.index === index);
                            return labelObj ? labelObj.label : '';
                        },
                        maxTicksLimit: 15,
                        autoSkip: true
                    },
                    grid: {
                        color: function(context) {
                            // Desenhar linha vertical para separar dias
                            const labelObj = dadosProcessados.labelsDias.find(l => l.index === context.index);
                            if (labelObj && labelObj.index === context.index) {
                                return 'rgba(0, 0, 0, 0.1)';
                            }
                            return 'rgba(0, 0, 0, 0.05)';
                        },
                        lineWidth: function(context) {
                            const labelObj = dadosProcessados.labelsDias.find(l => l.index === context.index);
                            if (labelObj && labelObj.index === context.index) {
                                return 2;
                            }
                            return 1;
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grace: '10%', // Dar espaço no topo
                    title: {
                        display: true,
                        text: 'Potência (W)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' W';
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.3 // Linha suave
                }
            }
        }
    });
    
    // Adicionar plugin customizado para melhor separação de dias
    Chart.register({
        id: 'separadorDiasCustom',
        afterDraw: function(chart) {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            
            ctx.save();
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.setLineDash([5, 3]);
            ctx.lineWidth = 1;
            
            dadosProcessados.labelsDias.forEach(labelObj => {
                if (labelObj.index > 0) {
                    const pixel = xAxis.getPixelForValue(labelObj.index - 0.5);
                    
                    if (pixel > xAxis.left && pixel < xAxis.right) {
                        ctx.beginPath();
                        ctx.moveTo(pixel, yAxis.top);
                        ctx.lineTo(pixel, yAxis.bottom);
                        ctx.stroke();
                    }
                }
            });
            
            ctx.restore();
        }
    });
}

// Processar dados
function processarDados(registros) {
    const labels = [];
    const potencias = [];
    const labelsDias = [];
    const marcadoresFimDia = [];
    const marcadoresData = [];
    
    let diaAnterior = '';
    let ultimoIndiceDia = -1;
    let primeiraLeituraDia = true;
    
    // Inicializar array de marcadores com null
    registros.forEach(() => {
        marcadoresData.push(null);
    });
    
    registros.forEach((reg, index) => {
        // Extrair data/hora
        const dataHora = reg.data_hora || reg.timestamp || reg.hora || '';
        
        // Extrair potência
        const potencia = parseFloat(reg.potencia || reg.power || 0);
        potencias.push(potencia);
        
        // Criar label do eixo X
        labels.push(index);
        
        // Extrair dia
        let diaAtual = '';
        if (dataHora) {
            const match = dataHora.toString().match(/(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                diaAtual = match[0];
            }
        }
        
        // Verificar mudança de dia
        if (diaAtual && diaAtual !== diaAnterior) {
            // Adicionar marcador no último ponto do dia anterior
            if (ultimoIndiceDia >= 0 && potencias[ultimoIndiceDia] > 0) {
                marcadoresFimDia.push(ultimoIndiceDia);
                marcadoresData[ultimoIndiceDia] = potencias[ultimoIndiceDia];
            }
            
            // Adicionar label para novo dia
            if (primeiraLeituraDia && diaAtual) {
                const partes = diaAtual.split('-');
                if (partes.length === 3) {
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mes = meses[parseInt(partes[1]) - 1] || 'jan';
                    const dia = parseInt(partes[2]) || 1;
                    
                    labelsDias.push({
                        index: index,
                        label: `${mes} ${dia}`
                    });
                }
            }
            
            diaAnterior = diaAtual;
            primeiraLeituraDia = true;
        }
        
        ultimoIndiceDia = index;
    });
    
    // Adicionar último marcador se necessário
    if (ultimoIndiceDia >= 0 && potencias[ultimoIndiceDia] > 0) {
        marcadoresFimDia.push(ultimoIndiceDia);
        marcadoresData[ultimoIndiceDia] = potencias[ultimoIndiceDia];
    }
    
    return {
        labels,
        potencias,
        labelsDias,
        marcadoresFimDia,
        marcadoresData,
        registros
    };
}

// Atualizar marcadores de fim de dia
function atualizarMarcadoresFimDia(grafico, marcadores) {
    if (!grafico.data.datasets[1]) {
        // Adicionar dataset de marcadores se não existir
        const marcadoresData = new Array(grafico.data.labels.length).fill(null);
        marcadores.forEach(idx => {
            if (grafico.data.datasets[0].data[idx] !== undefined) {
                marcadoresData[idx] = grafico.data.datasets[0].data[idx];
            }
        });
        
        grafico.data.datasets.push({
            label: 'Fim do Dia',
            data: marcadoresData,
            borderColor: '#ff6b6b',
            backgroundColor: '#ff6b6b',
            borderWidth: 0,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointStyle: 'circle',
            showLine: false
        });
    } else {
        // Atualizar dataset existente
        const marcadoresData = new Array(grafico.data.labels.length).fill(null);
        marcadores.forEach(idx => {
            if (grafico.data.datasets[0].data[idx] !== undefined) {
                marcadoresData[idx] = grafico.data.datasets[0].data[idx];
            }
        });
        grafico.data.datasets[1].data = marcadoresData;
    }
}

// Inicializar
function iniciarGrafico() {
    // Primeira carga
    carregarDados();
    
    // Atualizar a cada 10 segundos
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(carregarDados, 10000);
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarGrafico);
} else {
    iniciarGrafico();
}

// Para debug no console
window.debugGrafico = {
    atualizar: carregarDados,
    getDados: () => dadosOriginais,
    getGrafico: () => graficoConsumo
};