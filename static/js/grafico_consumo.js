// ===============================
// GRÁFICO DE CONSUMO MENSAL
// ===============================

let graficoConsumo = null;

async function carregarHistorico() {
    try {
        const resp = await fetch("/api/historico-consumo-mensal");
        const dados = await resp.json();

        if (!dados.sucesso) {
            console.error("Erro:", dados.mensagem);
            return;
        }

        atualizarGrafico(dados.registos);

    } catch (erro) {
        console.error("Erro ao buscar dados históricos:", erro);
    }
}

function atualizarGrafico(registos) {
    // Usar somente valores reais da BD
    const labels   = registos.map(r => r.hora);
    const potencias = registos.map(r => Number(r.potencia));
    const tensoes   = registos.map(r => Number(r.tensao));
    const correntes = registos.map(r => Number(r.corrente));
    const energias  = registos.map(r => Number(r.energia));

    // Se existir gráfico anterior → destruir
    if (graficoConsumo) graficoConsumo.destroy();

    const ctx = document.getElementById("graficoConsumo").getContext("2d");

    graficoConsumo = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Potência (W)",
                data: potencias,
                borderWidth: 2,
                borderColor: "#0d6efd",
                tension: 0.3,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "nearest",
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        footer: function (ctx) {
                            let i = ctx[0].dataIndex;
                            return `Tensão: ${tensoes[i]}V | Corrente: ${correntes[i]}A | Energia: ${energias[i]} kWh`;
                        }
                    }
                }
            },
            scales: {
                x: { display: true },
                y: { display: true }
            }
        }
    });
}


// Atualiza automaticamente a cada 30s
setInterval(carregarHistorico, 30000);

// Primeira carga
document.addEventListener("DOMContentLoaded", carregarHistorico);
