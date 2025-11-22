import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:

    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sua-chave-secreta-aqui-mude-isso-em-producao'
    
    # ✅ CORREÇÃO CRÍTICA: PostgreSQL para Render
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or \
        'postgresql://postgres:adilson1250@localhost:5432/autoprego'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
      
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-chave-secreta-aqui'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Configurações da API
    API_KEYS = {
        "SUA_CHAVE_API_SECRETA": "ESP8266"
    }