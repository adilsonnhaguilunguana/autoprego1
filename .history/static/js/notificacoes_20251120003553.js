// ==========================================================
// SISTEMA DE CONFIGURAÇÃO DE NOTIFICAÇÕES
// ==========================================================

class SistemaNotificacoes {
    constructor() {
        this.config = {};
        this.init();
    }

    init() {
        this.carregarEventos();
        this.carregarConfiguracoes();
    }

    carregarEventos() {
        // Esperar o DOM carregar completamente
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.configurarEventos());
        } else {
            this.configurarEventos();
        }
    }

    configurarEventos() {
        const notificationForm = document.getElementById('notification-config-form');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => this.salvarConfiguracoes(e));
        }

        // Eventos para mostrar/ocultar seções
        this.configurarToggleNotificacoes();
        
        // Botões de teste
        this.configurarBotoesTeste();
        
        // Carregar quando a aba for clicada
        this.configurarAbaConfiguracoes();
    }

    configurarToggleNotificacoes() {
        const emailToggle = document.getElementById('notify-email');
        const telegramToggle = document.getElementById('notify-telegram');

        if (emailToggle) {
            emailToggle.addEventListener('change', () => {
                const emailSettings = document.getElementById('email-settings');
                if (emailSettings) {
                    emailSettings.style.display = emailToggle.checked ? 'block' : 'none';
                }
            });
        }

        if (telegramToggle) {
            telegramToggle.addEventListener('change', () => {
                const telegramSettings = document.getElementById('telegram-settings');
                if (telegramSettings) {
                    telegramSettings.style.display = telegramToggle.checked ? 'block' : 'none';
                }
            });
        }
    }
configurarBotoesTeste() {
    const testEmail = document.getElementById('test-email');
    const testTelegram = document.getElementById('test-telegram');
    const testBrowser = document.getElementById('test-browser');

    if (testEmail) testEmail.addEventListener('click', () => this.testarNotificacao('email'));
    if (testTelegram) testTelegram.addEventListener('click', () => this.testarNotificacao('telegram'));
    if (testBrowser) testBrowser.addEventListener('click', () => this.testarNotificacaoBrowser());
}

    configurarAbaConfiguracoes() {
        const abaConfig = document.getElementById('configuracoes-tab');
        if (abaConfig) {
            abaConfig.addEventListener('click', () => {
                setTimeout(() => this.carregarConfiguracoes(), 100);
            });
        }
    }

    async carregarConfiguracoes() {
        try {
            const response = await fetch('/config/notificacoes');
            if (!response.ok) throw new Error('Erro ao carregar configurações');
            
            this.config = await response.json();
            this.preencherFormulario();
            
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            this.mostrarToast('❌ Erro ao carregar configurações', 'error');
        }
    }

    preencherFormulario() {
    // Configurações básicas
    this.setChecked('notify-email', this.config.notify_email);
    this.setChecked('notify-telegram', this.config.notify_telegram);
    this.setChecked('notify-browser', this.config.notify_browser);
    
    // ✅ AGORA PREENCHE TODOS OS CAMPOS DE EMAIL
    // Email
    this.setValue('smtp-server', this.config.smtp_server);
    this.setValue('smtp-port', this.config.smtp_port);
    this.setValue('email-sender', this.config.email_sender);
    this.setValue('email-password', this.config.email_password);
    this.setValue('notify-email-address', this.config.email_notificacao);
    this.setValue('email-frequency', this.config.email_frequency);
    
    // Telegram
    this.setValue('telegram-chat-id', this.config.telegram_chat_id);
    this.setValue('telegram-bot-token', this.config.telegram_bot_token);
    
    // Eventos para notificar
    this.setChecked('alert-saldo-baixo', this.config.alert_saldo_baixo);
    this.setChecked('alert-consumo-pico', this.config.alert_consumo_pico);
    this.setChecked('alert-reles-desligados', this.config.alert_reles_desligados);
    this.setChecked('alert-pzem-offline', this.config.alert_pzem_offline);
    this.setChecked('alert-erro-sistema', this.config.alert_erro_sistema);
    
    // Mostrar/ocultar seções
    this.toggleSection('email-settings', this.config.notify_email);
    this.toggleSection('telegram-settings', this.config.notify_telegram);
}

    setChecked(id, value) {
        const element = document.getElementById(id);
        if (element) element.checked = Boolean(value);
    }

    setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    }

    toggleSection(id, show) {
        const element = document.getElementById(id);
        if (element) element.style.display = show ? 'block' : 'none';
    }

    async salvarConfiguracoes(e) {
        e.preventDefault();
        
        const formData = this.coletarDadosFormulario();
        
        if (!this.validarFormulario(formData)) {
            return;
        }

        try {
            const response = await fetch('/config/notificacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.mostrarToast('✅ Configurações salvas com sucesso!', 'success');
                this.config = { ...this.config, ...formData }; // Atualizar cache local
            } else {
                this.mostrarToast('❌ Erro ao salvar: ' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.mostrarToast('❌ Erro ao salvar configurações', 'error');
        }
    }


    coletarDadosFormulario() {
    return {
        // ✅ AGORA COLETA TODOS OS CAMPOS NECESSÁRIOS
        // Telegram
        notify_telegram: document.getElementById('notify-telegram').checked,
        telegram_bot_token: document.getElementById('telegram-bot-token').value,
        telegram_chat_id: document.getElementById('telegram-chat-id').value,
        
        // Email - TODOS OS CAMPOS
        notify_email: document.getElementById('notify-email').checked,
        smtp_server: document.getElementById('smtp-server').value,
        smtp_port: parseInt(document.getElementById('smtp-port').value) || 587,
        email_sender: document.getElementById('email-sender').value,
        email_password: document.getElementById('email-password').value,
        email_notificacao: document.getElementById('notify-email-address').value,
        email_frequency: document.getElementById('email-frequency').value,
        
        // Browser
        notify_browser: document.getElementById('notify-browser').checked,
        
        // Alertas
        alert_saldo_baixo: document.getElementById('alert-saldo-baixo').checked,
        alert_consumo_pico: document.getElementById('alert-consumo-pico').checked,
        alert_reles_desligados: document.getElementById('alert-reles-desligados').checked,
        alert_pzem_offline: document.getElementById('alert-pzem-offline').checked,
        alert_erro_sistema: document.getElementById('alert-erro-sistema').checked
    };
}
    validarFormulario(formData) {
        // Validar email
        if (formData.notify_email && !formData.email_notificacao) {
            this.mostrarToast('📧 Preencha o email para notificações', 'warning');
            return false;
        }

        if (formData.notify_email && !this.validarEmail(formData.email_notificacao)) {
            this.mostrarToast('📧 Email inválido', 'warning');
            return false;
        }

        // Validar Telegram
        if (formData.notify_telegram) {
            if (!formData.telegram_chat_id || !formData.telegram_bot_token) {
                this.mostrarToast('📱 Preencha todas as configurações do Telegram', 'warning');
                return false;
            }
            
            if (!this.validarChatIdTelegram(formData.telegram_chat_id)) {
                this.mostrarToast('📱 Chat ID do Telegram inválido', 'warning');
                return false;
            }
        }

        return true;
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validarChatIdTelegram(chatId) {
        return /^-?\d+$/.test(chatId);
    }

    async testarNotificacao(tipo) {
        try {
            const response = await fetch('/config/notificacoes/testar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo })
            });

            const result = await response.json();
            this.mostrarToast(result.message, result.success ? 'success' : 'warning');
            
        } catch (error) {
            console.error(`Erro ao testar ${tipo}:`, error);
            this.mostrarToast(`❌ Erro ao testar ${tipo}`, 'error');
        }
    }

    async testarConexaoTelegram() {
        await this.testarNotificacao('telegram');
    }

    testarNotificacaoBrowser() {
        if (!('Notification' in window)) {
            this.mostrarToast('❌ Seu browser não suporta notificações', 'warning');
            return;
        }

        if (Notification.permission === 'granted') {
            this.enviarNotificacaoBrowserTeste();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.enviarNotificacaoBrowserTeste();
                } else {
                    this.mostrarToast('❌ Permissão para notificações negada', 'warning');
                }
            });
        } else {
            this.mostrarToast('❌ Permissão para notificações foi negada anteriormente', 'warning');
        }
    }

    enviarNotificacaoBrowserTeste() {
        const notification = new Notification('🔔 Sistema de Energia - Teste', {
            body: 'Esta é uma notificação de teste do sistema! Tudo está funcionando perfeitamente.',
            icon: '/static/favicon.ico',
            tag: 'teste-sistema'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        this.mostrarToast('✅ Notificação de browser enviada!', 'success');
    }

    mostrarToast(mensagem, tipo = 'info') {
        // Usar a função showToast global se disponível, senão criar uma simples
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
        } else {
            // Fallback simples
            console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
            alert(mensagem);
        }
    }

    // Métodos para uso externo
    getConfig() {
        return this.config;
    }

    estaAtivo(tipo) {
        return this.config[`notify_${tipo}`] || false;
    }

    deveNotificarEvento(evento) {
        return this.config[`alert_${evento}`] !== false;
    }
}

// ==========================================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ==========================================================

// Criar instância global
window.sistemaNotificacoes = new SistemaNotificacoes();

// Export para módulos (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SistemaNotificacoes;
}


 
