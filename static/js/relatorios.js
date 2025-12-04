// static/js/relatorios.js
// ==========================================================
// SISTEMA COMPLETO DE RELATÓRIOS COM CSS INLINE
// ==========================================================

// Variável global para armazenar dados do relatório atual
window.currentReportData = null;

// Estilos CSS para relatórios
const styles = {
    container: `
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #333;
        line-height: 1.5;
    `,
    header: `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1a73e8;
    `,
    stats: `
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    `,
    statBadge: `
        background: #e3f2fd;
        color: #1a73e8;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    `,
    metricCard: `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 15px;
    `,
    metricValue: `
        font-size: 1.8rem;
        font-weight: bold;
        margin-bottom: 5px;
    `,
    metricLabel: `
        font-size: 0.9rem;
        opacity: 0.9;
    `,
    table: `
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
    `,
    tableHeader: `
        background: #1a73e8;
        color: white;
        padding: 12px 15px;
        text-align: left;
        font-weight: 600;
    `,
    tableCell: `
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
    `,
    tableRow: `
        &:hover {
            background: #f5f7fa;
        }
    `,
    alert: `
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid;
    `,
    alertSuccess: `
        background: #d4edda;
        border-color: #28a745;
        color: #155724;
    `,
    alertWarning: `
        background: #fff3cd;
        border-color: #ffc107;
        color: #856404;
    `,
    alertDanger: `
        background: #f8d7da;
        border-color: #dc3545;
        color: #721c24;
    `,
    badge: `
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
    `,
    badgeSuccess: `background: #28a745; color: white;`,
    badgeWarning: `background: #ffc107; color: #212529;`,
    badgeDanger: `background: #dc3545; color: white;`,
    badgeInfo: `background: #17a2b8; color: white;`,
    progressBar: `
        height: 20px;
        background: #e9ecef;
        border-radius: 10px;
        overflow: hidden;
        margin: 10px 0;
    `,
    progressFill: `
        height: 100%;
        border-radius: 10px;
        transition: width 0.3s ease;
    `,
    card: `
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-bottom: 15px;
        overflow: hidden;
    `,
    cardHeader: `
        background: #f8f9fa;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        font-weight: 600;
    `,
    cardBody: `
        padding: 20px;
    `,
    emptyState: `
        text-align: center;
        padding: 40px 20px;
        color: #6c757d;
    `,
    emptyIcon: `
        font-size: 48px;
        margin-bottom: 15px;
        opacity: 0.5;
    `,
    row: `
        display: flex;
        flex-wrap: wrap;
        margin: 0 -10px;
    `,
    col: `
        flex: 1;
        padding: 0 10px;
        min-width: 250px;
    `,
    summaryBox: `
        background: #f8f9fa;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
        border-left: 4px solid #1a73e8;
    `,
    smallText: `
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: 10px;
    `
};

/**
 * Cria um elemento com estilos inline
 */
function createElement(tag, stylesObj = {}, content = '', attributes = {}) {
    const element = document.createElement(tag);
    
    // Aplicar estilos inline
    Object.assign(element.style, stylesObj);
    
    // Adicionar conteúdo
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else {
            element.appendChild(content);
        }
    }
    
    // Adicionar atributos
    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key]);
    });
    
    return element;
}

/**
 * Aplica estilos CSS a um elemento
 */
function applyStyles(element, styleString) {
    const styleObj = {};
    const rules = styleString.split(';').filter(rule => rule.trim());
    
    rules.forEach(rule => {
        const [property, value] = rule.split(':').map(s => s.trim());
        if (property && value) {
            styleObj[property] = value;
        }
    });
    
    Object.assign(element.style, styleObj);
}

/**
 * Envia solicitação para gerar relatório
 */
async function gerarRelatorio() {
    console.log('📊 Gerando relatório...');
    
    const tipo = document.getElementById('report-type').value;
    const periodo = document.getElementById('report-period').value;
    const pzem = document.getElementById('report-pzem').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // Validação básica
    if (periodo === 'custom' && (!startDate || !endDate)) {
        showToast('❌ Para período personalizado, informe as datas.', 'warning');
        return;
    }
    
    const data = {
        type: tipo,
        period: periodo,
        pzem: pzem,
        startDate: periodo === 'custom' ? startDate : null,
        endDate: periodo === 'custom' ? endDate : null
    };
    
    try {
        // Mostrar loading
        const resultsDiv = document.getElementById('report-results');
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p style="margin-top: 15px; font-size: 1.1rem;">Gerando relatório...</p>
            </div>
        `;
        
        const response = await fetch('/api/relatorio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Armazenar dados para exportação
            window.currentReportData = result;
            
            // Renderizar relatório conforme tipo
            renderRelatorio(result);
            
            showToast('✅ Relatório gerado com sucesso!', 'success');
        } else {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #dc3545;">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <h6>Erro ao gerar relatório</h6>
                    <p>${result.message || 'Erro desconhecido'}</p>
                </div>
            `;
            showToast(`❌ ${result.message || 'Erro ao gerar relatório'}`, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('report-results').innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #dc3545;">
                <i class="bi bi-exclamation-triangle-fill" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h6>Erro de Conexão</h6>
                <p>Erro ao gerar relatório!</p>
                <p style="font-size: 0.85rem; margin-top: 10px;">Detalhes: ${error.message}</p>
            </div>
        `;
        showToast('❌ Erro de conexão com o servidor', 'error');
    }
}

/**
 * Renderiza o relatório conforme tipo
 */
function renderRelatorio(data) {
    const tipo = data.metadata?.tipo || 'consumo';
    
    // Funções de renderização específicas por tipo
    const renderers = {
        'consumo': renderRelatorioConsumo,
        'picos': renderRelatorioPicos,
        'reles': renderRelatorioReles,
        'analise_custos': renderRelatorioCusto,
        'historico_recargas': renderRelatorioRecargas
    };
    
    const renderer = renderers[tipo] || renderRelatorioGenerico;
    
    try {
        renderer(data);
    } catch (error) {
        console.error(`Erro ao renderizar relatório ${tipo}:`, error);
        renderRelatorioGenerico(data);
    }
}

/**
 * Renderiza relatório de consumo de energia
 */
function renderRelatorioConsumo(data) {
    const container = document.getElementById('report-results');
    const dados = data.dados || [];
    const metadata = data.metadata || {};
    
    if (dados.length === 0) {
        container.innerHTML = createEmptyState('Nenhum dado de consumo encontrado para o período selecionado.');
        return;
    }
    
    // Calcular totais
    let energiaTotal = 0;
    let custoTotal = 0;
    
    dados.forEach(item => {
        if (item.energia && !isNaN(item.energia)) {
            energiaTotal += parseFloat(item.energia);
        }
        if (item.custo && !isNaN(item.custo)) {
            custoTotal += parseFloat(item.custo);
        }
    });
    
    // Limpar container
    container.innerHTML = '';
    
    // Criar container principal
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-lightning-charge"></i> Relatório de Consumo de Energia`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const periodoBadge = document.createElement('span');
    applyStyles(periodoBadge, styles.statBadge);
    periodoBadge.innerHTML = `<i class="bi bi-calendar"></i> ${metadata.periodo || 'N/A'}`;
    
    const pzemBadge = document.createElement('span');
    applyStyles(pzemBadge, styles.statBadge);
    pzemBadge.innerHTML = `<i class="bi bi-cpu"></i> ${metadata.pzem || 'Todos'}`;
    
    statsDiv.appendChild(periodoBadge);
    statsDiv.appendChild(pzemBadge);
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Resumo box
    const resumoDiv = document.createElement('div');
    applyStyles(resumoDiv, styles.summaryBox);
    
    const rowDiv = document.createElement('div');
    applyStyles(rowDiv, styles.row);
    
    // Métrica 1: Dias com consumo
    const col1 = document.createElement('div');
    applyStyles(col1, styles.col);
    
    const metric1 = document.createElement('div');
    applyStyles(metric1, styles.metricCard);
    metric1.innerHTML = `
        <div style="${styles.metricValue}">${dados.length}</div>
        <div style="${styles.metricLabel}">Dias com consumo</div>
    `;
    
    // Métrica 2: kWh Total
    const col2 = document.createElement('div');
    applyStyles(col2, styles.col);
    
    const metric2 = document.createElement('div');
    metric2.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)');
    metric2.innerHTML = `
        <div style="${styles.metricValue}">${energiaTotal.toFixed(2)}</div>
        <div style="${styles.metricLabel}">kWh Total</div>
    `;
    
    // Métrica 3: MZN Total
    const col3 = document.createElement('div');
    applyStyles(col3, styles.col);
    
    const metric3 = document.createElement('div');
    metric3.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)');
    metric3.innerHTML = `
        <div style="${styles.metricValue}">${custoTotal.toFixed(2)}</div>
        <div style="${styles.metricLabel}">MZN Total</div>
    `;
    
    // Adicionar métricas às colunas
    col1.appendChild(metric1);
    col2.appendChild(metric2);
    col3.appendChild(metric3);
    
    // Adicionar colunas à linha
    rowDiv.appendChild(col1);
    rowDiv.appendChild(col2);
    rowDiv.appendChild(col3);
    
    resumoDiv.appendChild(rowDiv);
    mainDiv.appendChild(resumoDiv);
    
    // Tabela
    const table = document.createElement('table');
    applyStyles(table, styles.table);
    
    // Cabeçalho da tabela
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'Energia (kWh)', 'Custo (MZN)', 'Média/kWh'];
    headers.forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.tableHeader);
        th.innerHTML = `<i class="bi bi-${getIconForHeader(text)}"></i> ${text}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo da tabela
    const tbody = document.createElement('tbody');
    
    dados.forEach(item => {
        const custoUnitario = item.energia > 0 ? (item.custo / item.energia).toFixed(3) : '0.000';
        
        const row = document.createElement('tr');
        applyStyles(row, styles.tableRow);
        
        // Célula de data
        const td1 = document.createElement('td');
        applyStyles(td1, styles.tableCell);
        td1.textContent = item.data || 'N/A';
        
        // Célula de energia
        const td2 = document.createElement('td');
        applyStyles(td2, styles.tableCell);
        td2.textContent = item.energia ? item.energia.toFixed(3) : '0.000';
        
        // Célula de custo
        const td3 = document.createElement('td');
        applyStyles(td3, styles.tableCell);
        td3.textContent = item.custo ? item.custo.toFixed(2) + ' MZN' : '0.00 MZN';
        
        // Célula de média
        const td4 = document.createElement('td');
        applyStyles(td4, styles.tableCell);
        td4.textContent = custoUnitario + ' MZN/kWh';
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Rodapé da tabela
    const tfoot = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    footerRow.style.backgroundColor = '#f8f9fa';
    
    const footerTd1 = document.createElement('td');
    applyStyles(footerTd1, styles.tableCell);
    footerTd1.innerHTML = '<strong>TOTAL</strong>';
    
    const footerTd2 = document.createElement('td');
    applyStyles(footerTd2, styles.tableCell);
    footerTd2.innerHTML = `<strong>${energiaTotal.toFixed(3)} kWh</strong>`;
    
    const footerTd3 = document.createElement('td');
    applyStyles(footerTd3, styles.tableCell);
    footerTd3.innerHTML = `<strong>${custoTotal.toFixed(2)} MZN</strong>`;
    
    const footerTd4 = document.createElement('td');
    applyStyles(footerTd4, styles.tableCell);
    footerTd4.innerHTML = `<strong>${(custoTotal / Math.max(energiaTotal, 1)).toFixed(3)} MZN/kWh</strong>`;
    
    footerRow.appendChild(footerTd1);
    footerRow.appendChild(footerTd2);
    footerRow.appendChild(footerTd3);
    footerRow.appendChild(footerTd4);
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);
    
    mainDiv.appendChild(table);
    
    // Informação adicional
    const infoDiv = document.createElement('div');
    applyStyles(infoDiv, styles.smallText);
    infoDiv.innerHTML = `<i class="bi bi-info-circle"></i> Preço do kWh: ${metadata.preco_kwh || 'N/A'} MZN`;
    
    mainDiv.appendChild(infoDiv);
    container.appendChild(mainDiv);
    
    // Adicionar gráfico se houver dados suficientes
    if (dados.length > 1 && typeof Chart !== 'undefined') {
        renderGraficoConsumo(dados, container);
    }
}

/**
 * Renderiza relatório de picos de consumo
 */
function renderRelatorioPicos(data) {
    const container = document.getElementById('report-results');
    const dados = data.dados || [];
    const metadata = data.metadata || {};
    
    if (dados.length === 0) {
        container.innerHTML = createEmptyState('Nenhum pico de consumo registrado no período');
        return;
    }
    
    // Encontrar maior pico
    let maiorPico = 0;
    let dataMaiorPico = '';
    
    dados.forEach(item => {
        if (item.pico > maiorPico) {
            maiorPico = item.pico;
            dataMaiorPico = item.data;
        }
    });
    
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-graph-up-arrow"></i> Relatório de Picos de Consumo`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const picoBadge = document.createElement('span');
    picoBadge.style = styles.statBadge.replace('background: #e3f2fd;', 'background: #f8d7da;');
    picoBadge.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Maior pico: ${maiorPico.toFixed(1)}W`;
    
    statsDiv.appendChild(picoBadge);
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Alerta
    const alertDiv = document.createElement('div');
    applyStyles(alertDiv, styles.alert + styles.alertWarning);
    alertDiv.innerHTML = `<i class="bi bi-info-circle"></i> Picos acima de 70% do limite configurado podem indicar sobrecarga.`;
    mainDiv.appendChild(alertDiv);
    
    // Tabela
    const table = document.createElement('table');
    applyStyles(table, styles.table);
    
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'Pico (W)', 'Hora', 'Nível'];
    headers.forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.tableHeader);
        th.innerHTML = `<i class="bi bi-${getIconForHeader(text)}"></i> ${text}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo
    const tbody = document.createElement('tbody');
    
    dados.forEach(item => {
        const nivel = item.pico > 2000 ? 'danger' : item.pico > 1500 ? 'warning' : 'success';
        const iconeNivel = item.pico > 2000 ? 'exclamation-triangle-fill' : 
                          item.pico > 1500 ? 'exclamation-triangle' : 'check-circle';
        
        const row = document.createElement('tr');
        applyStyles(row, styles.tableRow);
        
        // Data
        const td1 = document.createElement('td');
        applyStyles(td1, styles.tableCell);
        td1.textContent = item.data;
        
        // Pico
        const td2 = document.createElement('td');
        applyStyles(td2, styles.tableCell);
        td2.innerHTML = `<strong>${item.pico.toFixed(1)} W</strong>`;
        
        // Hora
        const td3 = document.createElement('td');
        applyStyles(td3, styles.tableCell);
        td3.textContent = item.hora || '--:--';
        
        // Nível
        const td4 = document.createElement('td');
        applyStyles(td4, styles.tableCell);
        
        const badge = document.createElement('span');
        badge.style = nivel === 'danger' ? styles.badgeDanger : 
                     nivel === 'warning' ? styles.badgeWarning : styles.badgeSuccess;
        badge.innerHTML = `<i class="bi bi-${iconeNivel}"></i> ${item.pico > 2000 ? 'ALTO' : item.pico > 1500 ? 'MÉDIO' : 'NORMAL'}`;
        
        td4.appendChild(badge);
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    mainDiv.appendChild(table);
    container.appendChild(mainDiv);
}

/**
 * Renderiza relatório de análise de custos
 */
function renderRelatorioCusto(data) {
    const container = document.getElementById('report-results');
    const dados = data.dados || [];
    const metadata = data.metadata || {};
    const metricas = data.metadata?.metricas || {};
    
    if (dados.length === 0) {
        container.innerHTML = createEmptyState('Nenhum dado de custo disponível para o período');
        return;
    }
    
    // Separar dados regulares e especiais
    const dadosEspeciais = dados.filter(d => d.tipo && d.tipo !== 'normal');
    
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-calculator"></i> Análise de Custos e Eficiência`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const categoriaBadge = document.createElement('span');
    const cor = metricas.cor_categoria || 'primary';
    categoriaBadge.style = `
        background: ${cor === 'success' ? '#28a745' : 
                     cor === 'warning' ? '#ffc107' : 
                     cor === 'danger' ? '#dc3545' : '#1a73e8'};
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    `;
    categoriaBadge.innerHTML = `<i class="bi bi-award"></i> ${metricas.categoria_eficiencia || 'N/A'}`;
    
    statsDiv.appendChild(categoriaBadge);
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Métricas principais
    const metricsRow = document.createElement('div');
    applyStyles(metricsRow, styles.row);
    
    // Score de Eficiência
    const col1 = document.createElement('div');
    applyStyles(col1, styles.col);
    
    const metric1 = document.createElement('div');
    metric1.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)');
    metric1.innerHTML = `
        <div style="${styles.metricValue}">${metricas.score_eficiencia || 0}/100</div>
        <div style="${styles.metricLabel}">Score de Eficiência</div>
    `;
    
    // Saldo Líquido
    const col2 = document.createElement('div');
    applyStyles(col2, styles.col);
    
    const metric2 = document.createElement('div');
    const saldoCor = (metricas.saldo_liquido || 0) >= 0 ? 'success' : 'danger';
    metric2.style = styles.metricCard.replace(
        'gradient(135deg, #667eea 0%, #764ba2 100%)',
        saldoCor === 'success' ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
    );
    metric2.innerHTML = `
        <div style="${styles.metricValue}">${metadata.saldo_liquido ? metadata.saldo_liquido.toFixed(2) : '0.00'} MZN</div>
        <div style="${styles.metricLabel}">Saldo Líquido</div>
    `;
    
    // Dias Restantes
    const col3 = document.createElement('div');
    applyStyles(col3, styles.col);
    
    const metric3 = document.createElement('div');
    metric3.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)');
    metric3.innerHTML = `
        <div style="${styles.metricValue}">${metricas.dias_restantes ? metricas.dias_restantes.toFixed(1) : '0'} dias</div>
        <div style="${styles.metricLabel}">Saldo Atual Restante</div>
    `;
    
    col1.appendChild(metric1);
    col2.appendChild(metric2);
    col3.appendChild(metric3);
    
    metricsRow.appendChild(col1);
    metricsRow.appendChild(col2);
    metricsRow.appendChild(col3);
    mainDiv.appendChild(metricsRow);
    
    // Alerta de desempenho
    const alertDiv = document.createElement('div');
    const score = metricas.score_eficiencia || 0;
    const alertStyle = score >= 60 ? styles.alertSuccess : styles.alertWarning;
    applyStyles(alertDiv, styles.alert + alertStyle);
    
    const alertMsg = score >= 80 ? '✅ Excelente eficiência energética!' :
                    score >= 60 ? '⚠️ Eficiência regular - há espaço para melhorias.' :
                    score >= 40 ? '⚠️ Atenção! Considere otimizar o consumo.' :
                    '🚨 Crítico! Ajustes urgentes necessários.';
    
    alertDiv.innerHTML = `
        <h6 style="margin: 0 0 10px 0;">
            <i class="bi ${score >= 60 ? 'bi-check-circle' : 'bi-exclamation-triangle'}"></i> 
            Análise de Desempenho
        </h6>
        ${alertMsg}
    `;
    
    mainDiv.appendChild(alertDiv);
    
    // Tabela de dados
    const table = document.createElement('table');
    applyStyles(table, styles.table);
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Descrição', 'Energia/Valor', 'Custo/Métrica'].forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.tableHeader);
        th.textContent = text;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    dadosEspeciais.forEach(item => {
        const isSeparator = item.tipo === 'separador';
        const isTotal = item.tipo === 'total_consumo' || item.tipo === 'total_recargas' || item.tipo === 'saldo_liquido';
        const isMetrica = item.tipo === 'metrica' || item.tipo === 'score' || item.tipo === 'previsao' || 
                         item.tipo === 'projecao' || item.tipo === 'saldo_atual' || item.tipo === 'consumo_atual' || 
                         item.tipo === 'economia';
        
        const row = document.createElement('tr');
        
        if (isSeparator) {
            row.style.backgroundColor = '#f8f9fa';
            row.style.fontWeight = 'bold';
            
            const td = document.createElement('td');
            td.colSpan = 3;
            applyStyles(td, styles.tableCell);
            td.textContent = item.data;
            row.appendChild(td);
        } else if (isTotal) {
            const isSaldoNegativo = item.tipo === 'saldo_liquido' && parseFloat(item.custo_dia || 0) < 0;
            row.style.backgroundColor = isSaldoNegativo ? '#f8d7da' : '#d4edda';
            row.style.fontWeight = 'bold';
            
            ['data', 'energia', 'custo_dia'].forEach((key, index) => {
                const td = document.createElement('td');
                applyStyles(td, styles.tableCell);
                let content = item[key] || '';
                if (index === 2 && content !== '-' && !content.includes('MZN')) {
                    content += ' MZN';
                }
                td.innerHTML = content;
                row.appendChild(td);
            });
        } else if (isMetrica) {
            ['data', 'energia', 'custo_dia'].forEach(key => {
                const td = document.createElement('td');
                applyStyles(td, styles.tableCell);
                td.textContent = item[key] || '';
                row.appendChild(td);
            });
        }
        
        if (row.children.length > 0) {
            tbody.appendChild(row);
        }
    });
    
    table.appendChild(tbody);
    mainDiv.appendChild(table);
    container.appendChild(mainDiv);
}

/**
 * Renderiza relatório de recargas
 */
function renderRelatorioRecargas(data) {
    const container = document.getElementById('report-results');
    const dados = data.dados || [];
    const metadata = data.metadata || {};
    
    if (dados.length === 0) {
        container.innerHTML = createEmptyState('Nenhuma recarga registrada no período');
        return;
    }
    
    // Calcular totais
    let totalValor = 0;
    let totalKWH = 0;
    
    dados.forEach(item => {
        totalValor += parseFloat(item.valor_mzn || 0);
        totalKWH += parseFloat(item.kwh_creditados || 0);
    });
    
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-credit-card"></i> Histórico de Recargas`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const totalBadge = document.createElement('span');
    totalBadge.style = styles.statBadge.replace('background: #e3f2fd;', 'background: #d4edda;');
    totalBadge.innerHTML = `<i class="bi bi-cash-stack"></i> Total: ${totalValor.toFixed(2)} MZN`;
    
    statsDiv.appendChild(totalBadge);
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Tabela
    const table = document.createElement('table');
    applyStyles(table, styles.table);
    
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data/Hora', 'Valor (MZN)', 'kWh Creditados', 'Taxas', 'Preço/kWh', 'Saldo'];
    headers.forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.tableHeader);
        th.innerHTML = `<i class="bi bi-${getIconForHeader(text)}"></i> ${text}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo
    const tbody = document.createElement('tbody');
    
    dados.forEach(item => {
        const taxaTotal = (parseFloat(item.taxa_lixo || 0) + parseFloat(item.taxa_radio || 0));
        const saldoVariacao = parseFloat(item.saldo_atual || 0) - parseFloat(item.saldo_anterior || 0);
        
        const row = document.createElement('tr');
        applyStyles(row, styles.tableRow);
        
        // Data/Hora
        const td1 = document.createElement('td');
        applyStyles(td1, styles.tableCell);
        td1.textContent = item.criado_em || 'N/A';
        
        // Valor
        const td2 = document.createElement('td');
        applyStyles(td2, styles.tableCell);
        td2.innerHTML = `<strong>${item.valor_mzn ? parseFloat(item.valor_mzn).toFixed(2) : '0.00'} MZN</strong>`;
        
        // kWh
        const td3 = document.createElement('td');
        applyStyles(td3, styles.tableCell);
        td3.textContent = item.kwh_creditados ? parseFloat(item.kwh_creditados).toFixed(3) + ' kWh' : '0.000 kWh';
        
        // Taxas
        const td4 = document.createElement('td');
        applyStyles(td4, styles.tableCell);
        
        const badge = document.createElement('span');
        applyStyles(badge, styles.badgeInfo);
        badge.title = `Lixo: ${item.taxa_lixo || 0} MZN | Rádio: ${item.taxa_radio || 0} MZN`;
        badge.innerHTML = `${taxaTotal.toFixed(2)} MZN`;
        
        td4.appendChild(badge);
        
        // Preço/kWh
        const td5 = document.createElement('td');
        applyStyles(td5, styles.tableCell);
        td5.textContent = item.preco_kwh ? parseFloat(item.preco_kwh).toFixed(3) + ' MZN' : '0.000 MZN';
        
        // Saldo
        const td6 = document.createElement('td');
        applyStyles(td6, styles.tableCell);
        
        const saldoDiv = document.createElement('div');
        saldoDiv.style.fontSize = '0.9rem';
        
        const antes = document.createElement('small');
        antes.style = 'color: #6c757d; display: block;';
        antes.textContent = `De: ${item.saldo_anterior ? parseFloat(item.saldo_anterior).toFixed(2) : '0.00'}`;
        
        const depoisDiv = document.createElement('div');
        depoisDiv.style = 'display: flex; align-items: center; margin-top: 2px;';
        
        const depois = document.createElement('strong');
        depois.textContent = `Para: ${item.saldo_atual ? parseFloat(item.saldo_atual).toFixed(2) : '0.00'}`;
        
        const variacao = document.createElement('span');
        variacao.style = saldoVariacao >= 0 ? styles.badgeSuccess : styles.badgeDanger;
        variacao.style.marginLeft = '8px';
        variacao.style.padding = '2px 6px';
        variacao.style.fontSize = '0.75rem';
        variacao.textContent = (saldoVariacao >= 0 ? '+' : '') + saldoVariacao.toFixed(2);
        
        depoisDiv.appendChild(depois);
        depoisDiv.appendChild(variacao);
        
        saldoDiv.appendChild(antes);
        saldoDiv.appendChild(depoisDiv);
        td6.appendChild(saldoDiv);
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        row.appendChild(td5);
        row.appendChild(td6);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Rodapé
    const tfoot = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    footerRow.style.backgroundColor = '#f8f9fa';
    
    const footerTd1 = document.createElement('td');
    applyStyles(footerTd1, styles.tableCell);
    footerTd1.innerHTML = '<strong>TOTAIS</strong>';
    
    const footerTd2 = document.createElement('td');
    applyStyles(footerTd2, styles.tableCell);
    footerTd2.innerHTML = `<strong>${totalValor.toFixed(2)} MZN</strong>`;
    
    const footerTd3 = document.createElement('td');
    applyStyles(footerTd3, styles.tableCell);
    footerTd3.innerHTML = `<strong>${totalKWH.toFixed(3)} kWh</strong>`;
    
    const footerTd4 = document.createElement('td');
    footerTd4.colSpan = 3;
    applyStyles(footerTd4, styles.tableCell);
    
    const media = document.createElement('span');
    media.style = 'color: #6c757d; font-size: 0.9rem;';
    media.innerHTML = `<i class="bi bi-info-circle"></i> Média: ${(totalValor / Math.max(totalKWH, 1)).toFixed(3)} MZN/kWh`;
    
    footerTd4.appendChild(media);
    
    footerRow.appendChild(footerTd1);
    footerRow.appendChild(footerTd2);
    footerRow.appendChild(footerTd3);
    footerRow.appendChild(footerTd4);
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);
    
    mainDiv.appendChild(table);
    container.appendChild(mainDiv);
}

/**
 * Funções auxiliares
 */
function getIconForHeader(text) {
    const icons = {
        'Data': 'calendar',
        'Energia': 'lightning',
        'Custo': 'cash',
        'Média': 'speedometer2',
        'Pico': 'lightning-fill',
        'Hora': 'clock',
        'Nível': 'activity',
        'Valor': 'cash',
        'kWh': 'lightning',
        'Taxas': 'percent',
        'Preço': 'currency-exchange',
        'Saldo': 'wallet2',
        'Descrição': 'list',
        'Energia/Valor': 'graph-up'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (text.includes(key)) return icon;
    }
    return 'info-circle';
}

function createEmptyState(message) {
    return `
        <div style="${styles.emptyState}">
            <i class="bi bi-database-slash" style="${styles.emptyIcon}"></i>
            <h6 style="margin: 10px 0 5px 0; font-size: 1.1rem;">${message}</h6>
            <p style="color: #6c757d; font-size: 0.9rem;">Tente ajustar os filtros ou selecionar outro período.</p>
        </div>
    `;
}

function renderGraficoConsumo(dados, container) {
    // Esta função requer Chart.js
    try {
        const canvas = document.createElement('canvas');
        canvas.style.marginTop = '20px';
        canvas.style.maxHeight = '300px';
        
        const ctx = canvas.getContext('2d');
        const labels = dados.map(d => d.data);
        const valores = dados.map(d => parseFloat(d.energia || 0));
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Consumo (kWh)',
                    data: valores,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kWh'
                        }
                    }
                }
            }
        });
        
        container.appendChild(canvas);
    } catch (error) {
        console.warn('Chart.js não disponível para gráfico:', error);
    }
}

/**
 * Inicialização
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema de relatórios carregado!');
    
    // Configurar formulário
    const form = document.getElementById('report-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            gerarRelatorio();
        });
    }
    
    // Mostrar/ocultar datas customizadas
    const periodSelect = document.getElementById('report-period');
    const customDates = document.getElementById('custom-dates');
    
    if (periodSelect && customDates) {
        periodSelect.addEventListener('change', function() {
            customDates.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }
    
    // Setar data padrão
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) startDateInput.value = yesterday;
    if (endDateInput) endDateInput.value = today;
});

/**
 * Sistema de exportação (manter do código anterior)
 */
function exportData(format) {
    // Mantenha seu código de exportação existente aqui
    console.log('Exportando para:', format);
}

function showToast(message, type = 'info') {
    // Mantenha seu código de toast existente aqui
    alert(message);
}