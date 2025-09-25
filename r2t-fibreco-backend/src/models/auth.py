from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum

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
    
    def check_password(self, password):
        """Verifica se a senha está correta"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Verifica se o usuário é administrador"""
        return self.role == UserRole.ADMIN
    
    def is_supervisor(self):
        """Verifica se o usuário é supervisor"""
        return self.role == UserRole.SUPERVISOR
    
    def is_user(self):
        """Verifica se o usuário é usuário comum"""
        return self.role == UserRole.USER
    
    def has_permission(self, required_role):
        """Verifica se o usuário tem permissão baseada no role"""
        role_hierarchy = {
            UserRole.USER: 1,
            UserRole.SUPERVISOR: 2,
            UserRole.ADMIN: 3
        }
        return role_hierarchy.get(self.role, 0) >= role_hierarchy.get(required_role, 0)
    
    def to_dict(self):
        """Converte o usuário para dicionário"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role.value,
            'nome_completo': self.nome_completo,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'ultimo_login': self.ultimo_login.isoformat() if self.ultimo_login else None
        }

class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_expiracao = db.Column(db.DateTime, nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    
    user = db.relationship('User', backref=db.backref('sessions', lazy=True))
    
    def is_valid(self):
        """Verifica se a sessão ainda é válida"""
        return self.ativo and datetime.utcnow() < self.data_expiracao
    
    def to_dict(self):
        """Converte a sessão para dicionário"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'token': self.token,
            'data_criacao': self.data_criacao.isoformat(),
            'data_expiracao': self.data_expiracao.isoformat(),
            'ativo': self.ativo
        }

