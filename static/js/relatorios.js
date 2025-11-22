// static/js/relatorios.js
// ==========================================================
// SISTEMA DE EXPORTAÇÃO DE RELATÓRIOS - ABORDAGEM COMPLETA
// ==========================================================

// Variável global para armazenar dados do relatório atual
window.currentReportData = null;

/**
 * Exporta dados para CSV ou PDF
 */
function exportData(format) {
    console.log('📤 Iniciando exportação para:', format);
    
    // Verificar se há dados disponíveis
    if (!window.currentReportData || !window.currentReportData.dados || window.currentReportData.dados.length === 0) {
        showToast('❌ Nenhum dado disponível para exportar. Gere um relatório primeiro.', 'warning');
        return;
    }

    try {
        if (format === 'csv') {
            exportToCSV(window.currentReportData);
        } else if (format === 'pdf') {
            exportToPDF(window.currentReportData);
        } else {
            showToast('❌ Formato de exportação não suportado.', 'error');
        }
    } catch (error) {
        console.error('Erro na exportação:', error);
        showToast('❌ Erro ao exportar: ' + error.message, 'error');
    }
}

/**
 * Exporta para CSV
 */
function exportToCSV(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    
    // Criar conteúdo CSV
    let csvContent = "";
    
    // Metadados como comentários
    csvContent += "# RELATÓRIO EXPORTADO - SISTEMA DE ENERGIA\n";
    csvContent += "# Tipo: " + (metadata.tipo || 'N/A') + "\n";
    csvContent += "# Período: " + (metadata.periodo || 'N/A') + "\n";
    csvContent += "# PZEM: " + (metadata.pzem || 'Todos') + "\n";
    csvContent += "# Total de registros: " + (metadata.total_registros || dados.length) + "\n";
    csvContent += "# Gerado em: " + new Date().toLocaleString() + "\n\n";
    
    if (dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }
    
    // Cabeçalhos
    const headers = Object.keys(dados[0]);
    csvContent += headers.map(h => `"${h}"`).join(';') + '\n';
    
    // Dados
    dados.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(';') + '\n';
    });
    
    // Download
    downloadFile(csvContent, `relatorio_${metadata.tipo || 'dados'}.csv`, 'text/csv');
    showToast('✅ Relatório exportado para CSV com sucesso!', 'success');
}

/**
 * Exporta para PDF (usando impressão do navegador)
 */
function exportToPDF(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    
    if (!dados || dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }
    
    // Criar conteúdo para impressão
    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleString();
    
    let pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório - Sistema de Energia</title>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 20px; 
                    color: #333;
                }
                .header { 
                    border-bottom: 3px solid #1a73e8; 
                    padding-bottom: 15px; 
                    margin-bottom: 25px; 
                }
                .metadata { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 25px;
                    border-left: 4px solid #1a73e8;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 15px;
                    font-size: 12px;
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 10px; 
                    text-align: left; 
                }
                th { 
                    background-color: #1a73e8; 
                    color: white; 
                    font-weight: 600;
                }
                tr:nth-child(even) { 
                    background-color: #f9f9f9; 
                }
                .footer { 
                    margin-top: 30px; 
                    font-size: 11px; 
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                h1 { color: #1a73e8; margin: 0; }
                h3 { color: #333; margin-bottom: 15px; }
                @media print {
                    body { margin: 10px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Relatório do Sistema de Energia</h1>
                <p><strong>Sistema de Automação Residencial</strong></p>
            </div>
            
            <div class="metadata">
                <h3>📋 Informações do Relatório</h3>
                <p><strong>🔧 Tipo:</strong> ${metadata.tipo || 'N/A'}</p>
                <p><strong>📅 Período:</strong> ${metadata.periodo || 'N/A'}</p>
                <p><strong>⚡ PZEM:</strong> ${metadata.pzem || 'Todos'}</p>
                <p><strong>📈 Total de Registros:</strong> ${metadata.total_registros || dados.length}</p>
            </div>
    `;
    
    // Tabela de dados
    if (dados.length > 0) {
        pdfContent += `<h3>📊 Dados do Relatório</h3><table>`;
        
        // Cabeçalho
        const headers = Object.keys(dados[0]);
        pdfContent += '<tr>';
        headers.forEach(header => {
            pdfContent += `<th>${header.toUpperCase().replace(/_/g, ' ')}</th>`;
        });
        pdfContent += '</tr>';
        
        // Dados
        dados.forEach(row => {
            pdfContent += '<tr>';
            headers.forEach(header => {
                let value = row[header];
                if (value === null || value === undefined) value = '';
                if (typeof value === 'object') value = JSON.stringify(value);
                pdfContent += `<td>${value}</td>`;
            });
            pdfContent += '</tr>';
        });
        
        pdfContent += '</table>';
    }
    
    pdfContent += `
            <div class="footer">
                <p><strong>🕒 Relatório gerado em:</strong> ${timestamp}</p>
                <p><strong>© Sistema de Automação Residencial</strong> - Todos os direitos reservados</p>
                <p class="no-print"><em>Use Ctrl+P para salvar como PDF</em></p>
            </div>
            
            <script>
                // Auto-print após carregar
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    showToast('✅ Relatório preparado para impressão/PDF!', 'success');
}

/**
 * Função auxiliar para download de arquivos
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * Mostra notificação toast
 */
function showToast(message, type = 'info') {
    // Usar toast do Bootstrap se disponível, senão alert simples
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();
        
        const bgColor = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        // Fallback para alert simples
        alert(message);
    }
}

/**
 * Armazena dados do relatório para exportação
 * Chamar esta função quando gerar um relatório
 */
function setReportData(data) {
    window.currentReportData = data;
    console.log('💾 Dados do relatório armazenados para exportação:', data);
}

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema de exportação de relatórios carregado!');
});