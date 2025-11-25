// static/js/dashboard_reset.js

(function () {
    console.log("🔧 dashboard_reset.js carregado");

    // 🔹 Mapeamento dos KPIs para IDs do HTML e textos padrão
    const KPI_CONFIG = {
        currentPower: {
            valueId: "kpi-current-power",
            defaultText: "0 W"
        },
        todayEnergy: {
            valueId: "kpi-today-energy",
            defaultText: "0 kWh"
        },
        todayCost: {
            valueId: "kpi-today-cost",
            defaultText: "MZN 0,00"
        },
        peakToday: {
            valueId: "kpi-peak-today",
            defaultText: "0 W",
            timeId: "kpi-peak-time",
            defaultTime: "--:--"
        },
        peakWeekly: {
            valueId: "kpi-peak-weekly",
            defaultText: "0 W",
            timeId: "kpi-peak-weekly-time",
            defaultTime: "--:--"
        },
        peakMonthly: {
            valueId: "kpi-peak-monthly",
            defaultText: "0 W",
            timeId: "kpi-peak-monthly-time",
            defaultTime: "--:--"
        },
        savings: {
            valueId: "kpi-savings",
            defaultText: "0%"
        }
    };

    // 🔹 Tradução dos valores do <select> para as chaves internas
    const KPI_OPTIONS_MAP = {
        currentPower: ["currentPower"],
        todayEnergy: ["todayEnergy"],
        todayCost: ["todayCost"],
        peakToday: ["peakToday"],
        peakWeekly: ["peakWeekly"],
        peakMonthly: ["peakMonthly"],
        savings: ["savings"],
        all: Object.keys(KPI_CONFIG)
    };

    // 🔹 Estado global de reset (só frontend)
    window.kpiResetState = window.kpiResetState || {};
    Object.keys(KPI_CONFIG).forEach(k => {
        if (typeof window.kpiResetState[k] === "undefined") {
            window.kpiResetState[k] = false;
        }
    });

    // 🔹 Função para aplicar o "zero" na DOM
    function aplicarResetNaDOM(kpiKey) {
        const cfg = KPI_CONFIG[kpiKey];
        if (!cfg) return;

        const valueEl = document.getElementById(cfg.valueId);
        if (valueEl && typeof cfg.defaultText !== "undefined") {
            valueEl.textContent = cfg.defaultText;
        }

        if (cfg.timeId) {
            const timeEl = document.getElementById(cfg.timeId);
            if (timeEl && typeof cfg.defaultTime !== "undefined") {
                timeEl.textContent = cfg.defaultTime;
            }
        }
    }

    // 🔹 Função chamada pelo botão "Resetar KPI"
    window.resetarKPI = function () {
        const select = document.getElementById("kpi-reset-select");
        const msgBox = document.getElementById("msg-reset-kpi");

        if (!select) {
            console.warn("⚠️ Select de reset de KPI não encontrado (kpi-reset-select).");
            return;
        }

        const option = select.value || "all";
        const targets = KPI_OPTIONS_MAP[option] || [];

        if (targets.length === 0) {
            if (msgBox) {
                msgBox.innerHTML = `<div class="alert alert-warning mt-2">Nenhum KPI selecionado para reset.</div>`;
            }
            return;
        }

        // Marca como resetado e aplica o zero na tela
        targets.forEach(kpiKey => {
            window.kpiResetState[kpiKey] = true;
            aplicarResetNaDOM(kpiKey);
        });

        if (msgBox) {
            msgBox.innerHTML = `<div class="alert alert-success mt-2">KPI(s) resetado(s) com sucesso!</div>`;
            setTimeout(() => { msgBox.innerHTML = ""; }, 4000);
        }

        console.log("✅ KPIs resetados:", targets);
    };

    // 🔹 Wrapper em atualizarKPIs para manter zero após atualizações
    function envolverAtualizarKPIs() {
        if (typeof window.atualizarKPIs !== "function") {
            console.warn("⚠️ atualizarKPIs ainda não existe, tentando novamente depois...");
            return;
        }

        if (window._originalAtualizarKPIs) {
            // Já foi envolvida, não fazer de novo
            return;
        }

        console.log("🔁 Envolvendo atualizarKPIs com suporte a reset de KPI");

        window._originalAtualizarKPIs = window.atualizarKPIs;

        window.atualizarKPIs = async function (data) {
            // Chama a função original para atualizar tudo normalmente
            await window._originalAtualizarKPIs(data);

            // Depois de atualizar, reaplica os zeros dos KPIs "resetados"
            Object.keys(window.kpiResetState).forEach(kpiKey => {
                if (window.kpiResetState[kpiKey]) {
                    aplicarResetNaDOM(kpiKey);
                }
            });
        };
    }

    // 🔹 Tenta envolver assim que possível
    function tentarEnvolver() {
        try {
            envolverAtualizarKPIs();
        } catch (e) {
            console.error("Erro ao envolver atualizarKPIs:", e);
        }
    }

    // Se o script carregar depois de tudo
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(tentarEnvolver, 500);
    } else {
        document.addEventListener("DOMContentLoaded", function () {
            setTimeout(tentarEnvolver, 500);
        });
    }

    // Só por segurança, tenta novamente depois de 3 segundos
    setTimeout(tentarEnvolver, 3000);
})();
