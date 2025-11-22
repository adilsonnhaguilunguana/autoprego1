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



    validarFormulario(formData) {
    console.log("🔍 Validando formulário...", formData);

    // Validar Email - VERIFICAÇÃO COMPLETA
    if (formData.notify_email) {
        console.log("📧 Validando configurações de email...");
        
        // Validar servidor SMTP
        if (!formData.smtp_server || !formData.smtp_server.trim()) {
            this.mostrarToast('📧 Servidor SMTP é obrigatório', 'warning');
            return false;
        }
        
        // Validar porta SMTP
        if (!formData.smtp_port || formData.smtp_port < 1 || formData.smtp_port > 65535) {
            this.mostrarToast('📧 Porta SMTP inválida (deve ser entre 1 e 65535)', 'warning');
            return false;
        }
        
        // Validar email de envio
        if (!formData.email_sender || !formData.email_sender.trim()) {
            this.mostrarToast('📧 Email de envio é obrigatório', 'warning');
            return false;
        }
        
        if (!this.validarEmail(formData.email_sender)) {
            this.mostrarToast('📧 Email de envio inválido', 'warning');
            return false;
        }
        
        // Validar senha do email
        if (!formData.email_password || !formData.email_password.trim()) {
            this.mostrarToast('📧 Senha do email é obrigatória', 'warning');
            return false;
        }
        
        // Validar email para notificações
        if (!formData.email_notificacao || !formData.email_notificacao.trim()) {
            this.mostrarToast('📧 Email para notificações é obrigatório', 'warning');
            return false;
        }
        
        if (!this.validarEmail(formData.email_notificacao)) {
            this.mostrarToast('📧 Email para notificações inválido', 'warning');
            return false;
        }
        
        // Validar frequência de email
        if (!formData.email_frequency || !['immediate', 'hourly', 'daily'].includes(formData.email_frequency)) {
            this.mostrarToast('📧 Frequência de alertas inválida', 'warning');
            return false;
        }
        
        console.log("✅ Configurações de email validadas com sucesso");
    }

    // Validar Telegram - VERIFICAÇÃO COMPLETA
    if (formData.notify_telegram) {
        console.log("📱 Validando configurações do Telegram...");
        
        // Validar token do bot
        if (!formData.telegram_bot_token || !formData.telegram_bot_token.trim()) {
            this.mostrarToast('📱 Token do bot do Telegram é obrigatório', 'warning');
            return false;
        }
        
        // Validar formato do token (deve conter : )
        if (!formData.telegram_bot_token.includes(':')) {
            this.mostrarToast('📱 Token do bot inválido (formato: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)', 'warning');
            return false;
        }
        
        // Validar Chat ID
        if (!formData.telegram_chat_id || !formData.telegram_chat_id.trim()) {
            this.mostrarToast('📱 Chat ID do Telegram é obrigatório', 'warning');
            return false;
        }
        
        if (!this.validarChatIdTelegram(formData.telegram_chat_id)) {
            this.mostrarToast('📱 Chat ID do Telegram inválido (deve conter apenas números)', 'warning');
            return false;
        }
        
        console.log("✅ Configurações do Telegram validadas com sucesso");
    }

    // Validar se pelo menos um método de notificação está ativo
    if (!formData.notify_email && !formData.notify_telegram && !formData.notify_browser) {
        this.mostrarToast('⚠️ Selecione pelo menos um método de notificação (Email, Telegram ou Browser)', 'warning');
        return false;
    }

    // Validar se pelo menos um evento está selecionado para notificação
    const eventosSelecionados = [
        formData.alert_saldo_baixo,
        formData.alert_consumo_pico,
        formData.alert_reles_desligados,
        formData.alert_pzem_offline,
        formData.alert_erro_sistema
    ].some(evento => evento === true);

    if (!eventosSelecionados) {
        this.mostrarToast('⚠️ Selecione pelo menos um evento para notificar', 'warning');
        return false;
    }

    // Validações específicas para Gmail
    if (formData.notify_email && formData.email_sender && formData.email_sender.toLowerCase().includes('gmail.com')) {
        console.log("🔐 Validações específicas para Gmail...");
        
        // Verificar se está usando porta recomendada para Gmail
        if (formData.smtp_port !== 587 && formData.smtp_port !== 465) {
            this.mostrarToast('📧 Gmail recomenda porta 587 (TLS) ou 465 (SSL)', 'info');
        }
        
        // Aviso sobre senha de aplicativo
        if (formData.email_password && formData.email_password.length < 16) {
            this.mostrarToast(
                '💡 Dica Gmail: Use uma "Senha de Aplicativo" de 16 caracteres, não sua senha normal', 
                'info'
            );
        }
    }

    // Validações para outros provedores
    if (formData.notify_email && formData.smtp_server) {
        const servidor = formData.smtp_server.toLowerCase();
        
        if (servidor.includes('outlook.com') || servidor.includes('hotmail.com')) {
            if (formData.smtp_port !== 587) {
                this.mostrarToast('📧 Outlook recomenda porta 587', 'info');
            }
        }
        
        if (servidor.includes('yahoo.com')) {
            if (formData.smtp_port !== 465 && formData.smtp_port !== 587) {
                this.mostrarToast('📧 Yahoo recomenda porta 465 (SSL) ou 587 (TLS)', 'info');
            }
        }
    }

    console.log("✅ Todas as validações passaram!");
    return true;
}

validarEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

validarChatIdTelegram(chatId) {
    if (!chatId || typeof chatId !== 'string') return false;
    
    // Permite números positivos e negativos (para grupos/canais)
    return /^-?\d+$/.test(chatId.trim());
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


 
