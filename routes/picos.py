from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app import db, dados_pzem       # db e dados_pzem vêm do app.py
from models import EnergyData        # modelo do banco

# Cria blueprint para picos
picos_bp = Blueprint('picos', __name__)


# ============================================
# FUNÇÃO 1 – PICO DO DIA
# ============================================
def obter_pico_do_dia():
    try:
        hoje = datetime.utcnow().date()

        # PZEM 1
        pico_pzem1 = EnergyData.query.filter(
            EnergyData.pzem_id == 1,
            db.func.date(EnergyData.timestamp) == hoje
        ).order_by(EnergyData.power.desc()).first()

        # PZEM 2
        pico_pzem2 = EnergyData.query.filter(
            EnergyData.pzem_id == 2,
            db.func.date(EnergyData.timestamp) == hoje
        ).order_by(EnergyData.power.desc()).first()

        picos = []

        if pico_pzem1:
            picos.append({
                "value": pico_pzem1.power,
                "time": pico_pzem1.timestamp.strftime("%H:%M"),
                "pzem": 1
            })

        if pico_pzem2:
            picos.append({
                "value": pico_pzem2.power,
                "time": pico_pzem2.timestamp.strftime("%H:%M"),
                "pzem": 2
            })

        if picos:
            return max(picos, key=lambda x: x["value"])

        # Fallback em tempo real
        pico_atual = max(dados_pzem["pzem1"]["power"], dados_pzem["pzem2"]["power"])
        return {
            "value": pico_atual,
            "time": datetime.now().strftime("%H:%M"),
            "pzem": 1 if dados_pzem["pzem1"]["power"] >= dados_pzem["pzem2"]["power"] else 2
        }

    except Exception as e:
        print("❌ Erro obter pico do dia:", e)
        return {"error": str(e)}


# ============================================
# FUNÇÃO 2 – PICOS DA SEMANA
# ============================================
def obter_picos_semana_atual():
    try:
        hoje = datetime.utcnow().date()
        inicio_semana = hoje - timedelta(days=hoje.weekday())

        nomes_dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
        labels = []
        valores = []

        for i in range(7):
            data = inicio_semana + timedelta(days=i)
            labels.append(f"{nomes_dias[i]} ({data.day})")

            if data > hoje:
                valores.append(0)
                continue

            pico1 = EnergyData.query.filter(
                EnergyData.pzem_id == 1,
                db.func.date(EnergyData.timestamp) == data
            ).order_by(EnergyData.power.desc()).first()

            pico2 = EnergyData.query.filter(
                EnergyData.pzem_id == 2,
                db.func.date(EnergyData.timestamp) == data
            ).order_by(EnergyData.power.desc()).first()

            valor = max(
                [p.power for p in [pico1, pico2] if p],
                default=0
            )

            valores.append(valor)

        return {"labels": labels, "values": valores}

    except Exception as e:
        print("❌ Erro obter picos semana:", e)
        return {"labels": [], "values": []}


# ============================================
# FUNÇÃO 3 – MAIOR PICO SEMANAL
# ============================================
def obter_pico_semanal():
    try:
        hoje = datetime.utcnow().date()
        inicio_semana = hoje - timedelta(days=hoje.weekday())

        pico1 = EnergyData.query.filter(
            EnergyData.pzem_id == 1,
            EnergyData.timestamp >= inicio_semana
        ).order_by(EnergyData.power.desc()).first()

        pico2 = EnergyData.query.filter(
            EnergyData.pzem_id == 2,
            EnergyData.timestamp >= inicio_semana
        ).order_by(EnergyData.power.desc()).first()

        picos = []

        if pico1:
            picos.append({
                "value": pico1.power,
                "time": pico1.timestamp.strftime("%d/%m %H:%M"),
                "pzem": 1
            })

        if pico2:
            picos.append({
                "value": pico2.power,
                "time": pico2.timestamp.strftime("%d/%m %H:%M"),
                "pzem": 2
            })

        if picos:
            return max(picos, key=lambda x: x["value"])

        # fallback
        pico_atual = max(dados_pzem["pzem1"]["power"], dados_pzem["pzem2"]["power"])
        return {
            "value": pico_atual,
            "time": datetime.now().strftime("%d/%m %H:%M"),
            "pzem": 1 if dados_pzem["pzem1"]["power"] >= dados_pzem["pzem2"]["power"] else 2
        }

    except Exception as e:
        print("❌ Erro pico semanal:", e)
        return {"error": str(e)}


# ============================================
# FUNÇÃO 4 – PICO MENSAL
# ============================================
def obter_pico_mensal():
    try:
        hoje = datetime.utcnow().date()
        inicio_mes = hoje.replace(day=1)

        pico1 = EnergyData.query.filter(
            EnergyData.pzem_id == 1,
            EnergyData.timestamp >= inicio_mes
        ).order_by(EnergyData.power.desc()).first()

        pico2 = EnergyData.query.filter(
            EnergyData.pzem_id == 2,
            EnergyData.timestamp >= inicio_mes
        ).order_by(EnergyData.power.desc()).first()

        picos = []

        if pico1:
            picos.append({
                "value": pico1.power,
                "time": pico1.timestamp.strftime("%d/%m %H:%M"),
                "pzem": 1
            })

        if pico2:
            picos.append({
                "value": pico2.power,
                "time": pico2.timestamp.strftime("%d/%m %H:%M"),
                "pzem": 2
            })

        if picos:
            return max(picos, key=lambda x: x["value"])

        # fallback
        pico_atual = max(dados_pzem["pzem1"]["power"], dados_pzem["pzem2"]["power"])
        return {
            "value": pico_atual,
            "time": datetime.now().strftime("%d/%m %H:%M"),
            "pzem": 1 if dados_pzem["pzem1"]["power"] >= dados_pzem["pzem2"]["power"] else 2
        }

    except Exception as e:
        print("❌ Erro pico mensal:", e)
        return {"error": str(e)}


# ============================================
# ROTAS DA API
# ============================================
@picos_bp.route("/api/pico/dia")
def api_pico_dia():
    return jsonify(obter_pico_do_dia())

@picos_bp.route("/api/pico/semana")
def api_pico_semana():
    return jsonify(obter_picos_semana_atual())

@picos_bp.route("/api/pico/semanal")
def api_pico_semanal():
    return jsonify(obter_pico_semanal())

@picos_bp.route("/api/pico/mensal")
def api_pico_mensal():
    return jsonify(obter_pico_mensal())
