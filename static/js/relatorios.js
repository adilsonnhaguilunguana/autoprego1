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
 * Renderiza relatório de desempenho por relé
 */
function renderRelatorioReles(data) {
    const container = document.getElementById('report-results');
    const dados = data.dados || [];
    const metadata = data.metadata || {};
    
    if (dados.length === 0) {
        container.innerHTML = createEmptyState('Nenhum relé encontrado ou sem dados no período');
        return;
    }
    
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-toggle-on"></i> Desempenho por Relé`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const periodoBadge = document.createElement('span');
    applyStyles(periodoBadge, styles.statBadge);
    periodoBadge.innerHTML = `<i class="bi bi-calendar"></i> ${metadata.periodo || 'N/A'}`;
    
    const totalRelesBadge = document.createElement('span');
    applyStyles(totalRelesBadge, styles.statBadge);
    totalRelesBadge.innerHTML = `<i class="bi bi-plug"></i> ${dados.length} Relés`;
    
    statsDiv.appendChild(periodoBadge);
    statsDiv.appendChild(totalRelesBadge);
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Resumo de eficiência
    let totalCiclos = 0;
    let relesLigados = 0;
    
    dados.forEach(rele => {
        totalCiclos += rele.ciclos || 0;
        if (rele.estado === 1) relesLigados++;
    });
    
    const resumoDiv = document.createElement('div');
    resumoDiv.style = styles.summaryBox.replace('border-left: 4px solid #1a73e8;', 'border-left: 4px solid #6610f2;');
    
    const resumoRow = document.createElement('div');
    applyStyles(resumoRow, styles.row);
    
    // Métrica 1: Relés Ativos
    const col1 = document.createElement('div');
    applyStyles(col1, styles.col);
    
    const metric1 = document.createElement('div');
    metric1.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #6610f2 0%, #520dc2 100%)');
    metric1.innerHTML = `
        <div style="${styles.metricValue}">${relesLigados}/${dados.length}</div>
        <div style="${styles.metricLabel}">Relés Ativos</div>
    `;
    
    // Métrica 2: Ciclos Totais
    const col2 = document.createElement('div');
    applyStyles(col2, styles.col);
    
    const metric2 = document.createElement('div');
    metric2.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #20c997 0%, #1aa179 100%)');
    metric2.innerHTML = `
        <div style="${styles.metricValue}">${totalCiclos}</div>
        <div style="${styles.metricLabel}">Ciclos Totais</div>
    `;
    
    // Métrica 3: Eficiência Média
    const col3 = document.createElement('div');
    applyStyles(col3, styles.col);
    
    let eficienciaMedia = 0;
    if (dados.length > 0) {
        const somaEficiencia = dados.reduce((acc, rele) => acc + (rele.percent_ligado || 0), 0);
        eficienciaMedia = somaEficiencia / dados.length;
    }
    
    const metric3 = document.createElement('div');
    metric3.style = styles.metricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #fd7e14 0%, #e96b00 100%)');
    metric3.innerHTML = `
        <div style="${styles.metricValue}">${eficienciaMedia.toFixed(1)}%</div>
        <div style="${styles.metricLabel}">Uso Médio</div>
    `;
    
    col1.appendChild(metric1);
    col2.appendChild(metric2);
    col3.appendChild(metric3);
    
    resumoRow.appendChild(col1);
    resumoRow.appendChild(col2);
    resumoRow.appendChild(col3);
    resumoDiv.appendChild(resumoRow);
    mainDiv.appendChild(resumoDiv);
    
    // Lista de relés
    dados.forEach((rele, index) => {
        const estadoCor = rele.estado === 1 ? 'success' : 'secondary';
        const estadoTexto = rele.estado === 1 ? 'LIGADO' : 'DESLIGADO';
        const estadoIcone = rele.estado === 1 ? 'bi-toggle-on' : 'bi-toggle-off';
        
        const card = document.createElement('div');
        applyStyles(card, styles.card);
        
        // Cabeçalho do card
        const cardHeader = document.createElement('div');
        applyStyles(cardHeader, styles.cardHeader);
        
        const headerContent = document.createElement('div');
        headerContent.style.display = 'flex';
        headerContent.style.justifyContent = 'space-between';
        headerContent.style.alignItems = 'center';
        headerContent.style.width = '100%';
        
        const leftSection = document.createElement('div');
        leftSection.style.display = 'flex';
        leftSection.style.alignItems = 'center';
        leftSection.style.gap = '10px';
        
        const estadoBadge = document.createElement('span');
        estadoBadge.style = estadoCor === 'success' ? styles.badgeSuccess : styles.badgeSecondary;
        estadoBadge.style.padding = '5px 10px';
        estadoBadge.style.display = 'inline-flex';
        estadoBadge.style.alignItems = 'center';
        estadoBadge.style.gap = '5px';
        estadoBadge.innerHTML = `<i class="bi ${estadoIcone}"></i> ${estadoTexto}`;
        
        const nome = document.createElement('strong');
        nome.textContent = rele.nome;
        nome.style.fontSize = '1.1rem';
        
        const pzemInfo = document.createElement('span');
        pzemInfo.style.color = '#6c757d';
        pzemInfo.textContent = `(PZEM ${rele.pzem_id})`;
        
        const rightSection = document.createElement('div');
        const ciclosBadge = document.createElement('span');
        applyStyles(ciclosBadge, styles.badgeInfo);
        ciclosBadge.innerHTML = `<i class="bi bi-arrow-repeat"></i> ${rele.ciclos || 0} ciclos`;
        
        leftSection.appendChild(estadoBadge);
        leftSection.appendChild(nome);
        leftSection.appendChild(pzemInfo);
        rightSection.appendChild(ciclosBadge);
        
        headerContent.appendChild(leftSection);
        headerContent.appendChild(rightSection);
        cardHeader.appendChild(headerContent);
        card.appendChild(cardHeader);
        
        // Corpo do card
        const cardBody = document.createElement('div');
        applyStyles(cardBody, styles.cardBody);
        
        // Primeira linha: Estatísticas
        const statsRow = document.createElement('div');
        applyStyles(statsRow, styles.row);
        
        // Coluna 1: Progresso
        const statsCol1 = document.createElement('div');
        statsCol1.style.flex = '2';
        statsCol1.style.padding = '0 10px';
        
        const progressDiv = document.createElement('div');
        applyStyles(progressDiv, styles.progressBar);
        
        const progressFill = document.createElement('div');
        progressFill.style = styles.progressFill;
        progressFill.style.width = `${rele.percent_ligado || 0}%`;
        progressFill.style.background = rele.percent_ligado > 70 ? '#28a745' : 
                                       rele.percent_ligado > 40 ? '#ffc107' : '#6c757d';
        
        progressDiv.appendChild(progressFill);
        
        const progressInfo = document.createElement('div');
        progressInfo.style.display = 'flex';
        progressInfo.style.justifyContent = 'space-between';
        progressInfo.style.marginTop = '8px';
        progressInfo.style.fontSize = '0.9rem';
        progressInfo.style.color = '#6c757d';
        
        progressInfo.innerHTML = `
            <span><i class="bi bi-clock"></i> Ligado: ${rele.total_ligado || '0h'}</span>
            <span><i class="bi bi-power"></i> Desligado: ${rele.total_desligado || '0h'}</span>
        `;
        
        statsCol1.appendChild(progressDiv);
        statsCol1.appendChild(progressInfo);
        
        // Coluna 2: Porcentagens
        const statsCol2 = document.createElement('div');
        statsCol2.style.flex = '1';
        statsCol2.style.padding = '0 10px';
        
        const porcentagensDiv = document.createElement('div');
        porcentagensDiv.style.background = '#f8f9fa';
        porcentagensDiv.style.padding = '15px';
        porcentagensDiv.style.borderRadius = '8px';
        
        const ligadoDiv = document.createElement('div');
        ligadoDiv.style.display = 'flex';
        ligadoDiv.style.justifyContent = 'space-between';
        ligadoDiv.style.marginBottom = '8px';
        
        ligadoDiv.innerHTML = `
            <span>Ligado:</span>
            <strong style="color: #28a745;">${rele.percent_ligado || 0}%</strong>
        `;
        
        const desligadoDiv = document.createElement('div');
        desligadoDiv.style.display = 'flex';
        desligadoDiv.style.justifyContent = 'space-between';
        
        desligadoDiv.innerHTML = `
            <span>Desligado:</span>
            <strong style="color: #6c757d;">${rele.percent_desligado || 0}%</strong>
        `;
        
        porcentagensDiv.appendChild(ligadoDiv);
        porcentagensDiv.appendChild(desligadoDiv);
        statsCol2.appendChild(porcentagensDiv);
        
        statsRow.appendChild(statsCol1);
        statsRow.appendChild(statsCol2);
        cardBody.appendChild(statsRow);
        
        // Eventos (se existirem)
        if (rele.eventos && rele.eventos.length > 0) {
            const eventosDiv = document.createElement('div');
            eventosDiv.style.marginTop = '20px';
            
            const eventosTitle = document.createElement('h6');
            eventosTitle.style = 'border-bottom: 2px solid #dee2e6; padding-bottom: 8px; margin-bottom: 10px;';
            eventosTitle.innerHTML = `<i class="bi bi-list-ul"></i> Eventos do Período`;
            
            const eventosTable = document.createElement('table');
            eventosTable.style.width = '100%';
            eventosTable.style.fontSize = '0.85rem';
            
            // Cabeçalho da tabela de eventos
            const eventosThead = document.createElement('thead');
            eventosThead.innerHTML = `
                <tr style="background: #f8f9fa;">
                    <th style="padding: 8px 10px; text-align: left;">Hora</th>
                    <th style="padding: 8px 10px; text-align: left;">Estado</th>
                    <th style="padding: 8px 10px; text-align: left;">Duração</th>
                </tr>
            `;
            
            // Corpo da tabela de eventos
            const eventosTbody = document.createElement('tbody');
            
            rele.eventos.forEach((evento, i) => {
                const row = document.createElement('tr');
                if (i % 2 === 0) {
                    row.style.background = '#fff';
                } else {
                    row.style.background = '#f8f9fa';
                }
                
                row.innerHTML = `
                    <td style="padding: 8px 10px;">
                        <i class="bi bi-clock"></i> ${evento.hora || '--:--'}
                    </td>
                    <td style="padding: 8px 10px;">
                        <span class="${evento.estado === 'LIGADO' ? 'badge bg-success' : 'badge bg-secondary'}" 
                              style="padding: 3px 8px; border-radius: 4px; font-size: 0.75rem;">
                            ${evento.estado || 'DESCONHECIDO'}
                        </span>
                    </td>
                    <td style="padding: 8px 10px; text-align: right;">
                        ${evento.duracao || '0h'}
                    </td>
                `;
                
                eventosTbody.appendChild(row);
            });
            
            eventosTable.appendChild(eventosThead);
            eventosTable.appendChild(eventosTbody);
            
            eventosDiv.appendChild(eventosTitle);
            eventosDiv.appendChild(eventosTable);
            cardBody.appendChild(eventosDiv);
        } else {
            const noEvents = document.createElement('div');
            noEvents.style.textAlign = 'center';
            noEvents.style.padding = '20px';
            noEvents.style.color = '#6c757d';
            noEvents.innerHTML = `
                <i class="bi bi-calendar-x" style="font-size: 2rem; opacity: 0.5;"></i>
                <p style="margin-top: 10px;">Nenhum evento registrado neste período</p>
                <small>O relé manteve estado constante</small>
            `;
            cardBody.appendChild(noEvents);
        }
        
        card.appendChild(cardBody);
        mainDiv.appendChild(card);
    });
    
    // Análise de desempenho
    const analiseDiv = document.createElement('div');
    applyStyles(analiseDiv, styles.card);
    
    const analiseHeader = document.createElement('div');
    analiseHeader.style = styles.cardHeader;
    analiseHeader.innerHTML = `<i class="bi bi-graph-up"></i> Análise de Desempenho`;
    
    const analiseBody = document.createElement('div');
    analiseBody.style.padding = '20px';
    
    // Calcular métricas de análise
    const relesComAltaUtilizacao = dados.filter(r => r.percent_ligado > 70).length;
    const relesComBaixaUtilizacao = dados.filter(r => r.percent_ligado < 30).length;
    const relesComMuitosCiclos = dados.filter(r => (r.ciclos || 0) > 10).length;
    
    const analiseContent = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #2e7d32;">${relesComAltaUtilizacao}</div>
                <div style="color: #666; font-size: 0.9rem;">Relés com alta utilização (>70%)</div>
            </div>
            
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #e65100;">${relesComBaixaUtilizacao}</div>
                <div style="color: #666; font-size: 0.9rem;">Relés com baixa utilização (<30%)</div>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #1565c0;">${relesComMuitosCiclos}</div>
                <div style="color: #666; font-size: 0.9rem;">Relés com muitos ciclos (>10)</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem;">
            <h6 style="margin-top: 0; color: #495057;">📋 Recomendações:</h6>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                ${relesComAltaUtilizacao > 0 ? 
                    `<li>Relés com alta utilização podem precisar de manutenção preventiva</li>` : ''}
                ${relesComBaixaUtilizacao > 0 ? 
                    `<li>Relés pouco utilizados podem ser desnecessários - considere otimizar</li>` : ''}
                ${relesComMuitosCiclos > 0 ? 
                    `<li>Relés com muitos ciclos podem ter vida útil reduzida</li>` : ''}
                ${dados.length > 0 && relesComAltaUtilizacao === 0 && relesComBaixaUtilizacao === 0 ? 
                    `<li>Desempenho equilibrado - todos os relés operando dentro dos parâmetros ideais</li>` : ''}
            </ul>
        </div>
    `;
    
    analiseBody.innerHTML = analiseContent;
    analiseDiv.appendChild(analiseHeader);
    analiseDiv.appendChild(analiseBody);
    mainDiv.appendChild(analiseDiv);
    
    container.appendChild(mainDiv);
}

/**
 * Renderiza relatório de análise de custos (versão completa)
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
    
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    
    // Header
    const headerDiv = document.createElement('div');
    applyStyles(headerDiv, styles.header);
    
    const title = document.createElement('h6');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.innerHTML = `<i class="bi bi-calculator"></i> Análise Avançada de Custos e Eficiência`;
    
    const statsDiv = document.createElement('div');
    applyStyles(statsDiv, styles.stats);
    
    const categoriaBadge = document.createElement('span');
    const cor = metricas.cor_categoria || 'primary';
    categoriaBadge.style = `
        background: ${cor === 'success' ? '#28a745' : 
                     cor === 'warning' ? '#ffc107' : 
                     cor === 'danger' ? '#dc3545' : '#1a73e8'};
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
    `;
    categoriaBadge.innerHTML = `<i class="bi bi-award"></i> ${metricas.categoria_eficiencia || 'ANÁLISE'}`;
    
    const periodoBadge = document.createElement('span');
    applyStyles(periodoBadge, styles.statBadge);
    periodoBadge.innerHTML = `<i class="bi bi-calendar-week"></i> ${metadata.periodo || 'N/A'}`;
    
    statsDiv.appendChild(categoriaBadge);
    statsDiv.appendChild(periodoBadge);
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Score e Métricas Principais
    const scoreRow = document.createElement('div');
    applyStyles(scoreRow, styles.row);
    
    // Score de Eficiência (Circular)
    const scoreCol = document.createElement('div');
    scoreCol.style.flex = '1';
    scoreCol.style.padding = '0 10px';
    scoreCol.style.minWidth = '200px';
    
    const scoreCard = document.createElement('div');
    scoreCard.style.background = 'white';
    scoreCard.style.borderRadius = '12px';
    scoreCard.style.padding = '20px';
    scoreCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    scoreCard.style.textAlign = 'center';
    
    // Determinar cor do score
    const score = metricas.score_eficiencia || 0;
    let scoreColor, scoreIcon;
    
    if (score >= 80) {
        scoreColor = '#28a745';
        scoreIcon = 'bi-trophy-fill';
    } else if (score >= 60) {
        scoreColor = '#17a2b8';
        scoreIcon = 'bi-check-circle-fill';
    } else if (score >= 40) {
        scoreColor = '#ffc107';
        scoreIcon = 'bi-exclamation-triangle-fill';
    } else {
        scoreColor = '#dc3545';
        scoreIcon = 'bi-exclamation-octagon-fill';
    }
    
    // SVG do círculo de progresso
    const scoreSVG = `
        <svg width="120" height="120" viewBox="0 0 120 120" style="margin: 0 auto 15px auto;">
            <!-- Círculo de fundo -->
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e9ecef" stroke-width="8"/>
            <!-- Círculo de progresso -->
            <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8"
                    stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 54}"
                    stroke-dashoffset="${2 * Math.PI * 54 * (1 - score / 100)}"
                    transform="rotate(-90 60 60)"/>
            <!-- Texto do score -->
            <text x="60" y="60" text-anchor="middle" dy="8" style="font-size: 28px; font-weight: bold; fill: ${scoreColor};">
                ${score.toFixed(0)}
            </text>
            <text x="60" y="85" text-anchor="middle" style="font-size: 14px; fill: #6c757d;">
                /100
            </text>
        </svg>
    `;
    
    scoreCard.innerHTML = `
        <div style="margin-bottom: 15px;">
            ${scoreSVG}
        </div>
        <div style="font-size: 1.1rem; font-weight: 600; color: #495057; margin-bottom: 5px;">
            <i class="bi ${scoreIcon}" style="color: ${scoreColor};"></i>
            Score de Eficiência
        </div>
        <div style="font-size: 0.9rem; color: #6c757d;">
            ${metricas.categoria_eficiencia || 'N/A'}
        </div>
    `;
    
    scoreCol.appendChild(scoreCard);
    
    // Métricas Financeiras
    const metricsCol = document.createElement('div');
    metricsCol.style.flex = '2';
    metricsCol.style.padding = '0 10px';
    
    const metricsGrid = document.createElement('div');
    metricsGrid.style.display = 'grid';
    metricsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    metricsGrid.style.gap = '15px';
    
    // Métrica 1: Saldo Líquido
    const saldoLiquido = metadata.saldo_liquido || 0;
    const saldoCard = document.createElement('div');
    saldoCard.style.background = saldoLiquido >= 0 ? 
        'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 
        'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    saldoCard.style.color = 'white';
    saldoCard.style.padding = '20px';
    saldoCard.style.borderRadius = '10px';
    saldoCard.style.textAlign = 'center';
    
    saldoCard.innerHTML = `
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">
            ${saldoLiquido >= 0 ? '+' : ''}${saldoLiquido.toFixed(2)}
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
            <i class="bi ${saldoLiquido >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}"></i>
            Saldo Líquido (MZN)
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">
            ${saldoLiquido >= 0 ? 'Superavit' : 'Déficit'} no período
        </div>
    `;
    
    // Métrica 2: Custo Médio Diário
    const custoMedioCard = document.createElement('div');
    custoMedioCard.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
    custoMedioCard.style.color = '#212529';
    custoMedioCard.style.padding = '20px';
    custoMedioCard.style.borderRadius = '10px';
    custoMedioCard.style.textAlign = 'center';
    
    custoMedioCard.innerHTML = `
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">
            ${metricas.custo_medio_diario ? metricas.custo_medio_diario.toFixed(2) : '0.00'}
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
            <i class="bi bi-calendar-day"></i>
            Custo Médio Diário
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">
            Média por dia (MZN)
        </div>
    `;
    
    // Métrica 3: Dias Restantes
    const diasCard = document.createElement('div');
    diasCard.style.background = 'linear-gradient(135deg, #6f42c1 0%, #5a3796 100%)';
    diasCard.style.color = 'white';
    diasCard.style.padding = '20px';
    diasCard.style.borderRadius = '10px';
    diasCard.style.textAlign = 'center';
    
    diasCard.innerHTML = `
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">
            ${metricas.dias_restantes ? metricas.dias_restantes.toFixed(1) : '0'}
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
            <i class="bi bi-clock-history"></i>
            Saldo Atual Restante
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">
            ${metricas.previsao_termino || 'Sem previsão'}
        </div>
    `;
    
    // Métrica 4: Economia Potencial
    const economiaCard = document.createElement('div');
    economiaCard.style.background = 'linear-gradient(135deg, #20c997 0%, #1aa179 100%)';
    economiaCard.style.color = 'white';
    economiaCard.style.padding = '20px';
    economiaCard.style.borderRadius = '10px';
    economiaCard.style.textAlign = 'center';
    
    economiaCard.innerHTML = `
        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 5px;">
            ${metricas.economia_potencial ? metricas.economia_potencial.toFixed(2) : '0.00'}
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
            <i class="bi bi-coin"></i>
            Economia Potencial
        </div>
        <div style="margin-top: 10px; font-size: 0.8rem; opacity: 0.8;">
            Média mensal (MZN)
        </div>
    `;
    
    metricsGrid.appendChild(saldoCard);
    metricsGrid.appendChild(custoMedioCard);
    metricsGrid.appendChild(diasCard);
    metricsGrid.appendChild(economiaCard);
    metricsCol.appendChild(metricsGrid);
    
    scoreRow.appendChild(scoreCol);
    scoreRow.appendChild(metricsCol);
    mainDiv.appendChild(scoreRow);
    
    // Análise Detalhada
    const analiseDiv = document.createElement('div');
    applyStyles(analiseDiv, styles.card);
    analiseDiv.style.marginTop = '20px';
    
    const analiseHeader = document.createElement('div');
    analiseHeader.style = styles.cardHeader;
    analiseHeader.innerHTML = `<i class="bi bi-clipboard-data"></i> Análise Detalhada`;
    
    const analiseBody = document.createElement('div');
    analiseBody.style.padding = '20px';
    
    // Grid de análise
    const analiseGrid = document.createElement('div');
    analiseGrid.style.display = 'grid';
    analiseGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    analiseGrid.style.gap = '20px';
    
    // Item 1: Consumo Atual
    const consumoAtualItem = document.createElement('div');
    consumoAtualItem.style.background = '#e3f2fd';
    consumoAtualItem.style.padding = '15px';
    consumoAtualItem.style.borderRadius = '8px';
    consumoAtualItem.style.borderLeft = '4px solid #2196f3';
    
    consumoAtualItem.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <i class="bi bi-lightning-charge" style="font-size: 1.5rem; color: #2196f3; margin-right: 10px;"></i>
            <div>
                <div style="font-weight: 600; color: #1565c0;">Consumo Atual</div>
                <div style="font-size: 0.9rem; color: #666;">Em tempo real</div>
            </div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: #1976d2;">
                ${metricas.consumo_atual_kw ? metricas.consumo_atual_kw.toFixed(2) : '0.00'} kW
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                ≈ ${metricas.consumo_atual_kw ? (metricas.consumo_atual_kw * (metadata.preco_kwh || 0)).toFixed(2) : '0.00'} MZN/h
            </div>
        </div>
    `;
    
    // Item 2: Variação de Consumo
    const variacaoItem = document.createElement('div');
    const variacao = metricas.variacao_consumo || 0;
    variacaoItem.style.background = variacao >= 0 ? '#f8d7da' : '#d4edda';
    variacaoItem.style.padding = '15px';
    variacaoItem.style.borderRadius = '8px';
    variacaoItem.style.borderLeft = `4px solid ${variacao >= 0 ? '#dc3545' : '#28a745'}`;
    
    variacaoItem.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <i class="bi ${variacao >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'}" 
               style="font-size: 1.5rem; color: ${variacao >= 0 ? '#dc3545' : '#28a745'}; margin-right: 10px;"></i>
            <div>
                <div style="font-weight: 600; color: ${variacao >= 0 ? '#c82333' : '#1e7e34'};">Variação de Consumo</div>
                <div style="font-size: 0.9rem; color: #666;">Comparado ao período anterior</div>
            </div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: ${variacao >= 0 ? '#dc3545' : '#28a745'};">
                ${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                ${variacao >= 0 ? 'Aumento' : 'Redução'} no consumo
            </div>
        </div>
    `;
    
    // Item 3: Horas em Pico
    const picoItem = document.createElement('div');
    const horasPico = metricas.percentual_horas_pico || 0;
    picoItem.style.background = horasPico > 30 ? '#fff3cd' : '#e8f5e9';
    picoItem.style.padding = '15px';
    picoItem.style.borderRadius = '8px';
    picoItem.style.borderLeft = `4px solid ${horasPico > 30 ? '#ffc107' : '#28a745'}`;
    
    picoItem.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <i class="bi bi-exclamation-triangle" 
               style="font-size: 1.5rem; color: ${horasPico > 30 ? '#e0a800' : '#2e7d32'}; margin-right: 10px;"></i>
            <div>
                <div style="font-weight: 600; color: ${horasPico > 30 ? '#e0a800' : '#1e7e34'};">Horas em Pico</div>
                <div style="font-size: 0.9rem; color: #666;">Acima de 70% do limite</div>
            </div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: ${horasPico > 30 ? '#e0a800' : '#2e7d32'};">
                ${horasPico.toFixed(1)}%
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                ${horasPico > 30 ? 'Alto consumo em pico' : 'Consumo equilibrado'}
            </div>
        </div>
    `;
    
    // Item 4: Eficiência Financeira
    const eficienciaItem = document.createElement('div');
    const eficienciaFinanceira = metricas.eficiencia_financeira || 0;
    const precoKWH = metadata.preco_kwh || 0;
    const diferenca = eficienciaFinanceira - precoKWH;
    
    eficienciaItem.style.background = diferenca > 0.1 ? '#f8d7da' : '#d4edda';
    eficienciaItem.style.padding = '15px';
    eficienciaItem.style.borderRadius = '8px';
    eficienciaItem.style.borderLeft = `4px solid ${diferenca > 0.1 ? '#dc3545' : '#28a745'}`;
    
    eficienciaItem.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <i class="bi bi-cash-coin" 
               style="font-size: 1.5rem; color: ${diferenca > 0.1 ? '#dc3545' : '#28a745'}; margin-right: 10px;"></i>
            <div>
                <div style="font-weight: 600; color: ${diferenca > 0.1 ? '#c82333' : '#1e7e34'};">Eficiência Financeira</div>
                <div style="font-size: 0.9rem; color: #666;">Custo por kWh real</div>
            </div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 1.8rem; font-weight: bold; color: ${diferenca > 0.1 ? '#dc3545' : '#28a745'};">
                ${eficienciaFinanceira.toFixed(3)} MZN
            </div>
            <div style="font-size: 0.9rem; color: #666;">
                ${diferenca > 0.1 ? 'Acima do preço base' : 'Dentro do esperado'}
            </div>
        </div>
    `;
    
    analiseGrid.appendChild(consumoAtualItem);
    analiseGrid.appendChild(variacaoItem);
    analiseGrid.appendChild(picoItem);
    analiseGrid.appendChild(eficienciaItem);
    analiseBody.appendChild(analiseGrid);
    
    // Recomendações
    const recomendacoesDiv = document.createElement('div');
    recomendacoesDiv.style.marginTop = '25px';
    recomendacoesDiv.style.padding = '20px';
    recomendacoesDiv.style.background = '#f8f9fa';
    recomendacoesDiv.style.borderRadius = '10px';
    recomendacoesDiv.style.borderLeft = '4px solid #6c757d';
    
    let recomendacoesHTML = `
        <h6 style="margin-top: 0; color: #495057; display: flex; align-items: center; gap: 10px;">
            <i class="bi bi-lightbulb"></i> Recomendações para Melhoria
        </h6>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
    `;
    
    // Recomendação baseada no score
    if (score < 40) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dc3545;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-exclamation-octagon-fill" style="color: #dc3545; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #dc3545;">Prioridade Urgente</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Otimização imediata necessária. Considere reduzir consumo nos horários de pico.
                        </p>
                    </div>
                </div>
            </div>
        `;
    } else if (score < 60) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-exclamation-triangle-fill" style="color: #ffc107; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #e0a800;">Necessita Melhoria</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Há espaço para otimização. Considere ajustar o uso de equipamentos de alto consumo.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Recomendação baseada em horas de pico
    if (horasPico > 30) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-clock" style="color: #ffc107; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #e0a800;">Gerenciamento de Picos</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Reduza o uso de equipamentos pesados durante os horários de pico.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Recomendação baseada na variação
    if (variacao > 10) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dc3545;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-graph-up-arrow" style="color: #dc3545; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #dc3545;">Consumo Crescente</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Consumo aumentando significativamente. Verifique equipamentos novos ou mal configurados.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Recomendação baseada na eficiência financeira
    if (diferenca > 0.1) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dc3545;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-cash-stack" style="color: #dc3545; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #dc3545;">Custo por kWh Alto</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Custo real acima do preço base. Considere otimizar o consumo para reduzir custos.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Recomendação de economia
    if (metricas.economia_potencial > 0) {
        recomendacoesHTML += `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #28a745;">
                <div style="display: flex; align-items: start; gap: 10px;">
                    <i class="bi bi-coin" style="color: #28a745; font-size: 1.2rem;"></i>
                    <div>
                        <strong style="color: #28a745;">Economia Potencial</strong>
                        <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
                            Pode economizar até ${metricas.economia_potencial.toFixed(2)} MZN/mês com otimizações.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    recomendacoesHTML += `</div>`;
    recomendacoesDiv.innerHTML = recomendacoesHTML;
    analiseBody.appendChild(recomendacoesDiv);
    
    analiseDiv.appendChild(analiseHeader);
    analiseDiv.appendChild(analiseBody);
    mainDiv.appendChild(analiseDiv);
    
    // Tabela de Dados Detalhados
    const tabelaDiv = document.createElement('div');
    applyStyles(tabelaDiv, styles.card);
    tabelaDiv.style.marginTop = '20px';
    
    const tabelaHeader = document.createElement('div');
    tabelaHeader.style = styles.cardHeader;
    tabelaHeader.innerHTML = `<i class="bi bi-table"></i> Dados Detalhados do Período`;
    
    const tabelaBody = document.createElement('div');
    tabelaBody.style.padding = '20px';
    
    // Filtrar apenas dados normais (não especiais)
    const dadosNormais = dados.filter(d => !d.tipo || d.tipo === 'normal');
    
    if (dadosNormais.length > 0) {
        const table = document.createElement('table');
        applyStyles(table, styles.table);
        
        // Cabeçalho
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Data', 'Energia (kWh)', 'Custo Diário (MZN)', 'Custo/kWh'];
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
        
        dadosNormais.forEach(item => {
            const custoUnitario = item.energia > 0 ? (item.custo_dia / item.energia).toFixed(3) : '0.000';
            
            const row = document.createElement('tr');
            applyStyles(row, styles.tableRow);
            
            // Data
            const td1 = document.createElement('td');
            applyStyles(td1, styles.tableCell);
            td1.textContent = item.data || 'N/A';
            
            // Energia
            const td2 = document.createElement('td');
            applyStyles(td2, styles.tableCell);
            td2.textContent = item.energia ? parseFloat(item.energia).toFixed(3) + ' kWh' : '0.000 kWh';
            
            // Custo Diário
            const td3 = document.createElement('td');
            applyStyles(td3, styles.tableCell);
            td3.textContent = item.custo_dia ? parseFloat(item.custo_dia).toFixed(2) + ' MZN' : '0.00 MZN';
            
            // Custo por kWh
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
        tabelaBody.appendChild(table);
    } else {
        tabelaBody.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #6c757d;">
                <i class="bi bi-database" style="font-size: 3rem; opacity: 0.5;"></i>
                <p style="margin-top: 15px;">Nenhum dado diário disponível para este período</p>
            </div>
        `;
    }
    
    tabelaDiv.appendChild(tabelaHeader);
    tabelaDiv.appendChild(tabelaBody);
    mainDiv.appendChild(tabelaDiv);
    
    container.appendChild(mainDiv);
    
    // Adicionar badge secundário se disponível
    if (!styles.badgeSecondary) {
        styles.badgeSecondary = 'background: #6c757d; color: white;';
    }
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
// ==========================================================
// FUNÇÕES DE EXPORTAÇÃO COMPLETAS
// ==========================================================

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
        } else if (format === 'excel') {
            exportToExcel(window.currentReportData);
        } else if (format === 'json') {
            exportToJSON(window.currentReportData);
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
    csvContent += "# Gerado em: " + new Date().toLocaleString('pt-PT') + "\n\n";
    
    if (dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }
    
    // Determinar cabeçalhos baseados no tipo de relatório
    let headers = [];
    if (dados.length > 0) {
        headers = Object.keys(dados[0]);
    }
    
    // Filtrar cabeçalhos indesejados (como 'tipo' para relatórios de custos)
    headers = headers.filter(h => h !== 'tipo' || data.metadata?.tipo !== 'analise_custos');
    
    // Cabeçalhos
    csvContent += headers.map(h => `"${h.replace(/_/g, ' ').toUpperCase()}"`).join(';') + '\n';
    
    // Dados
    dados.forEach(row => {
        // Para relatórios de custos, não exportar linhas especiais
        if (data.metadata?.tipo === 'analise_custos' && row.tipo && row.tipo !== 'normal') {
            return; // Pula linhas de resumo/metadados
        }
        
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(';') + '\n';
    });
    
    // Adicionar totais se existirem
    if (metadata.energia_total || metadata.custo_total) {
        csvContent += '\n# RESUMO\n';
        if (metadata.energia_total) {
            csvContent += `"Energia Total";"${metadata.energia_total} kWh"\n`;
        }
        if (metadata.custo_total) {
            csvContent += `"Custo Total";"${metadata.custo_total} MZN"\n`;
        }
        if (metadata.recargas_total) {
            csvContent += `"Total Recargas";"${metadata.recargas_total} MZN"\n`;
        }
        if (metadata.saldo_liquido) {
            csvContent += `"Saldo Líquido";"${metadata.saldo_liquido} MZN"\n`;
        }
    }
    
    // Download
    const filename = `relatorio_${metadata.tipo || 'dados'}_${new Date().toISOString().slice(0,10)}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    
    showToast('✅ Relatório exportado para CSV com sucesso!', 'success');
}

/**
 * Exporta para PDF usando html2pdf.js ou impressão do navegador
 */
function exportToPDF(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    
    if (!dados || dados.length === 0) {
        showToast('⚠️ Nenhum dado para exportar.', 'warning');
        return;
    }
    
    // Verificar se html2pdf está disponível
    if (typeof html2pdf !== 'undefined') {
        exportPDFWithHtml2pdf(data);
    } else {
        exportPDFWithPrint(data);
    }
}

/**
 * Exporta PDF usando html2pdf.js (mais profissional)
 */
function exportPDFWithHtml2pdf(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    const timestamp = new Date().toLocaleString('pt-PT');
    
    // Criar elemento HTML temporário
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 800px;';
    
    // Conteúdo do PDF
    let pdfContent = `
        <div style="font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px;">
            <!-- Cabeçalho -->
            <div style="border-bottom: 3px solid #1a73e8; padding-bottom: 15px; margin-bottom: 25px;">
                <h1 style="color: #1a73e8; margin: 0; font-size: 24px;">📊 Relatório do Sistema de Energia</h1>
                <p style="margin: 5px 0; color: #666;">Sistema de Automação Residencial</p>
                <p style="margin: 5px 0; color: #999; font-size: 12px;">ID: ${Date.now().toString(36).toUpperCase()}</p>
            </div>
            
            <!-- Metadados -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #1a73e8;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 Informações do Relatório</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <div><strong>🔧 Tipo:</strong> ${getReportTypeName(metadata.tipo)}</div>
                    <div><strong>📅 Período:</strong> ${metadata.periodo || 'N/A'}</div>
                    <div><strong>⚡ PZEM:</strong> ${metadata.pzem || 'Todos'}</div>
                    <div><strong>📈 Registros:</strong> ${metadata.total_registros || dados.length}</div>
                    <div><strong>🕒 Gerado em:</strong> ${timestamp}</div>
                </div>
            </div>
    `;
    
    // Adicionar métricas se existirem
    if (metadata.metricas) {
        const metricas = metadata.metricas;
        pdfContent += `
            <div style="margin-bottom: 25px;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📊 Métricas Principais</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
        `;
        
        if (metricas.score_eficiencia) {
            pdfContent += `
                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #1a73e8;">${metricas.score_eficiencia}/100</div>
                    <div style="font-size: 12px; color: #666;">Score</div>
                </div>
            `;
        }
        
        if (metadata.energia_total) {
            pdfContent += `
                <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #2e7d32;">${metadata.energia_total}</div>
                    <div style="font-size: 12px; color: #666;">kWh Total</div>
                </div>
            `;
        }
        
        if (metadata.custo_total) {
            pdfContent += `
                <div style="background: #fff3e0; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #ef6c00;">${metadata.custo_total}</div>
                    <div style="font-size: 12px; color: #666;">MZN Total</div>
                </div>
            `;
        }
        
        if (metricas.dias_restantes) {
            pdfContent += `
                <div style="background: #f3e5f5; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #7b1fa2;">${metricas.dias_restantes.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #666;">Dias Restantes</div>
                </div>
            `;
        }
        
        pdfContent += `</div></div>`;
    }
    
    // Tabela de dados
    if (dados.length > 0) {
        pdfContent += `<h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 Dados do Relatório</h3>`;
        
        // Determinar cabeçalhos
        let headers = [];
        if (dados.length > 0) {
            headers = Object.keys(dados[0]);
        }
        
        // Filtrar cabeçalhos indesejados
        headers = headers.filter(h => h !== 'tipo' || data.metadata?.tipo !== 'analise_custos');
        
        pdfContent += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">`;
        
        // Cabeçalho da tabela
        pdfContent += `<thead><tr style="background: #1a73e8; color: white;">`;
        headers.forEach(header => {
            pdfContent += `<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${header.replace(/_/g, ' ').toUpperCase()}</th>`;
        });
        pdfContent += `</tr></thead>`;
        
        // Dados da tabela
        pdfContent += `<tbody>`;
        dados.forEach((row, index) => {
            // Para relatórios de custos, não exportar linhas especiais
            if (data.metadata?.tipo === 'analise_custos' && row.tipo && row.tipo !== 'normal') {
                return;
            }
            
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
            pdfContent += `<tr style="background: ${bgColor};">`;
            
            headers.forEach(header => {
                let value = row[header];
                if (value === null || value === undefined) value = '';
                if (typeof value === 'object') value = JSON.stringify(value);
                
                pdfContent += `<td style="padding: 8px 10px; border: 1px solid #ddd; font-size: 12px;">${value}</td>`;
            });
            
            pdfContent += `</tr>`;
        });
        pdfContent += `</tbody>`;
        pdfContent += `</table>`;
    }
    
    // Rodapé
    pdfContent += `
            <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
                <p><strong>© Sistema de Automação Residencial</strong> - Relatório gerado automaticamente</p>
                <p>Este documento é confidencial e destinado apenas ao uso interno.</p>
            </div>
        </div>
    `;
    
    tempDiv.innerHTML = pdfContent;
    document.body.appendChild(tempDiv);
    
    // Configurações do PDF
    const options = {
        margin: [10, 10, 10, 10],
        filename: `relatorio_${metadata.tipo || 'dados'}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        }
    };
    
    // Gerar PDF
    html2pdf()
        .set(options)
        .from(tempDiv)
        .save()
        .then(() => {
            document.body.removeChild(tempDiv);
            showToast('✅ PDF gerado com sucesso!', 'success');
        })
        .catch(error => {
            document.body.removeChild(tempDiv);
            console.error('Erro ao gerar PDF:', error);
            // Fallback para impressão
            exportPDFWithPrint(data);
        });
}

/**
 * Exporta PDF usando impressão do navegador (fallback)
 */
function exportPDFWithPrint(data) {
    const dados = data.dados;
    const metadata = data.metadata || {};
    const timestamp = new Date().toLocaleString('pt-PT');
    
    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('❌ Permita pop-ups para gerar o PDF.', 'error');
        return;
    }
    
    let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório - Sistema de Energia</title>
            <meta charset="utf-8">
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0;
                        color: #333;
                        font-size: 12px;
                    }
                    
                    .no-print { display: none !important; }
                    
                    table { 
                        page-break-inside: avoid;
                    }
                    
                    h1, h2, h3 { 
                        page-break-after: avoid; 
                    }
                }
                
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
                    font-size: 11px;
                }
                
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 8px 10px; 
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
                    font-size: 10px; 
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                
                h1 { color: #1a73e8; margin: 0; font-size: 24px; }
                h3 { color: #333; margin-bottom: 15px; font-size: 16px; }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 10px;
                    margin: 20px 0;
                }
                
                .metric-box {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .metric-value {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .metric-label {
                    font-size: 11px;
                    opacity: 0.9;
                }
                
                .print-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 20px;
                    background: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    z-index: 1000;
                }
                
                .print-button:hover {
                    background: #0d62d9;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir/Salvar PDF</button>
            
            <div class="header">
                <h1>📊 Relatório do Sistema de Energia</h1>
                <p><strong>Sistema de Automação Residencial</strong></p>
                <p style="color: #666; font-size: 12px;">ID: ${Date.now().toString(36).toUpperCase()}</p>
            </div>
            
            <div class="metadata">
                <h3>📋 Informações do Relatório</h3>
                <p><strong>🔧 Tipo:</strong> ${getReportTypeName(metadata.tipo)}</p>
                <p><strong>📅 Período:</strong> ${metadata.periodo || 'N/A'}</p>
                <p><strong>⚡ PZEM:</strong> ${metadata.pzem || 'Todos'}</p>
                <p><strong>📈 Total de Registros:</strong> ${metadata.total_registros || dados.length}</p>
                <p><strong>🕒 Gerado em:</strong> ${timestamp}</p>
            </div>
    `;
    
    // Adicionar métricas se existirem
    if (metadata.metricas) {
        const metricas = metadata.metricas;
        printContent += `<div class="metrics-grid">`;
        
        if (metricas.score_eficiencia) {
            printContent += `
                <div class="metric-box" style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);">
                    <div class="metric-value">${metricas.score_eficiencia}/100</div>
                    <div class="metric-label">Score de Eficiência</div>
                </div>
            `;
        }
        
        if (metadata.energia_total) {
            printContent += `
                <div class="metric-box" style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);">
                    <div class="metric-value">${metadata.energia_total}</div>
                    <div class="metric-label">kWh Total</div>
                </div>
            `;
        }
        
        if (metadata.custo_total) {
            printContent += `
                <div class="metric-box" style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);">
                    <div class="metric-value">${metadata.custo_total}</div>
                    <div class="metric-label">MZN Total</div>
                </div>
            `;
        }
        
        if (metricas.dias_restantes) {
            printContent += `
                <div class="metric-box" style="background: linear-gradient(135deg, #6f42c1 0%, #5a3796 100%);">
                    <div class="metric-value">${metricas.dias_restantes.toFixed(1)}</div>
                    <div class="metric-label">Dias Restantes</div>
                </div>
            `;
        }
        
        printContent += `</div>`;
    }
    
    // Tabela de dados
    if (dados.length > 0) {
        printContent += `<h3>📊 Dados do Relatório</h3><table>`;
        
        // Determinar cabeçalhos
        let headers = [];
        if (dados.length > 0) {
            headers = Object.keys(dados[0]);
        }
        
        // Filtrar cabeçalhos indesejados
        headers = headers.filter(h => h !== 'tipo' || data.metadata?.tipo !== 'analise_custos');
        
        // Cabeçalho
        printContent += '<tr>';
        headers.forEach(header => {
            printContent += `<th>${header.replace(/_/g, ' ').toUpperCase()}</th>`;
        });
        printContent += '</tr>';
        
        // Dados
        dados.forEach((row, index) => {
            // Para relatórios de custos, não exportar linhas especiais
            if (data.metadata?.tipo === 'analise_custos' && row.tipo && row.tipo !== 'normal') {
                return;
            }
            
            printContent += '<tr>';
            headers.forEach(header => {
                let value = row[header];
                if (value === null || value === undefined) value = '';
                if (typeof value === 'object') value = JSON.stringify(value);
                printContent += `<td>${value}</td>`;
            });
            printContent += '</tr>';
        });
        
        printContent += '</table>';
    }
    
    // Adicionar resumo se existir
    if (metadata.energia_total || metadata.custo_total) {
        printContent += `
            <h3 style="margin-top: 30px;">📈 Resumo do Período</h3>
            <table style="margin-top: 10px;">
                <tr><td style="font-weight: bold;">Energia Total:</td><td>${metadata.energia_total || '0'} kWh</td></tr>
                <tr><td style="font-weight: bold;">Custo Total:</td><td>${metadata.custo_total || '0'} MZN</td></tr>
                ${metadata.recargas_total ? `<tr><td style="font-weight: bold;">Total Recargas:</td><td>${metadata.recargas_total} MZN</td></tr>` : ''}
                ${metadata.saldo_liquido ? `<tr><td style="font-weight: bold;">Saldo Líquido:</td><td>${metadata.saldo_liquido} MZN</td></tr>` : ''}
            </table>
        `;
    }
    
    printContent += `
            <div class="footer">
                <p><strong>© Sistema de Automação Residencial</strong> - Todos os direitos reservados</p>
                <p>Relatório gerado automaticamente em ${timestamp}</p>
                <p class="no-print"><em>Use o botão acima para imprimir ou salvar como PDF</em></p>
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
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    showToast('✅ Relatório preparado para impressão/PDF!', 'success');
}

/**
 * Exporta para Excel (XLSX)
 */
function exportToExcel(data) {
    try {
        // Verificar se a biblioteca SheetJS está disponível
        if (typeof XLSX === 'undefined') {
            showToast('❌ Biblioteca Excel não disponível. Use CSV ou PDF.', 'warning');
            exportToCSV(data); // Fallback para CSV
            return;
        }
        
        const dados = data.dados;
        const metadata = data.metadata || {};
        
        if (!dados || dados.length === 0) {
            showToast('⚠️ Nenhum dado para exportar.', 'warning');
            return;
        }
        
        // Preparar dados para Excel
        const excelData = [];
        
        // Adicionar linha de metadados
        excelData.push(['RELATÓRIO DO SISTEMA DE ENERGIA']);
        excelData.push(['Tipo:', getReportTypeName(metadata.tipo)]);
        excelData.push(['Período:', metadata.periodo || 'N/A']);
        excelData.push(['PZEM:', metadata.pzem || 'Todos']);
        excelData.push(['Total de Registros:', metadata.total_registros || dados.length]);
        excelData.push(['Gerado em:', new Date().toLocaleString('pt-PT')]);
        excelData.push([]); // Linha vazia
        
        // Determinar cabeçalhos
        let headers = [];
        if (dados.length > 0) {
            headers = Object.keys(dados[0]);
        }
        
        // Filtrar cabeçalhos indesejados
        headers = headers.filter(h => h !== 'tipo' || data.metadata?.tipo !== 'analise_custos');
        
        // Adicionar cabeçalhos
        excelData.push(headers.map(h => h.replace(/_/g, ' ').toUpperCase()));
        
        // Adicionar dados
        dados.forEach(row => {
            // Para relatórios de custos, não exportar linhas especiais
            if (data.metadata?.tipo === 'analise_custos' && row.tipo && row.tipo !== 'normal') {
                return;
            }
            
            const rowData = headers.map(header => {
                let value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return value;
            });
            
            excelData.push(rowData);
        });
        
        // Adicionar resumo se existir
        if (metadata.energia_total || metadata.custo_total) {
            excelData.push([]); // Linha vazia
            excelData.push(['RESUMO DO PERÍODO']);
            excelData.push(['Energia Total:', metadata.energia_total || '0', 'kWh']);
            excelData.push(['Custo Total:', metadata.custo_total || '0', 'MZN']);
            
            if (metadata.recargas_total) {
                excelData.push(['Total Recargas:', metadata.recargas_total, 'MZN']);
            }
            
            if (metadata.saldo_liquido) {
                excelData.push(['Saldo Líquido:', metadata.saldo_liquido, 'MZN']);
            }
        }
        
        // Criar planilha
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Ajustar largura das colunas
        const wscols = [];
        headers.forEach((_, i) => {
            wscols.push({ wch: 20 }); // Largura de 20 caracteres
        });
        ws['!cols'] = wscols;
        
        // Criar livro de trabalho
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
        
        // Gerar arquivo
        const filename = `relatorio_${metadata.tipo || 'dados'}_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        showToast('✅ Relatório exportado para Excel com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar Excel:', error);
        showToast('❌ Erro ao exportar Excel. Usando CSV como fallback...', 'warning');
        exportToCSV(data); // Fallback para CSV
    }
}

/**
 * Exporta para JSON
 */
function exportToJSON(data) {
    const filename = `relatorio_${data.metadata?.tipo || 'dados'}_${new Date().toISOString().slice(0,10)}.json`;
    
    // Criar objeto de dados estruturado
    const exportData = {
        metadata: {
            ...data.metadata,
            exportado_em: new Date().toISOString(),
            versao: '1.0'
        },
        dados: data.dados
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
    
    showToast('✅ Relatório exportado para JSON com sucesso!', 'success');
}

/**
 * Função auxiliar para download de arquivos
 */
function downloadFile(content, filename, mimeType) {
    // Usar a API File se disponível
    if (window.showSaveFilePicker) {
        try {
            const opts = {
                suggestedName: filename,
                types: [{
                    description: 'Arquivo de dados',
                    accept: { [mimeType]: [`.${filename.split('.').pop()}`] }
                }]
            };
            
            window.showSaveFilePicker(opts)
                .then(handle => {
                    const writable = handle.createWritable();
                    return writable.write(content)
                        .then(() => writable.close());
                })
                .then(() => {
                    console.log('Arquivo salvo com a nova API');
                })
                .catch(err => {
                    console.warn('API de arquivos não suportada:', err);
                    fallbackDownload(content, filename, mimeType);
                });
        } catch (err) {
            fallbackDownload(content, filename, mimeType);
        }
    } else {
        fallbackDownload(content, filename, mimeType);
    }
}

/**
 * Fallback para download de arquivos
 */
function fallbackDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL após o download
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Função auxiliar para obter nome do tipo de relatório
 */
function getReportTypeName(type) {
    const types = {
        'consumo': 'Consumo de Energia',
        'picos': 'Picos de Consumo',
        'reles': 'Desempenho por Relé',
        'analise_custos': 'Análise de Custos',
        'historico_recargas': 'Histórico de Recargas'
    };
    
    return types[type] || type || 'Relatório';
}

/**
 * Mostra notificação toast usando Bootstrap
 */
function showToast(message, type = 'info') {
    // Verificar se Bootstrap está disponível
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        // Criar ou reutilizar container de toasts
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                min-width: 300px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Configurar cores baseadas no tipo
        const bgColor = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const icon = type === 'success' ? 'bi-check-circle-fill' :
                    type === 'error' ? 'bi-exclamation-triangle-fill' :
                    type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle';
        
        // Criar toast único
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center">
                        <i class="bi ${icon} me-2" style="font-size: 1.2rem;"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { 
            delay: 5000,
            autohide: true,
            animation: true
        });
        
        // Remover toast após ser escondido
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
        toast.show();
    } else {
        // Fallback para alert nativo com estilos
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            min-width: 300px;
        `;
        
        // Cor baseada no tipo
        if (type === 'success') {
            alertDiv.style.background = 'linear-gradient(135deg, #28a745 0%, #218838 100%)';
        } else if (type === 'error') {
            alertDiv.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
        } else if (type === 'warning') {
            alertDiv.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
            alertDiv.style.color = '#212529';
        } else {
            alertDiv.style.background = 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)';
        }
        
        // Adicionar ícone
        const icon = type === 'success' ? '✅' :
                    type === 'error' ? '❌' :
                    type === 'warning' ? '⚠️' : 'ℹ️';
        
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">${icon}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 5000);
        
        // Adicionar animação CSS se não existir
        if (!document.querySelector('#toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
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