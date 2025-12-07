// gráfico_diario.js

/**
 * MÓDULO DE GRÁFICO DIÁRIO DE POTÊNCIA
 * Exibe gráfico de potência diária com tooltip completo
 */

// ============================================
// CONFIGURAÇÕES E ESTADO
// ============================================

const GraficoPotenciaDiaria = {
    // Estado do módulo
    state: {
        chart: null,
        dadosCompletos: null,
        periodoAtual: 'week',
        isLoading: false
    },
    
    // Configurações
    config: {
        apiEndpoint: '/api/grafico-diario',
        chartColors: {
            primary: '#1a73e8',
            primaryLight: 'rgba(26, 115, 232, 0.1)',
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        }
    },
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    
    /**
     * Inicializa o módulo do gráfico
     */
    init: function() {
        console.log('🚀 Inicializando módulo de gráfico diário...');
        
        // Verificar se o canvas existe
        const canvas = document.getElementById('energyChart');
        if (!canvas) {
            console.error('❌ Canvas #energyChart não encontrado');
            return false;
        }
        
        // Inicializar gráfico
        this._inicializarChart();
        
        // Configurar controles
        this._configurarControles();
        
        // Carregar dados iniciais
        this.carregarDados('week');
        
        // Configurar event listeners
        this._configurarEventListeners();
        
        console.log('✅ Módulo de gráfico diário inicializado');
        return true;
    },
    
    // ============================================
    // INICIALIZAÇÃO DO CHART.JS
    // ============================================
    
    /**
     * Inicializa o gráfico Chart.js
     */
    _inicializarChart: function() {
        const ctx = document.getElementById('energyChart').getContext('2d');
        
        this.state.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Potência (W)',
                    data: [],
                    borderColor: this.config.chartColors.primary,
                    backgroundColor: this.config.chartColors.primaryLight,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.config.chartColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.config.chartColors.primary,
                    pointHoverBorderWidth: 3
                }]
            },
            options: this._getChartOptions()
        });
    },
    
    /**
     * Retorna as opções de configuração do gráfico
     */
    _getChartOptions: function() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#2c3e50',
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: this.config.chartColors.primary,
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => `📅 ${tooltipItems[0].label}`,
                        label: (context) => this._getTooltipContent(context)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Potência (W)',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#2c3e50'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#666',
                        padding: 10,
                        callback: (value) => `${value} W`
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        color: '#666',
                        maxRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Data',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#2c3e50'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        };
    },
    
    /**
     * Retorna o conteúdo do tooltip
     */
    _getTooltipContent: function(context) {
        if (!this.state.dadosCompletos) {
            return [`Potência: ${context.parsed.y} W`];
        }
        
        const index = context.dataIndex;
        const dados = this.state.dadosCompletos;
        
        return [
            `⚡ Potência: ${dados.potencia[index]?.toFixed(2) || 0} W`,
            `🔌 Tensão: ${dados.tensao[index]?.toFixed(2) || 0} V`,
            `🔋 Corrente: ${dados.corrente[index]?.toFixed(2) || 0} A`,
            `💡 Energia: ${dados.energia[index]?.toFixed(2) || 0} kWh`
        ];
    },
    
    // ============================================
    // CONTROLES E EVENTOS
    // ============================================
    
    /**
     * Configura os controles de período
     */
    _configurarControles: function() {
        const botoes = document.querySelectorAll('.btn-periodo');
        
        botoes.forEach(botao => {
            botao.addEventListener('click', (e) => this._handlePeriodoClick(e));
        });
    },
    
    /**
     * Manipula clique nos botões de período
     */
    _handlePeriodoClick: function(event) {
        const botao = event.currentTarget;
        const periodo = botao.dataset.period;
        
        // Atualizar estado ativo
        document.querySelectorAll('.btn-periodo').forEach(b => {
            b.classList.remove('active');
        });
        botao.classList.add('active');
        
        // Carregar dados
        if (periodo === 'custom') {
            this._abrirModalPersonalizado();
        } else {
            this.carregarDados(periodo);
        }
    },
    
    /**
     * Abre modal para período personalizado
     */
    _abrirModalPersonalizado: function() {
        // Usar SweetAlert2 se disponível, senão usar prompt nativo
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Período Personalizado',
                html: `
                    <div class="mb-3">
                        <label for="start-date" class="form-label">Data Inicial</label>
                        <input type="date" id="start-date" class="form-control" 
                               value="${this._formatarDataParaInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}">
                    </div>
                    <div class="mb-3">
                        <label for="end-date" class="form-label">Data Final</label>
                        <input type="date" id="end-date" class="form-control" 
                               value="${this._formatarDataParaInput(new Date())}">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Carregar',
                cancelButtonText: 'Cancelar',
                focusConfirm: false,
                preConfirm: () => {
                    const start = document.getElementById('start-date').value;
                    const end = document.getElementById('end-date').value;
                    
                    if (!start || !end) {
                        Swal.showValidationMessage('Preencha ambas as datas');
                        return false;
                    }
                    
                    if (new Date(start) > new Date(end)) {
                        Swal.showValidationMessage('Data inicial não pode ser maior que final');
                        return false;
                    }
                    
                    return { start, end };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    this.carregarDados(`custom?start=${result.value.start}&end=${result.value.end}`);
                }
            });
        } else {
            // Fallback para prompt nativo
            const start = prompt('Data inicial (YYYY-MM-DD):', 
                this._formatarDataParaInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
            const end = prompt('Data final (YYYY-MM-DD):', 
                this._formatarDataParaInput(new Date()));
            
            if (start && end) {
                this.carregarDados(`custom?start=${start}&end=${end}`);
            }
        }
    },
    
    /**
     * Configura event listeners
     */
    _configurarEventListeners: function() {
        // Recarregar quando a aba for mostrada
        const monitoramentoTab = document.getElementById('monitoramento-tab');
        if (monitoramentoTab) {
            monitoramentoTab.addEventListener('shown.bs.tab', () => {
                if (!this.state.chart.data.labels.length) {
                    this.carregarDados(this.state.periodoAtual);
                }
            });
        }
        
        // Recarregar ao redimensionar janela
        window.addEventListener('resize', () => {
            if (this.state.chart) {
                setTimeout(() => this.state.chart.resize(), 100);
            }
        });
    },
    
    // ============================================
    // CARREGAMENTO DE DADOS
    // ============================================
    
    /**
     * Carrega dados da API
     */
    carregarDados: async function(periodo = 'week') {
        try {
            this.state.isLoading = true;
            this.state.periodoAtual = periodo;
            
            this._showLoading(true);
            console.log(`📊 Carregando dados para período: ${periodo}`);
            
            // Construir URL
            const url = `${this.config.apiEndpoint}?period=${periodo}`;
            
            // Fazer requisição
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this._processarDados(data);
                this._showToast('Dados atualizados com sucesso!', 'success');
            } else {
                throw new Error(data.message || 'Dados inválidos');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this._showToast(`Erro: ${error.message}. Usando dados de demonstração.`, 'warning');
            this._usarDadosDemonstracao();
        } finally {
            this.state.isLoading = false;
            this._showLoading(false);
        }
    },
    
    /**
     * Processa os dados recebidos da API
     */
    _processarDados: function(data) {
        // Salvar dados completos
        this.state.dadosCompletos = {
            datas: data.datas,
            potencia: data.potencia,
            tensao: data.tensao,
            corrente: data.corrente,
            energia: data.energia
        };
        
        // Atualizar gráfico
        this._atualizarChart(data);
        
        // Atualizar estatísticas
        this._atualizarEstatisticas(data);
        
        console.log(`✅ Gráfico atualizado com ${data.datas?.length || 0} pontos`);
    },
    
    /**
     * Atualiza o gráfico com novos dados
     */
    _atualizarChart: function(data) {
        if (!this.state.chart) return;
        
        this.state.chart.data.labels = data.datas || [];
        this.state.chart.data.datasets[0].data = data.potencia || [];
        
        // Atualizar label com média
        if (data.potencia && data.potencia.length > 0) {
            const media = this._calcularMedia(data.potencia);
            this.state.chart.data.datasets[0].label = `Potência (Média: ${media.toFixed(1)} W)`;
        }
        
        this.state.chart.update('none');
    },
    
    /**
     * Atualiza as estatísticas abaixo do gráfico
     */
    _atualizarEstatisticas: function(data) {
        const container = document.getElementById('info-grafico');
        if (!container || !data.potencia) return;
        
        const potencia = data.potencia;
        const energia = data.energia || [];
        
        const media = this._calcularMedia(potencia);
        const max = Math.max(...potencia);
        const min = Math.min(...potencia);
        const totalEnergia = energia.length > 0 ? energia[energia.length - 1] : 0;
        
        const html = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">📊 Estatísticas do Período</h6>
                    <div class="row">
                        <div class="col-md-3 col-6">
                            <div class="text-center p-2">
                                <div class="text-primary fw-bold">${data.total_dias || data.datas?.length || 0}</div>
                                <small class="text-muted">Dias</small>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-2">
                                <div class="text-success fw-bold">${media.toFixed(1)} W</div>
                                <small class="text-muted">Média</small>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-2">
                                <div class="text-danger fw-bold">${max.toFixed(1)} W</div>
                                <small class="text-muted">Máxima</small>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="text-center p-2">
                                <div class="text-warning fw-bold">${totalEnergia.toFixed(1)} kWh</div>
                                <small class="text-muted">Energia</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    // ============================================
    // DADOS DE DEMONSTRAÇÃO (FALLBACK)
    // ============================================
    
    /**
     * Gera dados de demonstração
     */
    _usarDadosDemonstracao: function() {
        console.log('🔄 Usando dados de demonstração');
        
        const datas = [];
        const potencia = [];
        const tensao = [];
        const corrente = [];
        const energia = [];
        
        const hoje = new Date();
        let energiaAcumulada = 10;
        
        // Gerar 7 dias de dados
        for (let i = 6; i >= 0; i--) {
            const data = new Date();
            data.setDate(hoje.getDate() - i);
            
            // Formatar data
            datas.push(this._formatarDataParaGrafico(data));
            
            // Gerar valores realistas
            const pwr = Math.random() * 2000 + 800;
            potencia.push(Math.round(pwr));
            tensao.push(+(Math.random() * 10 + 215).toFixed(1));
            corrente.push(+(Math.random() * 5 + 3).toFixed(2));
            
            // Energia acumulada
            energiaAcumulada += pwr * 24 / 1000;
            energia.push(+(energiaAcumulada).toFixed(1));
        }
        
        const mockData = {
            success: true,
            datas: datas,
            potencia: potencia,
            tensao: tensao,
            corrente: corrente,
            energia: energia,
            total_dias: datas.length,
            periodo_inicio: hoje.toISOString().split('T')[0],
            periodo_fim: hoje.toISOString().split('T')[0],
            message: 'Dados de demonstração'
        };
        
        this._processarDados(mockData);
    },
    
    // ============================================
    // UTILITÁRIOS
    // ============================================
    
    /**
     * Formata data para exibição no gráfico
     */
    _formatarDataParaGrafico: function(data) {
        return data.toLocaleDateString('pt-BR', { 
            day: 'numeric', 
            month: 'short' 
        });
    },
    
    /**
     * Formata data para input type="date"
     */
    _formatarDataParaInput: function(data) {
        return data.toISOString().split('T')[0];
    },
    
    /**
     * Calcula média de array
     */
    _calcularMedia: function(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    /**
     * Calcula soma de array
     */
    _calcularSoma: function(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0);
    },
    
    /**
     * Mostra/oculta loading
     */
    _showLoading: function(show) {
        let overlay = document.getElementById('grafico-loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'grafico-loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <p>Carregando dados...</p>
            `;
            document.querySelector('.chart-container').appendChild(overlay);
        }
        
        overlay.classList.toggle('active', show);
    },
    
    /**
     * Mostra toast de notificação
     */
    _showToast: function(message, type = 'info') {
        // Usar sistema de toast existente se disponível
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }
        
        // Fallback simples
        const container = document.getElementById('toast-container') || 
                         document.querySelector('.toast-container');
        
        if (!container) return;
        
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast show" role="alert">
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', toastHTML);
        
        // Remover após 5 segundos
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) toast.remove();
        }, 5000);
    },
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    /**
     * Recarrega dados com período atual
     */
    recarregar: function() {
        this.carregarDados(this.state.periodoAtual);
    },
    
    /**
     * Altera período programaticamente
     */
    setPeriodo: function(periodo) {
        // Atualizar botão ativo
        document.querySelectorAll('.btn-periodo').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === periodo);
        });
        
        // Carregar dados
        this.carregarDados(periodo);
    },
    
    /**
     * Exporta dados atuais como CSV
     */
    exportarCSV: function() {
        if (!this.state.dadosCompletos) {
            this._showToast('Nenhum dado disponível para exportar', 'warning');
            return;
        }
        
        const dados = this.state.dadosCompletos;
        let csv = 'Data,Potencia(W),Tensao(V),Corrente(A),Energia(kWh)\n';
        
        for (let i = 0; i < dados.datas.length; i++) {
            csv += `${dados.datas[i]},${dados.potencia[i]},${dados.tensao[i]},${dados.corrente[i]},${dados.energia[i]}\n`;
        }
        
        // Criar link de download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grafico_potencia_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this._showToast('Dados exportados com sucesso!', 'success');
    },
    
    /**
     * Retorna dados atuais (para debug)
     */
    getDados: function() {
        return this.state.dadosCompletos;
    },
    
    /**
     * Retorna estado atual
     */
    getEstado: function() {
        return this.state;
    }
};

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Aguardar um pouco para garantir que tudo está carregado
        setTimeout(() => GraficoPotenciaDiaria.init(), 100);
    });
} else {
    // DOM já está pronto
    setTimeout(() => GraficoPotenciaDiaria.init(), 100);
}

// Expor módulo globalmente para debug
window.GraficoPotenciaDiaria = GraficoPotenciaDiaria;

console.log('📈 Módulo de gráfico diário carregado');