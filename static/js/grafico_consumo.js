/// ===============================
// GRÁFICO DE CONSUMO MENSAL
// ===============================

let graficoConsumo = null;

// Plugin para desenhar linhas verticais a separar os dias
const separadorDiasPlugin = {
    id: "separadorDias",
    afterDraw(chart, args, options) {
        const diaIndices = chart.$diaIndices;
        if (!diaIndices || diaIndices.length < 2) return;

        const meta = chart.getDatasetMeta(0);
        const pontos = meta.data;
        if (!pontos || !pontos.length) return;

        const ctx = chart.ctx;
        const area = chart.chartArea;

        ctx.save();
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        for (let i = 1; i < diaIndices.length; i++) {
            if (diaIndices[i] !== diaIndices[i - 1]) {
                const x = (pontos[i - 1].x + pontos[i].x) / 2;
                ctx.beginPath();
                ctx.moveTo(x, area.top);
                ctx.lineTo(x, area.bottom);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
};

if (window.Chart) {
    Chart.register(separadorDiasPlugin);
}

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
    const container = document.getElementById("graficoConsumo");

    if (!registos || !registos.length) {
        if (graficoConsumo) {
            graficoConsumo.destroy();
            graficoConsumo = null;
        }
        if (container) {
            const parent = container.parentElement;
            if (parent) {
                parent.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-inbox"></i>
                        <p class="mb-0">Sem dados de histórico para este período.</p>
                    </div>
                `;
            }
        }
        return;
    }

    // --- 1) Arrays base (mantém tudo como já tinhas) ---
    const horas     = registos.map(r => r.hora);                     // Ex: "09:31" ou "2025-12-02 09:31"
    const potencias = registos.map(r => Number(r.potencia));
    const tensoes   = registos.map(r => Number(r.tensao));
    const correntes = registos.map(r => Number(r.corrente));
    const energias  = registos.map(r => Number(r.energia));

    // --- 2) Agrupar por dia (sem somar, só para compressão visual) ---
    function obterDiaKey(r) {
        // Tenta vários campos possíveis
        if (r.dia) return r.dia;
        if (r.data) return r.data;
        if (r.data_hora) return String(r.data_hora).slice(0, 10);

        // Se hora vier como "YYYY-MM-DD HH:MM"
        if (r.hora && r.hora.length > 5 && r.hora.includes(" ")) {
            return r.hora.split(" ")[0]; // pega "YYYY-MM-DD"
        }

        // Último recurso: tudo no mesmo dia
        return "DIA_UNICO";
    }

    const diaKeyToIndex = new Map();     // key -> índice numérico
    const diaLabels = [];                // índice -> "Dia 1", "Dia 2", ...
    const diaIndicesPorPonto = [];       // por ponto -> índice de dia

    let proximoNumeroDia = 1;

    registos.forEach((r, idx) => {
        const key = obterDiaKey(r);
        let idxDia;

        if (diaKeyToIndex.has(key)) {
            idxDia = diaKeyToIndex.get(key);
        } else {
            idxDia = diaLabels.length;
            diaKeyToIndex.set(key, idxDia);
            diaLabels.push(`Dia ${proximoNumeroDia}`);
            proximoNumeroDia += 1;
        }

        diaIndicesPorPonto.push(idxDia);
    });

    // Labels compactadas: no eixo X só aparece Dia 1, Dia 2, ...
    const labelsCompactas = diaIndicesPorPonto.map(idxDia => diaLabels[idxDia]);

    // --- 3) Destruir gráfico anterior, se existir ---
    if (graficoConsumo) graficoConsumo.destroy();

    const ctx = document.getElementById("graficoConsumo").getContext("2d");

    graficoConsumo = new Chart(ctx, {
        type: "line",
        data: {
            labels: labelsCompactas,
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
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        // Título do tooltip: Dia X - HH:MM
                        title: function (ctx) {
                            const i = ctx[0].dataIndex;
                            const diaLabel = diaLabels[diaIndicesPorPonto[i]] || "";
                            const hora = horas[i] || "";
                            return `${diaLabel} - ${hora}`;
                        },
                        // Linha principal: Potência
                        label: function (ctx) {
                            const i = ctx.dataIndex;
                            return `Potência: ${potencias[i]} W`;
                        },
                        // Rodapé: tensão, corrente, energia (mantido)
                        footer: function (ctx) {
                            const i = ctx[0].dataIndex;
                            return `Tensão: ${tensoes[i]}V | Corrente: ${correntes[i]}A | Energia: ${energias[i]} kWh`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: Math.min(diaLabels.length, 10),
                        // Só mostra "Dia X" no primeiro ponto de cada dia
                        callback: function (value, index, ticks) {
                            const idx = value; // value é o índice do ponto
                            const diaAtual = diaIndicesPorPonto[idx];
                            const diaAnterior = idx > 0 ? diaIndicesPorPonto[idx - 1] : null;

                            if (diaAtual !== diaAnterior) {
                                return diaLabels[diaAtual];
                            }
                            return "";
                        }
                    }
                },
                y: {
                    display: true
                }
            }
        }
    });

    // Guardar info dos dias no gráfico para o plugin desenhar separadores
    graficoConsumo.$diaIndices = diaIndicesPorPonto;
}

// Atualiza automaticamente a cada 30s
setInterval(carregarHistorico, 30000);

// Primeira carga
document.addEventListener("DOMContentLoaded", carregarHistorico);
