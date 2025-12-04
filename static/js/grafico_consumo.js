// ===============================
// GRÁFICO DE CONSUMO MENSAL COMPLETO
// ===============================

let graficoConsumo = null;
let ultimaAtualizacao = null;
let intervaloAtualizacao = null;
const INTERVALO_MS = 10000; // 10 segundos

// Plugin para desenhar linhas verticais a separar os dias
const separadorDiasPlugin = {
    id: "separadorDias",
    beforeDraw(chart, args, options) {
        const separadores = chart.$separadoresDias;
        if (!separadores || separadores.length === 0) return;
        
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1;
        
        separadores.forEach(posX => {
            if (posX > chartArea.left && posX < chartArea.right) {
                ctx.beginPath();
                ctx.moveTo(posX, chartArea.top);
                ctx.lineTo(posX, chartArea.bottom);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
};

// Plugin para distribuição uniforme dos pontos
const distribuirPontosPlugin = {
    id: "distribuirPontos",
    beforeDatasetDraw(chart, args, options) {
        const meta = chart.getDatasetMeta(0);
        if (!meta.data || meta.data.length === 0) return;
        
        const chartArea = chart.chartArea;
        const totalPontos = meta.data.length;
        
        // Usar 95% da largura para distribuição uniforme
        const larguraUtil = (chartArea.right - chartArea.left) * 0.95;
        const espacamento = larguraUtil / totalPontos;
        const margemInicial = (chartArea.right - chartArea.left - larguraUtil) / 2;
        
        // Distribuir pontos uniformemente
        meta.data.forEach((ponto, index) => {
            const xPos = chartArea.left + margemInicial + (espacamento * index) + (espacamento / 2);
            ponto.x = xPos;
            // Mantém o valor Y original
        });
    }
};

// Registrar plugins
if (window.Chart) {
    Chart.register(separadorDiasPlugin, distribuirPontosPlugin);
}

// Função para formatar data no tooltip
function formatarTooltipData(dataHora) {
    if (!dataHora) return '';
    
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    try {
        // Remover timezone se existir
        let dataStr = dataHora.toString();
        if (dataStr.includes('+')) {
            dataStr = dataStr.split('+')[0];
        }
        
        const data = new Date(dataStr);
        if (isNaN(data.getTime())) {
            // Tentar parse manualmente
            const partes = dataStr.split(/[- :T]/);
            if (partes.length >= 5) {
                const ano = parseInt(partes[0]) || 2024;
                const mes = (parseInt(partes[1]) || 1) - 1;
                const dia = parseInt(partes[2]) || 1;
                const hora = parseInt(partes[3]) || 0;
                const minuto = parseInt(partes[4]) || 0;
                
                return `${meses[mes]} ${dia} - ${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            }
            return dataStr;
        }
        
        const mes = meses[data.getMonth()];
        const dia = data.getDate();
        const hora = data.getHours().toString().padStart(2, '0');
        const minuto = data.getMinutes().toString().padStart(2, '0');
        
        return `${mes} ${dia} - ${hora}:${minuto}`;
    } catch (e) {
        console.warn('Erro ao formatar data:', e);
        return dataHora;
    }
}

// Função para formatar labels do eixo X
function formatarLabelDia(dataHora, index, labelsDias) {
    if (!labelsDias || labelsDias.length === 0) return '';
    
    // Encontrar se este índice tem label especial
    const labelObj = labelsDias.find(l => l.indicePonto === index);
    return labelObj ? labelObj.label : '';
}

// Buscar dados da API
async function buscarDadosMensais() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal');
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        // Atualizar timestamp da última atualização
        ultimaAtualizacao = new Date();
        const elementoAtualizacao = document.getElementById('ultimaAtualizacao');
        if (elementoAtualizacao) {
            elementoAtualizacao.textContent = 
                `Última atualização: ${ultimaAtualizacao.toLocaleTimeString()}`;
        }
        
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar dados históricos:', erro);
        throw erro;
    }
}

// Processar dados para o gráfico
function processarDadosParaGrafico(registros) {
    if (!registros || !Array.isArray(registros)) {
        return null;
    }
    
    const timestamps = [];
    const potencias = [];
    const tensoes = [];
    const correntes = [];
    const energias = [];
    const separadoresDias = [];
    const labelsDias = [];
    
    let diaAnterior = null;
    let primeiroPontoDia = true;
    let indiceUltimoSeparador = -1;
    
    registros.forEach((registro, indice) => {
        // Extrair dados do registro
        const dataHora = registro.data_hora || registro.timestamp || registro.hora;
        const potencia = parseFloat(registro.potencia || registro.power || 0);
        const tensao = parseFloat(registro.tensao || registro.voltage || 0);
        const corrente = parseFloat(registro.corrente || registro.current || 0);
        const energia = parseFloat(registro.energia || registro.energy || 0);
        
        // Extrair dia (YYYY-MM-DD)
        let diaAtual = '';
        if (dataHora) {
            const dataStr = dataHora.toString().split(' ')[0];
            if (dataStr.includes('-')) {
                diaAtual = dataStr;
            }
        }
        
        // Verificar mudança de dia para separadores
        if (diaAnterior !== null && diaAtual !== '' && diaAtual !== diaAnterior) {
            // Adicionar separador entre dias diferentes
            // Posição média entre último ponto do dia anterior e primeiro do novo dia
            const posSeparador = indice - 0.5;
            separadoresDias.push(posSeparador);
            indiceUltimoSeparador = indice;
        }
        
        // Adicionar label no primeiro ponto de cada dia
        if (primeiroPontoDia || diaAnterior !== diaAtual) {
            if (diaAtual) {
                const partes = diaAtual.split('-');
                if (partes.length >= 3) {
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mes = meses[parseInt(partes[1]) - 1] || 'jan';
                    const dia = parseInt(partes[2]) || 1;
                    
                    labelsDias.push({
                        indicePonto: indice,
                        label: `${mes} ${dia}`
                    });
                }
            }
            primeiroPontoDia = false;
        }
        
        // Atualizar dia anterior
        if (diaAtual) {
            diaAnterior = diaAtual;
        }
        
        // Adicionar aos arrays
        timestamps.push(dataHora);
        potencias.push(potencia);
        tensoes.push(tensao);
        correntes.push(corrente);
        energias.push(energia);
    });
    
    return {
        timestamps,
        potencias,
        tensoes,
        correntes,
        energias,
        separadoresDias,
        labelsDias,
        totalPontos: registros.length
    };
}

// Atualizar gráfico com novos dados
function atualizarGraficoComDados(dados) {
    const container = document.getElementById('graficoConsumo');
    const containerPai = container ? container.parentElement : null;
    
    if (!dados || !dados.registos || dados.registos.length === 0) {
        // Destruir gráfico se existir
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        // Mostrar mensagem de sem dados
        if (containerPai) {
            const mensagemHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox display-4 d-block mb-3"></i>
                    <h5 class="mb-2">Sem dados de histórico para este período</h5>
                    <p class="mb-0">Aguardando novos registros...</p>
                </div>
            `;
            
            // Verificar se já tem mensagem
            const mensagemExistente = containerPai.querySelector('.text-center');
            if (!mensagemExistente) {
                const canvas = containerPai.querySelector('canvas');
                if (canvas) {
                    canvas.style.display = 'none';
                }
                containerPai.insertAdjacentHTML('beforeend', mensagemHTML);
            }
        }
        return;
    }
    
    // Remover mensagem de sem dados se existir
    if (containerPai) {
        const mensagem = containerPai.querySelector('.text-center');
        if (mensagem) {
            mensagem.remove();
        }
        const canvas = containerPai.querySelector('canvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
    }
    
    // Processar dados
    const dadosProcessados = processarDadosParaGrafico(dados.registos);
    if (!dadosProcessados) return;
    
    // Destruir gráfico anterior
    if (graficoConsumo) {
        graficoConsumo.destroy();
        graficoConsumo = null;
    }
    
    // Obter contexto
    const ctx = container ? container.getContext('2d') : null;
    if (!ctx) {
        console.error('Canvas não encontrado');
        return;
    }
    
    // Preparar dados para o Chart.js
    const labelsIndices = Array.from({length: dadosProcessados.totalPontos}, (_, i) => i);
    
    // Configurações do gráfico
    graficoConsumo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsIndices,
            datasets: [{
                label: 'Potência (W)',
                data: dadosProcessados.potencias,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#0d6efd'
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
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        title: function(tooltipItems) {
                            const indice = tooltipItems[0].dataIndex;
                            return formatarTooltipData(dadosProcessados.timestamps[indice]);
                        },
                        label: function(context) {
                            const indice = context.dataIndex;
                            const potencia = dadosProcessados.potencias[indice];
                            return `Potência: ${potencia.toFixed(1)} W`;
                        },
                        afterBody: function(tooltipItems) {
                            const indice = tooltipItems[0].dataIndex;
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
                        callback: function(value, index) {
                            return formatarLabelDia(dadosProcessados.timestamps[index], index, dadosProcessados.labelsDias);
                        },
                        maxTicksLimit: 15,
                        autoSkip: true,
                        autoSkipPadding: 20
                    },
                    title: {
                        display: true,
                        text: 'Dias do Mês',
                        color: '#666',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Potência (W)',
                        color: '#666',
                        font: {
                            size: 12,
                            weight: 'normal'
                        }
                    }
                }
            }
        }
    });
    
    // Armazenar separadores para o plugin
    if (graficoConsumo && dadosProcessados.separadoresDias.length > 0) {
        graficoConsumo.$separadoresDias = dadosProcessados.separadoresDias.map(pos => {
            if (graficoConsumo.scales.x) {
                return graficoConsumo.scales.x.getPixelForValue(pos);
            }
            return null;
        }).filter(p => p !== null);
    }
}

// Função principal para carregar e atualizar
async function carregarEAtualizarGrafico() {
    try {
        const dados = await buscarDadosMensais();
        
        if (!dados.sucesso) {
            console.error('Erro na API:', dados.mensagem);
            return;
        }
        
        atualizarGraficoComDados(dados);
    } catch (erro) {
        console.error('Erro ao atualizar gráfico:', erro);
    }
}

// Inicializar gráfico
function inicializarGraficoMensal() {
    // Primeira carga
    carregarEAtualizarGrafico();
    
    // Configurar atualização automática a cada 10 segundos
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    intervaloAtualizacao = setInterval(carregarEAtualizarGrafico, INTERVALO_MS);
    
    // Redimensionar gráfico quando a janela mudar de tamanho
    let timeoutRedimensionamento;
    window.addEventListener('resize', function() {
        clearTimeout(timeoutRedimensionamento);
        timeoutRedimensionamento = setTimeout(() => {
            if (graficoConsumo) {
                graficoConsumo.resize();
            }
        }, 250);
    });
}

// Limpar recursos
function limparRecursosGrafico() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
        intervaloAtualizacao = null;
    }
    
    if (graficoConsumo) {
        graficoConsumo.destroy();
        graficoConsumo = null;
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarGraficoMensal);
} else {
    inicializarGraficoMensal();
}

// Para depuração: expor funções no console se necessário
window.GraficoMensal = {
    atualizar: carregarEAtualizarGrafico,
    reiniciar: inicializarGraficoMensal,
    limpar: limparRecursosGrafico
};