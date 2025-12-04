// ===============================
// GRÁFICO DE CONSUMO MENSAL CORRIGIDO
// ===============================

let graficoConsumo = null;
let ultimaAtualizacao = null;
let intervaloAtualizacao = null;
const INTERVALO_MS = 10000; // 10 segundos
let dadosAtuais = null; // Armazenar dados atuais para comparação

// Plugin para desenhar linhas verticais a separar os dias
const separadorDiasPlugin = {
    id: "separadorDias",
    beforeDraw(chart, args, options) {
        const separadores = chart.$separadoresDias;
        if (!separadores || separadores.length === 0) return;
        
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        ctx.save();
        ctx.strokeStyle = chart.options.plugins?.separadorDias?.color || "rgba(100, 100, 100, 0.25)";
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = chart.options.plugins?.separadorDias?.width || 1;
        
        separadores.forEach(posX => {
            if (posX >= chartArea.left && posX <= chartArea.right) {
                ctx.beginPath();
                ctx.moveTo(posX, chartArea.top);
                ctx.lineTo(posX, chartArea.bottom);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
};

// Plugin para marcar fim do dia
const marcadorFimDiaPlugin = {
    id: "marcadorFimDia",
    afterDatasetsDraw(chart, args, options) {
        const marcadores = chart.$marcadoresFimDia;
        if (!marcadores || marcadores.length === 0) return;
        
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        ctx.save();
        ctx.fillStyle = chart.options.plugins?.marcadorFimDia?.color || "#ff6b6b";
        
        marcadores.forEach(marcador => {
            if (marcador.x >= chartArea.left && marcador.x <= chartArea.right) {
                ctx.beginPath();
                ctx.arc(marcador.x, marcador.y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Adicionar pequena linha vertical
                ctx.strokeStyle = chart.options.plugins?.marcadorFimDia?.color || "#ff6b6b";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(marcador.x, marcador.y - 8);
                ctx.lineTo(marcador.x, marcador.y + 8);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
};

// Registrar plugins
if (window.Chart) {
    Chart.register(separadorDiasPlugin, marcadorFimDiaPlugin);
}

// Função para formatar data no tooltip
function formatarTooltipData(dataHora) {
    if (!dataHora) return '';
    
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    try {
        // Se já for formato legível, retorna direto
        if (typeof dataHora === 'string' && dataHora.includes('jan') || 
            dataHora.includes('feb') || dataHora.includes('mar')) {
            return dataHora;
        }
        
        // Converter string para Date
        let data = new Date(dataHora);
        if (isNaN(data.getTime())) {
            // Tentar formatos alternativos
            const dataStr = dataHora.toString().replace('T', ' ').split('.')[0];
            data = new Date(dataStr);
            
            if (isNaN(data.getTime())) {
                // Última tentativa: manual parsing
                const match = dataHora.toString().match(/(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})/);
                if (match) {
                    const [_, ano, mes, dia, hora, minuto] = match;
                    data = new Date(ano, parseInt(mes)-1, dia, hora, minuto);
                }
            }
        }
        
        if (!isNaN(data.getTime())) {
            const mes = meses[data.getMonth()];
            const dia = data.getDate();
            const hora = data.getHours().toString().padStart(2, '0');
            const minuto = data.getMinutes().toString().padStart(2, '0');
            
            return `${mes} ${dia} - ${hora}:${minuto}`;
        }
        
        return dataHora.toString();
    } catch (e) {
        console.warn('Erro ao formatar data:', e, dataHora);
        return String(dataHora);
    }
}

// Verificar se dados são diferentes (evitar duplicação)
function dadosSaoDiferentes(novosDados, dadosAntigos) {
    if (!dadosAntigos || !novosDados) return true;
    if (!dadosAntigos.registos || !novosDados.registos) return true;
    if (dadosAntigos.registos.length !== novosDados.registos.length) return true;
    
    // Verificar se algum registro mudou
    for (let i = 0; i < novosDados.registos.length; i++) {
        const novo = novosDados.registos[i];
        const antigo = dadosAntigos.registos[i];
        
        if (!antigo) return true;
        
        // Comparar valores principais
        if (parseFloat(novo.potencia || novo.power || 0) !== 
            parseFloat(antigo.potencia || antigo.power || 0)) {
            return true;
        }
        
        if (novo.data_hora !== antigo.data_hora && 
            novo.timestamp !== antigo.timestamp &&
            novo.hora !== antigo.hora) {
            return true;
        }
    }
    
    return false;
}

// Buscar dados da API
async function buscarDadosMensais() {
    try {
        const resposta = await fetch('/api/historico-consumo-mensal?t=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        
        // Verificar se os dados são diferentes dos atuais
        if (dadosSaoDiferentes(dados, dadosAtuais)) {
            dadosAtuais = dados;
            
            // Atualizar timestamp da última atualização
            ultimaAtualizacao = new Date();
            const elementoAtualizacao = document.getElementById('ultimaAtualizacao');
            if (elementoAtualizacao) {
                elementoAtualizacao.textContent = 
                    `Última atualização: ${ultimaAtualizacao.toLocaleTimeString()}`;
            }
            
            return dados;
        }
        
        // Se dados são iguais, retornar null para evitar atualização desnecessária
        return null;
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
    const marcadoresFimDia = [];
    
    let diaAnterior = null;
    let primeiroPontoDia = true;
    let ultimoPontoDiaAnterior = null;
    
    registros.forEach((registro, indice) => {
        // Extrair dados do registro
        const dataHora = registro.data_hora || registro.timestamp || registro.hora || '';
        const potencia = parseFloat(registro.potencia || registro.power || 0);
        const tensao = parseFloat(registro.tensao || registro.voltage || 0);
        const corrente = parseFloat(registro.corrente || registro.current || 0);
        const energia = parseFloat(registro.energia || registro.energy || 0);
        
        // Extrair dia (YYYY-MM-DD)
        let diaAtual = '';
        if (dataHora) {
            const strData = dataHora.toString();
            const matchData = strData.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (matchData) {
                diaAtual = matchData[0];
            }
        }
        
        // Verificar mudança de dia
        if (diaAnterior !== null && diaAtual !== '' && diaAtual !== diaAnterior) {
            // Adicionar separador entre dias
            separadoresDias.push(indice - 0.5);
            
            // Adicionar marcador no último ponto do dia anterior
            if (ultimoPontoDiaAnterior !== null && potencias[ultimoPontoDiaAnterior] > 0) {
                marcadoresFimDia.push({
                    index: ultimoPontoDiaAnterior,
                    value: potencias[ultimoPontoDiaAnterior]
                });
            }
            
            primeiroPontoDia = true;
        }
        
        // Adicionar label no primeiro ponto de cada dia
        if (primeiroPontoDia || (diaAnterior !== diaAtual && diaAtual !== '')) {
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
        
        // Atualizar dia anterior e último ponto
        if (diaAtual) {
            diaAnterior = diaAtual;
        }
        ultimoPontoDiaAnterior = indice;
        
        // Adicionar aos arrays - MANTER VALORES ORIGINAIS, NÃO INTERPOLAR
        timestamps.push(dataHora);
        potencias.push(potencia);
        tensoes.push(tensao);
        correntes.push(corrente);
        energias.push(energia);
    });
    
    // Adicionar último marcador de fim de dia
    if (ultimoPontoDiaAnterior !== null && potencias.length > 0 && 
        potencias[ultimoPontoDiaAnterior] > 0) {
        marcadoresFimDia.push({
            index: ultimoPontoDiaAnterior,
            value: potencias[ultimoPontoDiaAnterior]
        });
    }
    
    return {
        timestamps,
        potencias,
        tensoes,
        correntes,
        energias,
        separadoresDias,
        labelsDias,
        marcadoresFimDia,
        totalPontos: registros.length
    };
}

// Atualizar gráfico com novos dados (SUAVE - sem destruir/reconstruir se possível)
function atualizarGraficoComDados(dados) {
    const container = document.getElementById('graficoConsumo');
    if (!container) {
        console.error('Canvas não encontrado');
        return;
    }
    
    const containerPai = container.parentElement;
    
    if (!dados || !dados.registos || dados.registos.length === 0) {
        // Se já estiver mostrando mensagem, não fazer nada
        const mensagemExistente = containerPai.querySelector('.sem-dados-mensagem');
        if (mensagemExistente) return;
        
        // Destruir gráfico se existir
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        
        // Mostrar mensagem de sem dados
        container.style.display = 'none';
        
        const mensagemHTML = `
            <div class="sem-dados-mensagem text-center text-muted py-5">
                <i class="bi bi-inbox display-4 d-block mb-3"></i>
                <h5 class="mb-2">Sem dados de histórico para este período</h5>
                <p class="mb-0">Aguardando novos registros...</p>
            </div>
        `;
        containerPai.insertAdjacentHTML('beforeend', mensagemHTML);
        return;
    }
    
    // Remover mensagem de sem dados se existir
    const mensagem = containerPai.querySelector('.sem-dados-mensagem');
    if (mensagem) {
        mensagem.remove();
    }
    container.style.display = 'block';
    
    // Processar dados
    const dadosProcessados = processarDadosParaGrafico(dados.registos);
    if (!dadosProcessados) return;
    
    // Se gráfico já existe, atualizar dados de forma suave
    if (graficoConsumo) {
        // Atualizar dados do gráfico existente
        graficoConsumo.data.labels = Array.from(
            {length: dadosProcessados.totalPontos}, 
            (_, i) => i
        );
        
        graficoConsumo.data.datasets[0].data = dadosProcessados.potencias;
        graficoConsumo.data.datasets[0].label = `Potência (W) - ${dadosProcessados.totalPontos} pontos`;
        
        // Configurar separadores
        graficoConsumo.$separadoresDias = dadosProcessados.separadoresDias.map(pos => {
            return graficoConsumo.scales.x.getPixelForValue(pos);
        });
        
        // Configurar marcadores de fim de dia
        graficoConsumo.$marcadoresFimDia = dadosProcessados.marcadoresFimDia.map(marcador => {
            const ponto = graficoConsumo.getDatasetMeta(0).data[marcador.index];
            return ponto ? { x: ponto.x, y: ponto.y } : null;
        }).filter(m => m !== null);
        
        // Configurar labels do eixo X
        graficoConsumo.options.scales.x.ticks.callback = function(value, index) {
            const labelObj = dadosProcessados.labelsDias.find(l => l.indicePonto === index);
            return labelObj ? labelObj.label : '';
        };
        
        // Configurar tooltips
        graficoConsumo.options.plugins.tooltip.callbacks.title = function(tooltipItems) {
            const indice = tooltipItems[0].dataIndex;
            return formatarTooltipData(dadosProcessados.timestamps[indice]);
        };
        
        graficoConsumo.options.plugins.tooltip.callbacks.label = function(context) {
            const indice = context.dataIndex;
            const potencia = dadosProcessados.potencias[indice];
            return `Potência: ${potencia.toFixed(1)} W`;
        };
        
        graficoConsumo.options.plugins.tooltip.callbacks.afterBody = function(tooltipItems) {
            const indice = tooltipItems[0].dataIndex;
            return [
                `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`,
                `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`,
                `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`
            ];
        };
        
        // Atualizar suavemente
        graficoConsumo.update('active');
        return;
    }
    
    // Se gráfico não existe, criar novo
    const ctx = container.getContext('2d');
    
    // Configurações do gráfico
    const config = {
        type: 'line',
        data: {
            labels: Array.from({length: dadosProcessados.totalPontos}, (_, i) => i),
            datasets: [{
                label: `Potência (W) - ${dadosProcessados.totalPontos} pontos`,
                data: dadosProcessados.potencias,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.05)',
                borderWidth: 2,
                tension: 0.3, // Linha suave mas não exagerada
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#0d6efd',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
                segment: {
                    borderColor: ctx => {
                        // Garantir linha contínua - não cair para zero artificialmente
                        const valores = ctx.p1.parsed.y === 0 && ctx.p2.parsed.y === 0 ? 
                            'rgba(13, 110, 253, 0.3)' : '#0d6efd';
                        return valores;
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500,
                easing: 'easeOutQuart',
                onProgress: function(animation) {
                    // Evitar piscar durante animação
                    if (animation.currentStep === 0) {
                        this.canvas.style.opacity = '1';
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
                axis: 'x'
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
                    enabled: true,
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
                            const linha1 = `Tensão: ${dadosProcessados.tensoes[indice].toFixed(1)} V`;
                            const linha2 = `Corrente: ${dadosProcessados.correntes[indice].toFixed(2)} A`;
                            const linha3 = `Energia: ${dadosProcessados.energias[indice].toFixed(3)} kWh`;
                            return [linha1, linha2, linha3];
                        }
                    }
                },
                separadorDias: {
                    color: 'rgba(100, 100, 100, 0.25)',
                    width: 1
                },
                marcadorFimDia: {
                    color: '#ff6b6b'
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function(value, index) {
                            const labelObj = dadosProcessados.labelsDias.find(l => l.indicePonto === index);
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
                    grace: '5%', // Dar um pouco de espaço no topo
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false,
                        drawTicks: true
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
                    tension: 0.3, // Linha suave
                    cubicInterpolationMode: 'monotone' // Evita overshoot
                }
            }
        }
    };
    
    // Criar gráfico
    graficoConsumo = new Chart(ctx, config);
    
    // Armazenar separadores e marcadores
    graficoConsumo.$separadoresDias = dadosProcessados.separadoresDias.map(pos => {
        return graficoConsumo.scales.x.getPixelForValue(pos);
    });
    
    graficoConsumo.$marcadoresFimDia = dadosProcessados.marcadoresFimDia.map(marcador => {
        const ponto = graficoConsumo.getDatasetMeta(0).data[marcador.index];
        return ponto ? { x: ponto.x, y: ponto.y } : null;
    }).filter(m => m !== null);
}

// Função principal para carregar e atualizar
async function carregarEAtualizarGrafico() {
    try {
        const dados = await buscarDadosMensais();
        
        // Se dados forem null (iguais aos anteriores), não atualizar
        if (dados === null) {
            return;
        }
        
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
    // Limpar qualquer intervalo existente
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
    
    // Primeira carga
    carregarEAtualizarGrafico();
    
    // Configurar atualização automática a cada 10 segundos
    intervaloAtualizacao = setInterval(carregarEAtualizarGrafico, INTERVALO_MS);
    
    // Redimensionar gráfico quando a janela mudar de tamanho
    let timeoutRedimensionamento;
    window.addEventListener('resize', function() {
        clearTimeout(timeoutRedimensionamento);
        timeoutRedimensionamento = setTimeout(() => {
            if (graficoConsumo) {
                graficoConsumo.resize();
                graficoConsumo.update('none'); // Atualizar sem animação
            }
        }, 200);
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
    
    dadosAtuais = null;
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Pequeno delay para garantir que tudo está carregado
        setTimeout(inicializarGraficoMensal, 100);
    });
} else {
    setTimeout(inicializarGraficoMensal, 100);
}

// Para páginas SPA: limpar recursos ao sair
window.addEventListener('beforeunload', limparRecursosGrafico);

// Para debug
window.debugGraficoMensal = {
    atualizar: carregarEAtualizarGrafico,
    reiniciar: function() {
        limparRecursosGrafico();
        inicializarGraficoMensal();
    },
    getDados: function() { return dadosAtuais; },
    getGrafico: function() { return graficoConsumo; }
};