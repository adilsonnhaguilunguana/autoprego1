import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # =========================================================
    # 🔐 SEGURANÇA
    # =========================================================
    # Chave usada pelo Flask (sessões, CSRF, etc.)
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua-chave-secreta-aqui-mude-isso-em-producao'

    # JWT (se estiveres a usar tokens em alguma parte do sistema)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-chave-secreta-aqui'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # =========================================================
    # 🟦 BANCO DE DADOS – POSTGRES (LOCAL + RENDER)
    # =========================================================
    DATABASE_URL = os.environ.get('DATABASE_URL')

    # Render usa "postgres://", mas o SQLAlchemy exige "postgresql://"
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    # Se estiver em produção (Render) → usa DATABASE_URL
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or \
        'postgresql://postgres:adilson1250@localhost:5432/autoprego'

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Opcional, mas MUITO recomendável para Render (pool de conexões)
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    }

    # =========================================================
    # 🔑 CONFIGURAÇÃO DA API (APENAS 1 ESP8266)
    # =========================================================
    API_KEYS = {
        "SUA_CHAVE_API_SECRETA": "ESP8266"
    }
