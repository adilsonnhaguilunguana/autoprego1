// static/js/relatorios.js - SISTEMA DE EXPORTAÇÃO COMPLETO

window.currentReportData = null;

function exportData(format) {
    if (!window.currentReportData || !window.currentReportData.dados || window.currentReportData.dados.length === 0) {
        showToast("❌ Gere um relatório antes de exportar!", "warning");
        return;
    }

    if (format === 'csv') {
        exportToCSV(window.currentReportData);
    } else if (format === 'pdf') {
        exportToPDF(window.currentReportData);
    }
}

function exportToCSV(data) {
    const dados = data.dados;
    let csvContent = "";
    
    // Cabeçalhos
    const headers = Object.keys(dados[0]);
    csvContent += headers.join(';') + '\n';
    
    // Dados
    dados.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) return '';
            return String(value).replace(/;/g, ',');
        });
        csvContent += values.join(';') + '\n';
    });
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✅ CSV exportado com sucesso!', 'success');
}

function exportToPDF(data) {
    const dados = data.dados;
    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleString();
    
    let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório - Sistema de Energia</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #1a73e8; color: white; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório do Sistema de Energia</h1>
                <p>Gerado em: ${timestamp}</p>
            </div>
            <table>
    `;
    
    // Cabeçalho
    const headers = Object.keys(dados[0]);
    pdfContent += '<tr>';
    headers.forEach(header => {
        pdfContent += `<th>${header}</th>`;
    });
    pdfContent += '</tr>';
    
    // Dados
    dados.forEach(row => {
        pdfContent += '<tr>';
        headers.forEach(header => {
            pdfContent += `<td>${row[header]}</td>`;
        });
        pdfContent += '</tr>';
    });
    
    pdfContent += `
            </table>
            <div class="footer">
                <p>Sistema de Automação Residencial</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function setReportData(data) {
    window.currentReportData = data;
}

// Remove as funções antigas que conflitam
function exportarPDF() {
    exportData('pdf');
}

function exportarExcel() {
    exportData('csv');
}