// grafico_diario.js

/**
 * MÓDULO DE GRÁFICO DIÁRIO DE POTÊNCIA - diasChart
 */

const GraficoDias = {
    // Estado do módulo
    state: {
        chart: null,          // Agora será diasChart
        dadosCompletos: null,
        periodoAtual: 'week',
        isLoading: false
    },
    
    // Configurações
    config: {
        apiEndpoint: '/api/grafico-diario',
        chartId: 'diasChart',  // ID do canvas
        chartColors: {
            primary: '#1a73e8',
            primaryLight: 'rgba(26, 115, 232, 0.1)',
            success: '#28a745',
            danger: '#dc3545',
            warning: '#ffc107'
        }
    },
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    
    /**
     * Inicializa o módulo do gráfico
     */
    init: function() {
        console.log('🚀 Inicializando gráfico diasChart...');
        
        // Verificar se o canvas existe
        const canvas = document.getElementById(this.config.chartId);
        if (!canvas) {
            console.error(`❌ Canvas #${this.config.chartId} não encontrado`);
            return false;
        }
        
         this._setupTooltipCleanup(); 
        // Inicializar gráfico
        this._inicializarChart();
        
        // Configurar controles
        this._configurarControles();
        
        // Carregar dados iniciais
        this.carregarDados('week');
        
        console.log('✅ Gráfico diasChart inicializado');
        return true;
    },
    
    // ============================================
    // INICIALIZAÇÃO DO CHART.JS
    // ============================================
    
    /**
     * Inicializa o gráfico Chart.js
     */
    _inicializarChart: function() {
        const ctx = document.getElementById(this.config.chartId).getContext('2d');
        
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
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: this.config.chartColors.primary,
                borderWidth: 2,
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                // CONFIGURAÇÕES CRÍTICAS PARA DESAPARECIMENTO:
                animation: {
                    duration: 150  // Animação mais rápida
                },
                // Configurar transições suaves
                transition: {
                    duration: 150
                },
                // REMOVER O EXTERNAL - ele interfere no comportamento padrão
                // external: (context) => {
                //     if (context.tooltip.opacity === 0) {
                //         const tooltipEl = document.getElementById('chartjs-tooltip');
                //         if (tooltipEl) {
                //             tooltipEl.style.opacity = 0;
                //         }
                //     }
                // },
                callbacks: {
                    title: (tooltipItems) => `📅 ${tooltipItems[0].label}`,
                    label: (context) => this._getTooltipContent(context),
                    // Adicionar callback para após o tooltip ser escondido
                    afterBody: () => {
                        // Esta função é chamada após o tooltip ser renderizado
                        // Não faz nada, apenas garante que o callback existe
                    }
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
            mode: 'nearest',
            // CONFIGURAÇÃO IMPORTANTE:
            axis: 'x'  // Só interage no eixo X
        },
        // Configurações de hover
        hover: {
            mode: 'index',
            intersect: false,
            animationDuration: 0  // Sem animação no hover
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    };
},

_getTooltipContent: function(context) {
    if (!this.state.dadosCompletos) {
        return [`Potência: ${context.parsed.y.toFixed(2)} W`];
    }
    
    const index = context.dataIndex;
    const dados = this.state.dadosCompletos;
    
    // IMPORTANTE: Sempre retornar array mesmo com um item
    return [
        `⚡ Potência: ${dados.potencia[index]?.toFixed(2) || 0} W`,
        `🔌 Tensão: ${dados.tensao[index]?.toFixed(2) || 0} V`,
        `🔋 Corrente: ${dados.corrente[index]?.toFixed(2) || 0} A`,
        `💡 Energia: ${dados.energia[index]?.toFixed(2) || 0} kWh`
    ];
},
// Adicione esta função ao seu objeto GraficoDiario
_cleanupTooltips: function() {
    // Esta função força a limpeza de todos os tooltips
    const tooltips = document.querySelectorAll('.chartjs-tooltip');
    tooltips.forEach(tooltip => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.pointerEvents = 'none';
    });
},

// E chame esta função quando o mouse sair do gráfico
_setupTooltipCleanup: function() {
    const canvas = document.getElementById(this.config.chartId);
    if (!canvas) return;
    
    // Quando o mouse sair do canvas, limpe os tooltips
    canvas.addEventListener('mouseleave', () => {
        this._cleanupTooltips();
    });
    
    // Quando o mouse sair do container do gráfico
    const container = canvas.closest('.dias-chart-container');
    if (container) {
        container.addEventListener('mouseleave', () => {
            this._cleanupTooltips();
        });
    }
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
        // Para simplificar, vamos usar prompt
        const hoje = new Date();
        const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const start = prompt('Data inicial (YYYY-MM-DD):', 
            umaSemanaAtras.toISOString().split('T')[0]);
        const end = prompt('Data final (YYYY-MM-DD):', 
            hoje.toISOString().split('T')[0]);
        
        if (start && end) {
            this.carregarDados(`custom?start=${start}&end=${end}`);
        }
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
            
            // URL da API
            const url = `${this.config.apiEndpoint}?period=${periodo}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this._processarDados(data);
            } else {
                throw new Error(data.message || 'Dados inválidos');
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this._usarDadosDemonstracao();
        } finally {
            this._showLoading(false);
            this.state.isLoading = false;
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
        console.log('Usando dados de demonstração para diasChart');
        
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
            datas.push(data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }));
            
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
            periodo_fim: hoje.toISOString().split('T')[0]
        };
        
        this._processarDados(mockData);
    },
    
    // ============================================
    // UTILITÁRIOS
    // ============================================
    
    /**
     * Calcula média de array
     */
    _calcularMedia: function(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    },
    
    /**
     * Mostra/oculta loading
     */
    _showLoading: function(show) {
        const container = document.querySelector('.chart-container');
        if (!container) return;
        
        let overlay = container.querySelector('.loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            `;
            container.style.position = 'relative';
            container.appendChild(overlay);
        }
        
        overlay.style.display = show ? 'flex' : 'none';
    },
    
    /**
     * Mostra toast de notificação
     */
    _showToast: function(message, type = 'info') {
        // Use o sistema de toast do seu dashboard
        if (typeof showToast === 'function') {
            showToast(message, type);
        }
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
        if (!this.state.dadosCompletos) return;
        
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
        a.download = `dias_chart_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },
    
    /**
     * Retorna dados atuais
     */
    getDados: function() {
        return this.state.dadosCompletos;
    }
};

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar imediatamente se o canvas existir
    if (document.getElementById('diasChart')) {
        setTimeout(() => GraficoDias.init(), 100);
    }
});

// Expor módulo globalmente
window.GraficoDias = GraficoDias;

console.log('📈 Módulo diasChart carregado');