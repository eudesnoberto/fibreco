from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.auth import db
from src.utils.timezone import get_recife_time_utc

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'atividade_atribuida', 'atividade_concluida'
    activity_id = db.Column(db.Integer, db.ForeignKey('atividade.id'), nullable=True)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=get_recife_time_utc)
    
    # Relacionamentos
    user = db.relationship('User', backref='notifications')
    activity = db.relationship('Atividade', backref='notifications')
    
    def __repr__(self):
        return f'<Notification {self.title} - {self.user.username if self.user else "N/A"}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'activity_id': self.activity_id,
            'read': self.read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'activity_title': self.activity.titulo if self.activity else None
        }
