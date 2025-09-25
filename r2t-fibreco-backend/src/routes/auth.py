from flask import Blueprint, request, jsonify, session, g
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import secrets
import functools

from ..models.auth import db, User, Session, UserRole

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator para rotas que requerem autenticação"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_session = Session.query.filter_by(token=token, ativo=True).first()
        if not user_session or not user_session.is_valid():
            return jsonify({'error': 'Token inválido ou expirado'}), 401
        
        request.current_user = user_session.user
        g.user_id = user_session.user.id
        return f(*args, **kwargs)
    
    return decorated_function

def role_required(required_role):
    """Decorator para rotas que requerem um role específico"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user') or not request.current_user.has_permission(required_role):
                role_names = {
                    UserRole.USER: 'usuário',
                    UserRole.SUPERVISOR: 'supervisor',
                    UserRole.ADMIN: 'administrador'
                }
                return jsonify({'error': f'Acesso negado. Perfil de {role_names[required_role]} ou superior requerido'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Decorator para rotas que requerem perfil de administrador"""
    return role_required(UserRole.ADMIN)(f)

def supervisor_required(f):
    """Decorator para rotas que requerem perfil de supervisor ou admin"""
    return role_required(UserRole.SUPERVISOR)(f)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint para login de usuários"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        # Buscar usuário
        user = User.query.filter_by(username=username, ativo=True).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Gerar token de sessão
        token = secrets.token_urlsafe(32)
        expiration = datetime.utcnow() + timedelta(hours=8)  # 8 horas de validade
        
        # Criar sessão
        user_session = Session(
            user_id=user.id,
            token=token,
            data_expiracao=expiration
        )
        
        # Atualizar último login
        user.ultimo_login = datetime.utcnow()
        
        db.session.add(user_session)
        db.session.commit()
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'token': token,
            'user': user.to_dict(),
            'expires_at': expiration.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Endpoint para logout de usuários"""
    try:
        token = request.headers.get('Authorization')
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Desativar sessão
        user_session = Session.query.filter_by(token=token).first()
        if user_session:
            user_session.ativo = False
            db.session.commit()
        
        return jsonify({'message': 'Logout realizado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Endpoint para obter dados do usuário atual"""
    return jsonify({
        'user': request.current_user.to_dict()
    }), 200

@auth_bp.route('/users', methods=['GET'])
@login_required
@admin_required
def list_users():
    """Endpoint para listar usuários (supervisor ou admin)"""
    try:
        # Supervisores só podem ver usuários com role menor ou igual
        current_user = request.current_user
        if current_user.is_admin():
            users = User.query.all()
        else:  # supervisor
            users = User.query.filter(User.role.in_([UserRole.USER])).all()
        
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    """Endpoint para criar usuário (supervisor ou admin)"""
    try:
        data = request.get_json()
        current_user = request.current_user
        
        # Validar dados obrigatórios
        required_fields = ['username', 'email', 'password', 'nome_completo', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se username já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username já existe'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já existe'}), 400
        
        # Validar role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({'error': 'Role inválido. Use "user", "supervisor" ou "admin"'}), 400
        
        # Verificar permissões para criar usuário com determinado role
        if not current_user.has_permission(role):
            return jsonify({'error': 'Você não tem permissão para criar usuários com este role'}), 403
        
        # Criar usuário
        user = User(
            username=data['username'],
            email=data['email'],
            nome_completo=data['nome_completo'],
            role=role,
            ativo=data.get('ativo', True)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    """Endpoint para atualizar usuário (supervisor ou admin)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        current_user = request.current_user
        
        # Verificar se o usuário pode editar este usuário
        if not current_user.has_permission(user.role):
            return jsonify({'error': 'Você não tem permissão para editar este usuário'}), 403
        
        # Atualizar campos permitidos
        if 'username' in data:
            # Verificar se username já existe (exceto o próprio usuário)
            existing = User.query.filter_by(username=data['username']).first()
            if existing and existing.id != user.id:
                return jsonify({'error': 'Username já existe'}), 400
            user.username = data['username']
        
        if 'email' in data:
            # Verificar se email já existe (exceto o próprio usuário)
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user.id:
                return jsonify({'error': 'Email já existe'}), 400
            user.email = data['email']
        
        if 'nome_completo' in data:
            user.nome_completo = data['nome_completo']
        
        if 'role' in data:
            try:
                new_role = UserRole(data['role'])
                # Verificar se pode alterar para este role
                if not current_user.has_permission(new_role):
                    return jsonify({'error': 'Você não tem permissão para alterar para este role'}), 403
                user.role = new_role
            except ValueError:
                return jsonify({'error': 'Role inválido. Use "user", "supervisor" ou "admin"'}), 400
        
        if 'ativo' in data:
            user.ativo = data['ativo']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """Endpoint para deletar usuário permanentemente (apenas admin)"""
    try:
        user = User.query.get_or_404(user_id)
        current_user = request.current_user
        
        # Não permitir deletar o próprio usuário
        if user.id == current_user.id:
            return jsonify({'error': 'Não é possível deletar o próprio usuário'}), 400
        
        # Deletar todas as sessões do usuário primeiro
        from src.models.auth import Session
        Session.query.filter_by(user_id=user.id).delete()
        
        # Deletar usuário permanentemente
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Usuário excluído permanentemente com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
@admin_required
def get_user(user_id):
    """Endpoint para obter dados de um usuário específico"""
    try:
        user = User.query.get_or_404(user_id)
        current_user = request.current_user
        
        # Verificar se o usuário pode ver este usuário
        if not current_user.has_permission(user.role):
            return jsonify({'error': 'Você não tem permissão para ver este usuário'}), 403
        
        return jsonify({
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Endpoint para alterar senha do usuário logado"""
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'A nova senha deve ter pelo menos 6 caracteres'}), 400
        
        current_user = request.current_user
        
        # Verificar senha atual
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Senha atual incorreta'}), 400
        
        # Atualizar senha
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

