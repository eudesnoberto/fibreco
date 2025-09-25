from flask import Blueprint, jsonify, request, g
from src.models.notification import Notification
from src.models.auth import User, db
from src.routes.auth import login_required
import json

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """Obter notificações do usuário logado"""
    try:
        user_id = g.user_id
        
        # Buscar notificações não lidas primeiro, depois as lidas
        notifications = Notification.query.filter_by(user_id=user_id)\
            .order_by(Notification.read.asc(), Notification.created_at.desc())\
            .limit(50).all()
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications],
            'unread_count': Notification.query.filter_by(user_id=user_id, read=False).count()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notification_id):
    """Marcar notificação como lida"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        # Verificar se a notificação pertence ao usuário logado
        if notification.user_id != g.user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        notification.read = True
        db.session.commit()
        
        return jsonify({'message': 'Notificação marcada como lida'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_notifications_read():
    """Marcar todas as notificações como lidas"""
    try:
        user_id = g.user_id
        
        Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
        db.session.commit()
        
        return jsonify({'message': 'Todas as notificações foram marcadas como lidas'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

def create_notification(user_id, title, message, notification_type, activity_id=None):
    """Função utilitária para criar notificações"""
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            activity_id=activity_id
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return notification
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar notificação: {e}")
        return None

def notify_activity_assigned(activity):
    """Notificar quando uma atividade é atribuída a um fibreco"""
    if activity.usuario and activity.usuario.role.value == 'user':
        title = "Nova Atividade Atribuída"
        message = f"Uma nova atividade foi atribuída para você: {activity.titulo}"
        
        create_notification(
            user_id=activity.usuario_id,
            title=title,
            message=message,
            notification_type='atividade_atribuida',
            activity_id=activity.id
        )

def notify_activity_completed(activity):
    """Notificar quando uma atividade é concluída (para admins e supervisores)"""
    # Buscar todos os admins e supervisores
    admins_and_supervisors = User.query.filter(
        User.role.in_(['admin', 'supervisor'])
    ).all()
    
    for user in admins_and_supervisors:
        title = "Atividade Concluída"
        message = f"A atividade '{activity.titulo}' foi concluída por {activity.usuario.nome_completo if activity.usuario else 'usuário'}"
        
        create_notification(
            user_id=user.id,
            title=title,
            message=message,
            notification_type='atividade_concluida',
            activity_id=activity.id
        )

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """Deletar uma notificação específica"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        # Verificar se a notificação pertence ao usuário logado
        if notification.user_id != g.user_id:
            return jsonify({'error': 'Acesso negado'}), 403
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'message': 'Notificação deletada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@notifications_bp.route('/notifications/delete-all', methods=['DELETE'])
@login_required
def delete_all_notifications():
    """Deletar todas as notificações do usuário"""
    try:
        user_id = g.user_id
        
        # Deletar todas as notificações do usuário
        Notification.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Todas as notificações foram deletadas'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500
