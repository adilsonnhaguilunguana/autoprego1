// ==========================================================
// SISTEMA DE RELATÓRIOS COMPLETO (Adilson Versão Final)
// ==========================================================

// Variável global para armazenar dados do relatório atual
window.currentReportData = null;

// ==========================================================
// 1) SISTEMA DE EXPORTAÇÃO
// ==========================================================

function exportData(format) {
    console.log('📤 Iniciando exportação para:', format);
    
    if (!window.currentReportData || !window.currentReportData.dados || window.currentReportData.dados.length === 0) {
        showToast('❌ Nenhum dado disponível para exportar. Gere um relatório primeiro.', 'warning');
        return;
    }

    try {
        if (format === 'csv') exportToCSV(window.currentReportData);
        else if (format === 'pdf') exportToPDF(window.currentReportData);
        else showToast('❌ Formato não suportado.', 'error');
    } catch (error) {
        console.error('Erro na exportação:', error);
        showToast('❌ Erro ao exportar: ' + error.message, 'error');
    }
}

// -------------------- CSV --------------------- //

function exportToCSV(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    
    let csvContent = "";

    csvContent += "# RELATÓRIO EXPORTADO\n";
    csvContent += "# Tipo: " + (metadata.tipo || 'N/A') + "\n";
    csvContent += "# Período: " + (metadata.periodo || 'N/A') + "\n";
    csvContent += "# PZEM: " + (metadata.pzem || 'Todos') + "\n";
    csvContent += "# Registros: " + (metadata.total_registros || dados.length) + "\n";
    csvContent += "# Gerado em: " + new Date().toLocaleString() + "\n\n";
    
    if (dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }

    const headers = Object.keys(dados[0]);
    csvContent += headers.map(h => `"${h}"`).join(';') + '\n';

    dados.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(';') + '\n';
    });

    downloadFile(csvContent, `relatorio_${metadata.tipo || 'dados'}.csv`, 'text/csv');
    showToast('✅ CSV exportado com sucesso!', 'success');
}

// -------------------- PDF --------------------- //

function exportToPDF(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};

    if (!dados || dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }

    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleString();

    let html = `
        <html><head><meta charset="utf-8">
        <title>Relatório</title>
        <style>
            body { font-family: Arial; margin: 20px; }
            h1 { color: #1a73e8; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #1a73e8; color: #fff; }
            tr:nth-child(even) { background: #f2f2f2; }
        </style></head><body>

        <h1>📊 Relatório do Sistema de Energia</h1>
        <p><b>Tipo:</b> ${metadata.tipo}</p>
        <p><b>Período:</b> ${metadata.periodo}</p>
        <p><b>PZEM:</b> ${metadata.pzem}</p>
        <p><b>Gerado em:</b> ${timestamp}</p>

        <table><tr>
    `;

    const headers = Object.keys(dados[0]);
    headers.forEach(h => html += `<th>${h.toUpperCase().replace(/_/g, " ")}</th>`);
    html += "</tr>";

    dados.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
            let v = row[h];
            if (typeof v === "object") v = JSON.stringify(v);
            html += `<td>${v}</td>`;
        });
        html += "</tr>";
    });

    html += "</table></body></html>";

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => printWindow.print(), 500);

    showToast("📄 PDF pronto para impressão!", "success");
}

// -------------------- Download helper --------------------- //

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ==========================================================
// 2) SISTEMA DE NOTIFICAÇÕES
// ==========================================================

function showToast(message, type = 'info') {
    alert(message); // fallback simples
}

// ==========================================================
// 3) FUNÇÕES DE RENDERIZAÇÃO
// ==========================================================

// ---------- Função genérica para tabela ---------- //

function renderTabelaPadrao(dados) {
    const container = document.getElementById("report-results");

    if (!dados || dados.length === 0) {
        container.innerHTML = "<p class='text-muted'>Nenhum dado encontrado.</p>";
        return;
    }

    const headers = Object.keys(dados[0]);

    let html = "<table class='table table-bordered table-striped'><thead><tr>";
    headers.forEach(h => html += `<th>${h.toUpperCase().replace(/_/g, " ")}</th>`);
    html += "</tr></thead><tbody>";

    dados.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
            let v = row[h];
            if (typeof v === "object") v = JSON.stringify(v);
            html += `<td>${v}</td>`;
        });
        html += "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

// ---------- Específicos ---------- //

function renderRelatorioConsumo(dados) { renderTabelaPadrao(dados); }
function renderRelatorioPicos(dados) { renderTabelaPadrao(dados); }
function renderRelatorioRele(dados) { renderTabelaPadrao(dados); }
function renderRelatorioCusto(dados) { renderTabelaPadrao(dados); }
function renderRelatorioRecargas(dados) { renderTabelaPadrao(dados); }

// ==========================================================
// 4) HANDLER DO FORMULÁRIO
// ==========================================================

document.getElementById("report-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const tipo = document.getElementById("report-type").value;
    const periodo = document.getElementById("report-period").value;
    const pzem = document.getElementById("report-pzem").value;
    const startDate = document.getElementById("start-date")?.value || null;
    const endDate = document.getElementById("end-date")?.value || null;

    const payload = { type: tipo, period: periodo, pzem, startDate, endDate };

    try {
        const resp = await fetch("/api/relatorio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (!data.success) {
            showToast("❌ Erro: " + data.message, "danger");
            return;
        }

        setReportData(data);

        switch (tipo) {
            case "consumo": return renderRelatorioConsumo(data.dados);
            case "picos": return renderRelatorioPicos(data.dados);
            case "reles": return renderRelatorioRele(data.dados);
            case "custo": return renderRelatorioCusto(data.dados);
            case "recargas": return renderRelatorioRecargas(data.dados);
        }

    } catch (error) {
        console.error(error);
        showToast("❌ Erro ao gerar relatório!", "danger");
    }
});

// ==========================================================
// 5) DEBUG
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("🌐 Sistema de relatórios carregado!");
});
