# notificacoes.py
# ==========================================================
# SISTEMA DE NOTIFICAÇÕES - BACKEND
# ==========================================================

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from models import Configuracao
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Configurar blueprint
notificacoes_bp = Blueprint('notificacoes', __name__)

# Configurar logging
logger = logging.getLogger(__name__)

# ==========================================================
# 🔹 FUNÇÕES DE ENVIO DE NOTIFICAÇÕES
# ==========================================================

def enviar_email(destinatario, assunto, mensagem, config):
    """
    Enviar email de notificação
    """
    try:
        # ⚠️ CONFIGURAR ESTAS VARIÁVEIS COM SEUS DADOS DE EMAIL
        SMTP_SERVER = "smtp.gmail.com"  # ou seu servidor SMTP
        SMTP_PORT = 587
        EMAIL_USER = "seu-email@gmail.com"  # seu email
        EMAIL_PASSWORD = "sua-senha"  # sua senha ou app password
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = destinatario
        msg['Subject'] = f"🔔 Sistema de Energia - {assunto}"
        
        # Corpo do email
        corpo = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #1a73e8; text-align: center;">⚡ Sistema de Automação Residencial</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">{assunto}</h3>
                    <p style="color: #666; line-height: 1.6;">{mensagem}</p>
                </div>
                <div style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
                    <p>Este é um email automático do Sistema de Energia.</p>
                    <p>Não responda este email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(corpo, 'html'))
        
        # Enviar email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"✅ Email enviado para: {destinatario}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao enviar email: {e}")
        return False

def enviar_telegram(mensagem, config):
    """
    Enviar mensagem para Telegram
    """
    try:
        if not config.telegram_bot_token or not config.telegram_chat_id:
            return False
            
        url = f"https://api.telegram.org/bot{config.telegram_bot_token}/sendMessage"
        payload = {
            "chat_id": config.telegram_chat_id,
            "text": f"🔔 {mensagem}",
            "parse_mode": "HTML"
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Mensagem enviada para Telegram")
            return True
        else:
            logger.error(f"❌ Erro Telegram: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro ao enviar para Telegram: {e}")
        return False

# ==========================================================
# 🔹 SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS
# ==========================================================

class Notificador:
    def __init__(self):
        self.config = None
        self.carregar_configuracao()
    
    def carregar_configuracao(self):
        """Carregar configurações do banco"""
        self.config = Configuracao.query.first()
    
    def notificar_saldo_baixo(self, saldo_atual):
        """Notificar quando o saldo estiver baixo"""
        if not self.config or not self.config.alert_saldo_baixo:
            return
            
        mensagem = f"⚠️ Saldo de energia baixo: {saldo_atual:.2f} kWh"
        assunto = "Saldo de Energia Baixo"
        
        self._enviar_notificacao(assunto, mensagem)
    
    def notificar_consumo_pico(self, potencia, limite):
        """Notificar consumo em pico"""
        if not self.config or not self.config.alert_consumo_pico:
            return
            
        mensagem = f"🔴 Consumo em pico: {potencia:.1f}W (Limite: {limite}W)"
        assunto = "Consumo em Pico Detectado"
        
        self._enviar_notificacao(assunto, mensagem)
    
    def notificar_reles_desligados(self, quantidade_reles):
        """Notificar relés desligados automaticamente"""
        if not self.config or not self.config.alert_reles_desligados:
            return
            
        mensagem = f"🔌 {quantidade_reles} relé(s) desligado(s) automaticamente por saldo baixo"
        assunto = "Relés Desligados"
        
        self._enviar_notificacao(assunto, mensagem)
    
    def notificar_pzem_offline(self, pzem_id):
        """Notificar PZEM offline"""
        if not self.config or not self.config.alert_pzem_offline:
            return
            
        mensagem = f"📡 PZEM {pzem_id} desconectado - Sem comunicação"
        assunto = "PZEM Desconectado"
        
        self._enviar_notificacao(assunto, mensagem)
    
    def notificar_erro_sistema(self, erro):
        """Notificar erro no sistema"""
        if not self.config or not self.config.alert_erro_sistema:
            return
            
        mensagem = f"❌ Erro no sistema: {erro}"
        assunto = "Erro no Sistema"
        
        self._enviar_notificacao(assunto, mensagem)
    
    def _enviar_notificacao(self, assunto, mensagem):
        """Enviar notificação por todos os canais configurados"""
        self.carregar_configuracao()  # Recarregar configurações
        
        if not self.config:
            return
        
        # Email
        if self.config.notify_email and self.config.email_notificacao:
            enviar_email(self.config.email_notificacao, assunto, mensagem, self.config)
        
        # Telegram
        if self.config.notify_telegram:
            enviar_telegram(f"{assunto}: {mensagem}", self.config)
        
        # Log no console
        logger.info(f"📢 NOTIFICAÇÃO: {assunto} - {mensagem}")

# Instância global do notificador
notificador = Notificador()

# ==========================================================
# 🔹 ROTAS DA API
# ==========================================================

@notificacoes_bp.route('/config/notificacoes', methods=['GET'])
@login_required
def get_notificacoes():
    """Obter configurações atuais de notificações"""
    config = Configuracao.query.first()
    if not config:
        return jsonify({
            "notify_email": True,
            "notify_telegram": False,
            "notify_browser": True,
            "email_notificacao": "admin@example.com",
            "email_frequency": "immediate",
            "telegram_chat_id": "",
            "telegram_bot_token": "",
            "alert_saldo_baixo": True,
            "alert_consumo_pico": True,
            "alert_reles_desligados": True,
            "alert_pzem_offline": True,
            "alert_erro_sistema": True
        })
    
    return jsonify({
        "notify_email": config.notify_email,
        "notify_telegram": config.notify_telegram,
        "notify_browser": getattr(config, 'notify_browser', True),
        "email_notificacao": config.email_notificacao,
        "email_frequency": getattr(config, 'email_frequency', 'immediate'),
        "telegram_chat_id": getattr(config, 'telegram_chat_id', ''),
        "telegram_bot_token": getattr(config, 'telegram_bot_token', ''),
        "alert_saldo_baixo": getattr(config, 'alert_saldo_baixo', True),
        "alert_consumo_pico": getattr(config, 'alert_consumo_pico', True),
        "alert_reles_desligados": getattr(config, 'alert_reles_desligados', True),
        "alert_pzem_offline": getattr(config, 'alert_pzem_offline', True),
        "alert_erro_sistema": getattr(config, 'alert_erro_sistema', True)
    })

@notificacoes_bp.route('/config/notificacoes', methods=['POST'])
@login_required
def config_notificacoes():
    """Salvar configurações de notificações"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Nenhum dado recebido"}), 400

    config = Configuracao.query.first()
    if not config:
        config = Configuracao()
        db.session.add(config)

    try:
        # Configurações básicas
        config.notify_email = bool(data.get('notify_email', True))
        config.notify_telegram = bool(data.get('notify_telegram', False))
        config.notify_browser = bool(data.get('notify_browser', True))
        config.email_notificacao = data.get('email_notificacao', 'admin@example.com')
        config.email_frequency = data.get('email_frequency', 'immediate')
        
        # Configurações do Telegram
        config.telegram_chat_id = data.get('telegram_chat_id', '')
        config.telegram_bot_token = data.get('telegram_bot_token', '')
        
        # Eventos para notificar
        config.alert_saldo_baixo = bool(data.get('alert_saldo_baixo', True))
        config.alert_consumo_pico = bool(data.get('alert_consumo_pico', True))
        config.alert_reles_desligados = bool(data.get('alert_reles_desligados', True))
        config.alert_pzem_offline = bool(data.get('alert_pzem_offline', True))
        config.alert_erro_sistema = bool(data.get('alert_erro_sistema', True))

        db.session.commit()
        
        # Recarregar configurações no notificador
        notificador.carregar_configuracao()
        
        logger.info(f"✅ Configurações de notificação salvas por {current_user.username}")
        
        return jsonify({
            "success": True, 
            "message": "Configurações de notificação salvas com sucesso!"
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Erro ao salvar notificações: {e}")
        return jsonify({"success": False, "message": f"Erro ao salvar: {str(e)}"}), 500

@notificacoes_bp.route('/config/notificacoes/testar', methods=['POST'])
@login_required
def testar_notificacoes():
    """Testar o envio de notificações"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dados não fornecidos"}), 400
        
    tipo_teste = data.get('tipo', 'email')
    
    config = Configuracao.query.first()
    if not config:
        return jsonify({"success": False, "message": "Configuração não encontrada"}), 400

    try:
        if tipo_teste == 'email':
            if not config.notify_email:
                return jsonify({"success": False, "message": "Notificações por email estão desativadas"}), 400
                
            if not config.email_notificacao:
                return jsonify({"success": False, "message": "Email de notificação não configurado"}), 400
            
            # Testar envio de email
            sucesso = enviar_email(
                config.email_notificacao,
                "Teste de Notificação",
                "Esta é uma mensagem de teste do sistema de notificações. Se recebeu este email, o sistema está funcionando corretamente!",
                config
            )
            
            if sucesso:
                return jsonify({
                    "success": True, 
                    "message": f"✅ Email de teste enviado para {config.email_notificacao}"
                })
            else:
                return jsonify({
                    "success": False, 
                    "message": "❌ Falha ao enviar email. Verifique as configurações SMTP."
                })
                
        elif tipo_teste == 'telegram':
            if not config.notify_telegram:
                return jsonify({"success": False, "message": "Notificações por Telegram estão desativadas"}), 400
                
            if not config.telegram_chat_id or not config.telegram_bot_token:
                return jsonify({"success": False, "message": "Configurações do Telegram incompletas"}), 400
            
            # Testar envio para Telegram
            sucesso = enviar_telegram(
                "🔔 Teste de Notificação - Sistema de Energia\n"
                "Esta é uma mensagem de teste. Se recebeu esta mensagem, o Telegram está configurado corretamente!",
                config
            )
            
            if sucesso:
                return jsonify({
                    "success": True, 
                    "message": f"✅ Mensagem de teste enviada para Telegram (Chat ID: {config.telegram_chat_id})"
                })
            else:
                return jsonify({
                    "success": False, 
                    "message": "❌ Falha ao enviar para Telegram. Verifique o Token e Chat ID."
                })
                
        elif tipo_teste == 'browser':
            return jsonify({
                "success": True, 
                "message": "✅ Sistema de notificações de browser configurado"
            })
            
        else:
            return jsonify({
                "success": False, 
                "message": f"❌ Tipo de teste não suportado: {tipo_teste}"
            })
            
    except Exception as e:
        logger.error(f"❌ Erro no teste de notificações: {e}")
        return jsonify({"success": False, "message": f"Erro interno: {str(e)}"}), 500