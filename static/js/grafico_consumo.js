// ===============================
// GRÁFICO DE CONSUMO MENSAL SIMPLIFICADO
// ===============================

let graficoConsumo = null;
let intervaloAtualizacao = null;

// Função para buscar dados
async function carregarDados() {
    try {
        console.log('Buscando dados da API...');
        const resposta = await fetch('/api/historico-consumo-mensal?_=' + Date.now());
        
        if (!resposta.ok) {
            throw new Error('Erro na resposta da API: ' + resposta.status);
        }
        
        const dados = await resposta.json();
        console.log('Dados recebidos:', dados);
        
        if (dados.sucesso) {
            atualizarGrafico(dados.registos);
        } else {
            console.error('API retornou erro:', dados.mensagem);
        }
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
    }
}

// Função para atualizar o gráfico
function atualizarGrafico(registros) {
    console.log('Atualizando gráfico com', registros?.length, 'registros');
    
    const canvas = document.getElementById('graficoConsumo');
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    const container = canvas.parentElement.parentElement;
    
    // Se não houver registros
    if (!registros || registros.length === 0) {
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
    
    // Preparar dados
    const labels = [];
    const potencias = [];
    const labelsDias = [];
    
    let diaAnterior = '';
    
    registros.forEach((reg, index) => {
        // Extrair data/hora
        const dataHora = reg.data_hora || reg.timestamp || reg.hora || '';
        
        // Extrair potência
        const potencia = parseFloat(reg.potencia || reg.power || 0);
        potencias.push(potencia);
        
        // Criar label do eixo X
        labels.push(index); // Usar índice como label
        
        // Verificar mudança de dia para labels
        if (dataHora) {
            const dataStr = dataHora.toString().split(' ')[0]; // YYYY-MM-DD
            if (dataStr !== diaAnterior) {
                // Extrair mês e dia
                const partes = dataStr.split('-');
                if (partes.length === 3) {
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mes = meses[parseInt(partes[1]) - 1] || 'jan';
                    const dia = parseInt(partes[2]) || 1;
                    
                    labelsDias.push({
                        index: index,
                        label: `${mes} ${dia}`
                    });
                    diaAnterior = dataStr;
                }
            }
        }
    });
    
    console.log('Dados processados:', { 
        total: potencias.length, 
        labelsDias: labelsDias.length,
        maxPotencia: Math.max(...potencias)
    });
    
    // Se já existe gráfico, atualizar
    if (graficoConsumo) {
        graficoConsumo.data.labels = labels;
        graficoConsumo.data.datasets[0].data = potencias;
        
        // Configurar labels do eixo X
        graficoConsumo.options.scales.x.ticks.callback = function(value, index) {
            const labelObj = labelsDias.find(l => l.index === index);
            return labelObj ? labelObj.label : '';
        };
        
        graficoConsumo.update();
        return;
    }
    
    // Criar novo gráfico
    const ctx = canvas.getContext('2d');
    
    graficoConsumo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Potência (W)',
                data: potencias,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                tension: 0.2,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const reg = registros[index];
                            const dataHora = reg.data_hora || reg.timestamp || reg.hora || '';
                            
                            if (dataHora) {
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
                            }
                            return `Ponto ${index + 1}`;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const reg = registros[index];
                            const potencia = parseFloat(reg.potencia || reg.power || 0);
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
                            const labelObj = labelsDias.find(l => l.index === index);
                            return labelObj ? labelObj.label : '';
                        },
                        maxTicksLimit: 20
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Potência (W)'
                    }
                }
            }
        }
    });
    
    console.log('Gráfico criado com sucesso!');
}

// Inicializar
function iniciarGrafico() {
    console.log('Iniciando gráfico mensal...');
    
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