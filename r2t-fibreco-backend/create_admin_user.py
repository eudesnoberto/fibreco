#!/usr/bin/env python3
"""
Script para criar usuário administrador inicial
"""
import os
import sys

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from datetime import datetime
import enum

# Definir modelos localmente para evitar problemas de importação
db = SQLAlchemy()

class UserRole(enum.Enum):
    USER = "user"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.USER)
    nome_completo = db.Column(db.String(200), nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        """Define a senha do usuário com hash"""
        self.password_hash = generate_password_hash(password)

def create_admin_user():
    """Cria usuário administrador inicial"""
    
    # Configurar Flask app
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Criar tabelas se não existirem
        db.create_all()
        
        # Verificar se já existe um admin
        admin_exists = User.query.filter_by(role=UserRole.ADMIN).first()
        if admin_exists:
            print(f"Usuário administrador já existe: {admin_exists.username}")
            # Continuar para criar os outros usuários
        
        # Criar usuário administrador se não existir
        if not admin_exists:
            admin_user = User(
                username='admin',
                email='admin@r2t.com.br',
                nome_completo='Administrador R2T',
                role=UserRole.ADMIN,
                ativo=True
            )
            admin_user.set_password('admin123')  # Senha padrão
            db.session.add(admin_user)
        else:
            admin_user = admin_exists
        
        # Criar usuário supervisor de exemplo se não existir
        supervisor_exists = User.query.filter_by(username='supervisor').first()
        if not supervisor_exists:
            supervisor_user = User(
                username='supervisor',
                email='supervisor@r2t.com.br',
                nome_completo='Supervisor R2T',
                role=UserRole.SUPERVISOR,
                ativo=True
            )
            supervisor_user.set_password('supervisor123')  # Senha padrão
            db.session.add(supervisor_user)
        else:
            supervisor_user = supervisor_exists
        
        # Criar usuário comum de exemplo se não existir
        user_exists = User.query.filter_by(username='usuario').first()
        if not user_exists:
            user_example = User(
                username='usuario',
                email='usuario@r2t.com.br',
                nome_completo='Usuário R2T',
                role=UserRole.USER,
                ativo=True
            )
            user_example.set_password('usuario123')  # Senha padrão
            db.session.add(user_example)
        else:
            user_example = user_exists
        db.session.commit()
        
        print("Usuários criados com sucesso!")
        print("Administrador:")
        print(f"  Username: {admin_user.username}")
        print(f"  Email: {admin_user.email}")
        print(f"  Senha: admin123")
        print()
        print("Supervisor:")
        print(f"  Username: {supervisor_user.username}")
        print(f"  Email: {supervisor_user.email}")
        print(f"  Senha: supervisor123")
        print()
        print("Usuário:")
        print(f"  Username: {user_example.username}")
        print(f"  Email: {user_example.email}")
        print(f"  Senha: usuario123")
        print()
        print("IMPORTANTE: Altere as senhas padrão após o primeiro login!")

if __name__ == '__main__':
    create_admin_user()

