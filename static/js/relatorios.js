// Adicione/modifique esses estilos no início do arquivo, na seção de estilos:
const styles = {
    // ... mantém os estilos existentes ...
    
    // Adicione estilos responsivos:
    responsiveContainer: `
        max-height: 70vh;
        overflow-y: auto;
        padding-right: 5px;
    `,
    responsiveTable: `
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
        font-size: 0.85rem;
    `,
    responsiveTableCell: `
        padding: 8px 10px;
        border-bottom: 1px solid #eee;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
    `,
    responsiveTableHeader: `
        background: #1a73e8;
        color: white;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        white-space: nowrap;
    `,
    compactCard: `
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 5px rgba(0,0,0,0.1);
        margin-bottom: 12px;
        overflow: hidden;
    `,
    compactCardHeader: `
        background: #f8f9fa;
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
        font-weight: 600;
        font-size: 0.95rem;
    `,
    compactCardBody: `
        padding: 15px;
        font-size: 0.9rem;
    `,
    compactMetricCard: `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 10px;
        height: 100%;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    `,
    compactMetricValue: `
        font-size: 1.4rem;
        font-weight: bold;
        margin-bottom: 5px;
        line-height: 1.2;
    `,
    compactMetricLabel: `
        font-size: 0.8rem;
        opacity: 0.9;
        line-height: 1.2;
    `,
    compactRow: `
        display: flex;
        flex-wrap: wrap;
        margin: 0 -8px;
    `,
    compactCol: `
        flex: 1;
        padding: 0 8px;
        min-width: 120px;
        margin-bottom: 10px;
    `,
    scrollableTableContainer: `
        overflow-x: auto;
        margin: 10px 0;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    `,
};

// Modifique a função renderRelatorioConsumo para usar estilos compactos:
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
    
    // Limpar container e adicionar container responsivo
    container.innerHTML = '';
    
    const mainDiv = document.createElement('div');
    applyStyles(mainDiv, styles.container);
    applyStyles(mainDiv, styles.responsiveContainer);
    
    // Header compacto
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1a73e8;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    const title = document.createElement('h6');
    title.style.cssText = 'margin: 0; font-size: 1rem;';
    title.innerHTML = `<i class="bi bi-lightning-charge"></i> Relatório de Consumo`;
    
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 0.85rem;
    `;
    
    const periodoBadge = document.createElement('span');
    periodoBadge.style.cssText = `
        background: #e3f2fd;
        color: #1a73e8;
        padding: 4px 8px;
        border-radius: 15px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    `;
    periodoBadge.innerHTML = `<i class="bi bi-calendar"></i> ${metadata.periodo || 'N/A'}`;
    
    const pzemBadge = document.createElement('span');
    pzemBadge.style.cssText = periodoBadge.style.cssText;
    pzemBadge.innerHTML = `<i class="bi bi-cpu"></i> ${metadata.pzem || 'Todos'}`;
    
    statsDiv.appendChild(periodoBadge);
    statsDiv.appendChild(pzemBadge);
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Resumo compacto
    const resumoDiv = document.createElement('div');
    applyStyles(resumoDiv, styles.compactRow);
    
    // Métrica 1: Dias com consumo
    const col1 = document.createElement('div');
    applyStyles(col1, styles.compactCol);
    
    const metric1 = document.createElement('div');
    applyStyles(metric1, styles.compactMetricCard);
    metric1.innerHTML = `
        <div style="${styles.compactMetricValue}">${dados.length}</div>
        <div style="${styles.compactMetricLabel}">Dias</div>
    `;
    
    // Métrica 2: kWh Total
    const col2 = document.createElement('div');
    applyStyles(col2, styles.compactCol);
    
    const metric2 = document.createElement('div');
    metric2.style = styles.compactMetricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)');
    metric2.innerHTML = `
        <div style="${styles.compactMetricValue}">${energiaTotal.toFixed(1)}</div>
        <div style="${styles.compactMetricLabel}">kWh Total</div>
    `;
    
    // Métrica 3: MZN Total
    const col3 = document.createElement('div');
    applyStyles(col3, styles.compactCol);
    
    const metric3 = document.createElement('div');
    metric3.style = styles.compactMetricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)');
    metric3.innerHTML = `
        <div style="${styles.compactMetricValue}">${custoTotal.toFixed(0)}</div>
        <div style="${styles.compactMetricLabel}">MZN Total</div>
    `;
    
    // Métrica 4: Média/kWh
    const col4 = document.createElement('div');
    applyStyles(col4, styles.compactCol);
    
    const metric4 = document.createElement('div');
    metric4.style = styles.compactMetricCard.replace('gradient(135deg, #667eea 0%, #764ba2 100%)', 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)');
    const custoMedio = energiaTotal > 0 ? (custoTotal / energiaTotal).toFixed(3) : '0.000';
    metric4.innerHTML = `
        <div style="${styles.compactMetricValue}">${custoMedio}</div>
        <div style="${styles.compactMetricLabel}">MZN/kWh</div>
    `;
    
    col1.appendChild(metric1);
    col2.appendChild(metric2);
    col3.appendChild(metric3);
    col4.appendChild(metric4);
    
    resumoDiv.appendChild(col1);
    resumoDiv.appendChild(col2);
    resumoDiv.appendChild(col3);
    resumoDiv.appendChild(col4);
    mainDiv.appendChild(resumoDiv);
    
    // Container para tabela com scroll horizontal
    const tableContainer = document.createElement('div');
    applyStyles(tableContainer, styles.scrollableTableContainer);
    
    // Tabela responsiva
    const table = document.createElement('table');
    applyStyles(table, styles.responsiveTable);
    
    // Cabeçalho da tabela
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'Energia (kWh)', 'Custo (MZN)', 'Média/kWh'];
    headers.forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.responsiveTableHeader);
        th.innerHTML = `<i class="bi bi-${getIconForHeader(text)}"></i> ${text}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo da tabela
    const tbody = document.createElement('tbody');
    
    // Mostrar apenas os primeiros 15 registros para não sobrecarregar
    const dadosExibidos = dados.length > 15 ? dados.slice(0, 15) : dados;
    
    dadosExibidos.forEach(item => {
        const custoUnitario = item.energia > 0 ? (item.custo / item.energia).toFixed(3) : '0.000';
        
        const row = document.createElement('tr');
        row.style.cssText = `
            &:hover {
                background: #f5f7fa;
            }
        `;
        
        // Célula de data
        const td1 = document.createElement('td');
        applyStyles(td1, styles.responsiveTableCell);
        td1.textContent = item.data || 'N/A';
        td1.style.minWidth = '100px';
        
        // Célula de energia
        const td2 = document.createElement('td');
        applyStyles(td2, styles.responsiveTableCell);
        td2.textContent = item.energia ? item.energia.toFixed(3) : '0.000';
        
        // Célula de custo
        const td3 = document.createElement('td');
        applyStyles(td3, styles.responsiveTableCell);
        td3.textContent = item.custo ? item.custo.toFixed(2) : '0.00';
        
        // Célula de média
        const td4 = document.createElement('td');
        applyStyles(td4, styles.responsiveTableCell);
        td4.textContent = custoUnitario;
        
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
    applyStyles(footerTd1, styles.responsiveTableCell);
    footerTd1.innerHTML = '<strong>TOTAL</strong>';
    
    const footerTd2 = document.createElement('td');
    applyStyles(footerTd2, styles.responsiveTableCell);
    footerTd2.innerHTML = `<strong>${energiaTotal.toFixed(3)}</strong>`;
    
    const footerTd3 = document.createElement('td');
    applyStyles(footerTd3, styles.responsiveTableCell);
    footerTd3.innerHTML = `<strong>${custoTotal.toFixed(2)}</strong>`;
    
    const footerTd4 = document.createElement('td');
    applyStyles(footerTd4, styles.responsiveTableCell);
    footerTd4.innerHTML = `<strong>${(custoTotal / Math.max(energiaTotal, 1)).toFixed(3)}</strong>`;
    
    footerRow.appendChild(footerTd1);
    footerRow.appendChild(footerTd2);
    footerRow.appendChild(footerTd3);
    footerRow.appendChild(footerTd4);
    tfoot.appendChild(footerRow);
    table.appendChild(tfoot);
    
    tableContainer.appendChild(table);
    mainDiv.appendChild(tableContainer);
    
    // Informação adicional compacta
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    infoDiv.innerHTML = `
        <div>
            <i class="bi bi-info-circle"></i> Preço kWh: ${metadata.preco_kwh || 'N/A'} MZN
        </div>
        <div>
            <i class="bi bi-list-ul"></i> Mostrando ${dadosExibidos.length} de ${dados.length} registros
        </div>
    `;
    
    // Botão para ver todos os registros (se houver mais de 15)
    if (dados.length > 15) {
        const verTodosBtn = document.createElement('button');
        verTodosBtn.style.cssText = `
            padding: 4px 12px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        `;
        verTodosBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i> Ver Todos';
        verTodosBtn.onclick = function() {
            // Aqui você pode implementar uma modal ou paginação
            alert(`Total de registros: ${dados.length}\nUse a exportação para ver todos os dados.`);
        };
        infoDiv.appendChild(verTodosBtn);
    }
    
    mainDiv.appendChild(infoDiv);
    container.appendChild(mainDiv);
}

// Modifique também a função renderRelatorioReles para ser mais compacta:
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
    applyStyles(mainDiv, styles.responsiveContainer);
    
    // Header compacto
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #6610f2;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    const title = document.createElement('h6');
    title.style.cssText = 'margin: 0; font-size: 1rem;';
    title.innerHTML = `<i class="bi bi-toggle-on"></i> Desempenho por Relé`;
    
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 0.85rem;
    `;
    
    const periodoBadge = document.createElement('span');
    periodoBadge.style.cssText = `
        background: #e3f2fd;
        color: #1a73e8;
        padding: 4px 8px;
        border-radius: 15px;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    `;
    periodoBadge.innerHTML = `<i class="bi bi-calendar"></i> ${metadata.periodo || 'N/A'}`;
    
    const totalRelesBadge = document.createElement('span');
    totalRelesBadge.style.cssText = periodoBadge.style.cssText;
    totalRelesBadge.innerHTML = `<i class="bi bi-plug"></i> ${dados.length} Relés`;
    
    statsDiv.appendChild(periodoBadge);
    statsDiv.appendChild(totalRelesBadge);
    headerDiv.appendChild(title);
    headerDiv.appendChild(statsDiv);
    mainDiv.appendChild(headerDiv);
    
    // Lista de relés compacta
    dados.forEach((rele, index) => {
        const estadoCor = rele.estado === 1 ? 'success' : 'secondary';
        const estadoTexto = rele.estado === 1 ? 'LIGADO' : 'DESLIGADO';
        const estadoIcone = rele.estado === 1 ? 'bi-toggle-on' : 'bi-toggle-off';
        
        const card = document.createElement('div');
        applyStyles(card, styles.compactCard);
        
        // Cabeçalho do card
        const cardHeader = document.createElement('div');
        applyStyles(cardHeader, styles.compactCardHeader);
        
        const headerContent = document.createElement('div');
        headerContent.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            flex-wrap: wrap;
            gap: 8px;
        `;
        
        const leftSection = document.createElement('div');
        leftSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        `;
        
        const estadoBadge = document.createElement('span');
        estadoBadge.style.cssText = `
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            ${estadoCor === 'success' ? styles.badgeSuccess : 'background: #6c757d; color: white;'}
        `;
        estadoBadge.innerHTML = `<i class="bi ${estadoIcone}"></i> ${estadoTexto}`;
        
        const nome = document.createElement('span');
        nome.textContent = rele.nome;
        nome.style.cssText = 'font-weight: 600; font-size: 0.9rem;';
        
        leftSection.appendChild(estadoBadge);
        leftSection.appendChild(nome);
        
        const rightSection = document.createElement('div');
        const ciclosBadge = document.createElement('span');
        ciclosBadge.style.cssText = `
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #17a2b8;
            color: white;
        `;
        ciclosBadge.innerHTML = `<i class="bi bi-arrow-repeat"></i> ${rele.ciclos || 0}`;
        
        rightSection.appendChild(ciclosBadge);
        
        headerContent.appendChild(leftSection);
        headerContent.appendChild(rightSection);
        cardHeader.appendChild(headerContent);
        card.appendChild(cardHeader);
        
        // Corpo do card
        const cardBody = document.createElement('div');
        applyStyles(cardBody, styles.compactCardBody);
        
        // Barra de progresso compacta
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            margin-bottom: 10px;
        `;
        
        const progressInfo = document.createElement('div');
        progressInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 0.8rem;
        `;
        progressInfo.innerHTML = `
            <span>Utilização: ${rele.percent_ligado || 0}%</span>
            <span>${rele.total_ligado || '0h'}</span>
        `;
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            height: 10px;
            background: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            border-radius: 5px;
            width: ${rele.percent_ligado || 0}%;
            background: ${rele.percent_ligado > 70 ? '#28a745' : rele.percent_ligado > 40 ? '#ffc107' : '#6c757d'};
        `;
        
        progressBar.appendChild(progressFill);
        
        progressContainer.appendChild(progressInfo);
        progressContainer.appendChild(progressBar);
        cardBody.appendChild(progressContainer);
        
        // Info adicional em linha
        const infoRow = document.createElement('div');
        infoRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #6c757d;
            margin-top: 8px;
        `;
        infoRow.innerHTML = `
            <span><i class="bi bi-cpu"></i> PZEM ${rele.pzem_id}</span>
            <span><i class="bi bi-power"></i> ${rele.percent_desligado || 0}% desligado</span>
        `;
        
        cardBody.appendChild(infoRow);
        card.appendChild(cardBody);
        mainDiv.appendChild(card);
    });
    
    container.appendChild(mainDiv);
}

// Modifique também a função renderRelatorioCusto para ser mais compacta:
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
    applyStyles(mainDiv, styles.responsiveContainer);
    
    // Header muito compacto
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 2px solid #1a73e8;
    `;
    
    const title = document.createElement('h6');
    title.style.cssText = 'margin: 0 0 10px 0; font-size: 1rem;';
    title.innerHTML = `<i class="bi bi-calculator"></i> Análise de Custos`;
    
    const periodoBadge = document.createElement('div');
    periodoBadge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #e3f2fd;
        color: #1a73e8;
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.8rem;
    `;
    periodoBadge.innerHTML = `<i class="bi bi-calendar"></i> ${metadata.periodo || 'N/A'}`;
    
    headerDiv.appendChild(title);
    headerDiv.appendChild(periodoBadge);
    mainDiv.appendChild(headerDiv);
    
    // Métricas principais em grid compacto
    const metricsGrid = document.createElement('div');
    metricsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
        margin-bottom: 20px;
    `;
    
    // Score de eficiência
    const score = metricas.score_eficiencia || 0;
    const scoreCard = document.createElement('div');
    scoreCard.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 2px solid ${score >= 80 ? '#28a745' : score >= 60 ? '#17a2b8' : score >= 40 ? '#ffc107' : '#dc3545'};
    `;
    
    scoreCard.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold; color: ${score >= 80 ? '#28a745' : score >= 60 ? '#17a2b8' : score >= 40 ? '#ffc107' : '#dc3545'}; margin-bottom: 5px;">
            ${score}/100
        </div>
        <div style="font-size: 0.75rem; color: #666;">
            <i class="bi bi-award"></i> Score
        </div>
    `;
    
    // Saldo líquido
    const saldoLiquido = metadata.saldo_liquido || 0;
    const saldoCard = document.createElement('div');
    saldoCard.style.cssText = `
        background: ${saldoLiquido >= 0 ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'};
        color: white;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    saldoCard.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
            ${saldoLiquido >= 0 ? '+' : ''}${saldoLiquido.toFixed(0)}
        </div>
        <div style="font-size: 0.75rem; opacity: 0.9;">
            <i class="bi ${saldoLiquido >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'}"></i> Saldo (MZN)
        </div>
    `;
    
    // Dias restantes
    const diasCard = document.createElement('div');
    diasCard.style.cssText = `
        background: linear-gradient(135deg, #6f42c1 0%, #5a3796 100%);
        color: white;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    diasCard.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
            ${metricas.dias_restantes ? metricas.dias_restantes.toFixed(0) : '0'}
        </div>
        <div style="font-size: 0.75rem; opacity: 0.9;">
            <i class="bi bi-clock-history"></i> Dias Restantes
        </div>
    `;
    
    // Custo médio
    const custoCard = document.createElement('div');
    custoCard.style.cssText = `
        background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        color: #212529;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    custoCard.innerHTML = `
        <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">
            ${metricas.custo_medio_diario ? metricas.custo_medio_diario.toFixed(0) : '0'}
        </div>
        <div style="font-size: 0.75rem; opacity: 0.9;">
            <i class="bi bi-calendar-day"></i> Média/Dia (MZN)
        </div>
    `;
    
    metricsGrid.appendChild(scoreCard);
    metricsGrid.appendChild(saldoCard);
    metricsGrid.appendChild(diasCard);
    metricsGrid.appendChild(custoCard);
    mainDiv.appendChild(metricsGrid);
    
    // Dados resumidos em tabela compacta
    const tableContainer = document.createElement('div');
    applyStyles(tableContainer, styles.scrollableTableContainer);
    
    const table = document.createElement('table');
    applyStyles(table, styles.responsiveTable);
    
    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'kWh', 'Custo (MZN)', 'MZN/kWh'];
    headers.forEach(text => {
        const th = document.createElement('th');
        applyStyles(th, styles.responsiveTableHeader);
        th.innerHTML = `<i class="bi bi-${getIconForHeader(text)}"></i> ${text}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Corpo - mostrar apenas dados normais e limitar a 10 registros
    const dadosNormais = dados.filter(d => !d.tipo || d.tipo === 'normal').slice(0, 10);
    const tbody = document.createElement('tbody');
    
    dadosNormais.forEach(item => {
        const custoUnitario = item.energia > 0 ? (item.custo_dia / item.energia).toFixed(3) : '0.000';
        
        const row = document.createElement('tr');
        
        const td1 = document.createElement('td');
        applyStyles(td1, styles.responsiveTableCell);
        td1.textContent = item.data || 'N/A';
        
        const td2 = document.createElement('td');
        applyStyles(td2, styles.responsiveTableCell);
        td2.textContent = item.energia ? parseFloat(item.energia).toFixed(1) : '0.0';
        
        const td3 = document.createElement('td');
        applyStyles(td3, styles.responsiveTableCell);
        td3.textContent = item.custo_dia ? parseFloat(item.custo_dia).toFixed(0) : '0';
        
        const td4 = document.createElement('td');
        applyStyles(td4, styles.responsiveTableCell);
        td4.textContent = custoUnitario;
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    mainDiv.appendChild(tableContainer);
    
    // Informação resumida
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 15px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        text-align: center;
    `;
    
    const totalRegistros = dados.filter(d => !d.tipo || d.tipo === 'normal').length;
    infoDiv.innerHTML = `
        <i class="bi bi-info-circle"></i> 
        Mostrando ${Math.min(10, totalRegistros)} de ${totalRegistros} dias. 
        ${totalRegistros > 10 ? 'Use a exportação para ver todos os dados.' : ''}
    `;
    
    mainDiv.appendChild(infoDiv);
    container.appendChild(mainDiv);
}

// Adicione esta função para criar um estado vazio mais compacto:
function createEmptyState(message) {
    return `
        <div style="
            text-align: center; 
            padding: 20px 15px; 
            color: #6c757d;
            font-size: 0.9rem;
        ">
            <i class="bi bi-database-slash" style="
                font-size: 2rem; 
                margin-bottom: 10px; 
                opacity: 0.5;
                display: block;
            "></i>
            <h6 style="margin: 10px 0 5px 0; font-size: 0.95rem;">${message}</h6>
            <p style="color: #6c757d; font-size: 0.8rem;">Tente ajustar os filtros ou selecionar outro período.</p>
        </div>
    `;
}

// Modifique a função applyStyles para adicionar suporte a media queries inline:
function applyStyles(element, styleString) {
    const styleObj = {};
    const rules = styleString.split(';').filter(rule => rule.trim());
    
    rules.forEach(rule => {
        const [property, value] = rule.split(':').map(s => s.trim());
        if (property && value) {
            // Converter propriedades CSS de kebab-case para camelCase
            const camelCaseProp = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            styleObj[camelCaseProp] = value;
        }
    });
    
    Object.assign(element.style, styleObj);
}