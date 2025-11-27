import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # =========================================================
    # 🔐 SEGURANÇA
    # =========================================================
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua-chave-secreta-aqui-mude-isso-em-producao'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-chave-secreta-aqui'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # =========================================================
    # 🟦 BANCO DE DADOS – POSTGRES (LOCAL + RAILWAY)
    # =========================================================
    DATABASE_URL = os.environ.get("DATABASE_URL")

    if not DATABASE_URL:
        print("⚠️ DATABASE_URL não encontrada – usando SQLite local para testes.")
        DATABASE_URL = "sqlite:///local.db"

    # Railway às vezes envia postgres:// → corrigir
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Não forçar psycopg3. psycopg2-binary aceita normalmente o prefixo postgresql://
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    }

    # =========================================================
    # 🔑 API KEY PERMITIDA NO ESP
    # =========================================================
    API_KEYS = {
        "SUA_CHAVE_API_SECRETA": "ESP8266"
    }
