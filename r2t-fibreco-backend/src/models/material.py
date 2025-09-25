from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.auth import db
from src.utils.timezone import get_recife_time_utc

class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(50), nullable=False)  # plaquetas, cabos, caixas, conectores, tubetes, etc.
    subcategoria = db.Column(db.String(50), nullable=True)  # fig8, CTO, GP, SC APC, precom, etc.
    quantidade = db.Column(db.Integer, nullable=False, default=0)
    quantidade_minima = db.Column(db.Integer, nullable=False, default=10)
    unidade = db.Column(db.String(20), nullable=False, default='unidade')  # unidade, metro, rolo, etc.
    localizacao = db.Column(db.String(100), nullable=True)  # onde está armazenado
    fornecedor = db.Column(db.String(100), nullable=True)
    preco_unitario = db.Column(db.Float, nullable=True)
    codigo_interno = db.Column(db.String(50), nullable=True)
    codigo_fornecedor = db.Column(db.String(50), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Usuário proprietário do material
    data_cadastro = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    ativo = db.Column(db.Boolean, nullable=False, default=True)

    def __repr__(self):
        return f'<Material {self.nome}>'

    def to_dict(self):
        from src.models.auth import User
        
        # Buscar informações do usuário proprietário
        usuario_nome = None
        if self.usuario_id:
            user = User.query.get(self.usuario_id)
            if user:
                usuario_nome = user.nome_completo
        
        return {
            'id': self.id,
            'nome': self.nome,
            'categoria': self.categoria,
            'subcategoria': self.subcategoria,
            'quantidade': self.quantidade,
            'quantidade_minima': self.quantidade_minima,
            'unidade': self.unidade,
            'localizacao': self.localizacao,
            'fornecedor': self.fornecedor,
            'preco_unitario': self.preco_unitario,
            'codigo_interno': self.codigo_interno,
            'codigo_fornecedor': self.codigo_fornecedor,
            'descricao': self.descricao,
            'usuario_id': self.usuario_id,
            'usuario_nome': usuario_nome,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo,
            'status_estoque': self.get_status_estoque()
        }

    def get_status_estoque(self):
        if self.quantidade <= 0:
            return 'sem_estoque'
        elif self.quantidade <= self.quantidade_minima:
            return 'estoque_baixo'
        else:
            return 'estoque_ok'

class MovimentacaoEstoque(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('material.id'), nullable=False)
    tipo_movimentacao = db.Column(db.String(20), nullable=False)  # entrada, saida, ajuste
    quantidade = db.Column(db.Integer, nullable=False)
    quantidade_anterior = db.Column(db.Integer, nullable=False)
    quantidade_atual = db.Column(db.Integer, nullable=False)
    motivo = db.Column(db.String(200), nullable=True)
    responsavel = db.Column(db.String(100), nullable=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    imagens = db.Column(db.Text, nullable=True)  # JSON string com URLs das imagens
    data_movimentacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    material = db.relationship('Material', backref=db.backref('movimentacoes', lazy=True))

    def __repr__(self):
        return f'<MovimentacaoEstoque {self.tipo_movimentacao} - {self.quantidade}>'

    def to_dict(self):
        import json
        from src.models.auth import User
        
        # Buscar o usuário responsável se responsavel_id estiver definido
        responsavel_nome = self.responsavel
        if self.responsavel_id:
            user = User.query.get(self.responsavel_id)
            if user:
                responsavel_nome = user.nome_completo
        
        return {
            'id': self.id,
            'material_id': self.material_id,
            'material_nome': self.material.nome if self.material else None,
            'tipo_movimentacao': self.tipo_movimentacao,
            'quantidade': self.quantidade,
            'quantidade_anterior': self.quantidade_anterior,
            'quantidade_atual': self.quantidade_atual,
            'motivo': self.motivo,
            'responsavel': self.responsavel,
            'responsavel_id': self.responsavel_id,
            'responsavel_nome': responsavel_nome,
            'imagens': json.loads(self.imagens) if self.imagens else [],
            'data_movimentacao': self.data_movimentacao.isoformat() if self.data_movimentacao else None
        }

class Atividade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Usuário responsável pela atividade
    supervisor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Supervisor que criou a atividade
    material_id = db.Column(db.Integer, db.ForeignKey('material.id'), nullable=True)  # Material a ser usado (opcional)
    quantidade_necessaria = db.Column(db.Integer, nullable=True)  # Quantidade do material necessária (opcional)
    status = db.Column(db.String(20), nullable=False, default='pendente')  # pendente, em_andamento, concluida, cancelada
    data_criacao = db.Column(db.DateTime, nullable=False, default=get_recife_time_utc)
    data_limite = db.Column(db.DateTime, nullable=True)
    data_conclusao = db.Column(db.DateTime, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    # Novos campos para conclusão
    descricao_servico = db.Column(db.Text, nullable=True)  # Descrição do serviço realizado
    imagens_conclusao = db.Column(db.Text, nullable=True)  # JSON com URLs das imagens da conclusão
    # Campos de geolocalização
    latitude = db.Column(db.Float, nullable=True)  # Latitude da localização
    longitude = db.Column(db.Float, nullable=True)  # Longitude da localização
    endereco = db.Column(db.Text, nullable=True)  # Endereço da localização
    
    # Relacionamentos
    usuario = db.relationship('User', foreign_keys=[usuario_id], backref='atividades_atribuidas')
    supervisor = db.relationship('User', foreign_keys=[supervisor_id], backref='atividades_criadas')
    material = db.relationship('Material', backref='atividades')

    def __repr__(self):
        return f'<Atividade {self.titulo} - {self.usuario.nome_completo if self.usuario else "N/A"}>'

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'usuario_id': self.usuario_id,
            'usuario_nome': self.usuario.nome_completo if self.usuario else None,
            'supervisor_id': self.supervisor_id,
            'supervisor_nome': self.supervisor.nome_completo if self.supervisor else None,
            'material_id': self.material_id,
            'material_nome': self.material.nome if self.material else None,
            'quantidade_necessaria': self.quantidade_necessaria,
            'status': self.status,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_limite': self.data_limite.isoformat() if self.data_limite else None,
            'data_conclusao': self.data_conclusao.isoformat() if self.data_conclusao else None,
            'observacoes': self.observacoes,
            'descricao_servico': self.descricao_servico,
            'imagens_conclusao': json.loads(self.imagens_conclusao) if self.imagens_conclusao else [],
            'latitude': self.latitude,
            'longitude': self.longitude,
            'endereco': self.endereco
        }

class MaterialUsado(db.Model):
    """Materiais usados na conclusão de uma atividade"""
    id = db.Column(db.Integer, primary_key=True)
    atividade_id = db.Column(db.Integer, db.ForeignKey('atividade.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('material.id'), nullable=False)
    quantidade_usada = db.Column(db.Integer, nullable=False)
    data_uso = db.Column(db.DateTime, nullable=False, default=get_recife_time_utc)
    
    # Relacionamentos
    atividade = db.relationship('Atividade', backref='materiais_usados')
    material = db.relationship('Material', backref='usos_em_atividades')
    
    def __repr__(self):
        return f'<MaterialUsado {self.material.nome if self.material else "N/A"} - {self.quantidade_usada}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'atividade_id': self.atividade_id,
            'material_id': self.material_id,
            'material_nome': self.material.nome if self.material else None,
            'quantidade_usada': self.quantidade_usada,
            'data_uso': self.data_uso.isoformat() if self.data_uso else None
        }

