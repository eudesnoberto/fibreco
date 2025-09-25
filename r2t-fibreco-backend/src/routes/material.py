from flask import Blueprint, jsonify, request, send_from_directory, make_response, send_file, g
from src.models.material import Material, MovimentacaoEstoque, Atividade, MaterialUsado, db
from src.routes.auth import login_required, supervisor_required, admin_required
from datetime import datetime
from src.utils.timezone import get_recife_time_utc
import os
import uuid
import requests
import tempfile
import math
import json
from werkzeug.utils import secure_filename
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

material_bp = Blueprint('material', __name__)

@material_bp.route('/materiais', methods=['GET'])
@login_required
def get_materiais():
    """Listar materiais baseado no papel do usuário"""
    from src.models.auth import User
    from flask import g
    
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    categoria = request.args.get('categoria')
    subcategoria = request.args.get('subcategoria')
    status = request.args.get('status')
    ativo = request.args.get('ativo', 'true').lower() == 'true'
    
    # Base query
    query = Material.query.filter_by(ativo=ativo)
    
    # Filtrar por usuário baseado no papel
    if user.role.value == 'user':
        # Usuários comuns veem apenas seus materiais
        query = query.filter_by(usuario_id=user.id)
    # Admins e Supervisores veem todos os materiais
    
    if categoria:
        query = query.filter_by(categoria=categoria)
    if subcategoria:
        query = query.filter_by(subcategoria=subcategoria)
    
    materiais = query.all()
    
    # Filtrar por status de estoque se especificado
    if status:
        materiais = [m for m in materiais if m.get_status_estoque() == status]
    
    return jsonify([material.to_dict() for material in materiais])

@material_bp.route('/materiais', methods=['POST'])
@login_required
@admin_required
def create_material():
    """Criar um novo material"""
    from src.models.auth import User
    from flask import g
    
    data = request.json
    
    # Validações básicas
    if not data.get('nome'):
        return jsonify({'error': 'Nome é obrigatório'}), 400
    if not data.get('categoria'):
        return jsonify({'error': 'Categoria é obrigatória'}), 400
    
    # Obter usuário atual
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Determinar o proprietário do material
    usuario_id = data.get('usuario_id')
    if user.role.value == 'user':
        # Usuários comuns só podem criar materiais para si mesmos
        usuario_id = user.id
    elif user.role.value in ['supervisor', 'admin'] and not usuario_id:
        # Supervisores e admins podem criar materiais para outros usuários
        # Se não especificado, atribuir ao usuário atual
        usuario_id = user.id
    
    material = Material(
        nome=data['nome'],
        categoria=data['categoria'],
        subcategoria=data.get('subcategoria'),
        quantidade=data.get('quantidade', 0),
        quantidade_minima=data.get('quantidade_minima', 10),
        unidade=data.get('unidade', 'unidade'),
        localizacao=data.get('localizacao'),
        fornecedor=data.get('fornecedor'),
        preco_unitario=data.get('preco_unitario'),
        codigo_interno=data.get('codigo_interno'),
        codigo_fornecedor=data.get('codigo_fornecedor'),
        descricao=data.get('descricao'),
        usuario_id=usuario_id  # Usuário proprietário do material
    )
    
    try:
        db.session.add(material)
        db.session.commit()
        
        # Registrar movimentação inicial se quantidade > 0
        if material.quantidade > 0:
            from flask import g
            movimentacao = MovimentacaoEstoque(
                material_id=material.id,
                tipo_movimentacao='entrada',
                quantidade=material.quantidade,
                quantidade_anterior=0,
                quantidade_atual=material.quantidade,
                motivo='Cadastro inicial',
                responsavel='Sistema',
                responsavel_id=g.user_id
            )
            db.session.add(movimentacao)
            db.session.commit()
        
        return jsonify(material.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@material_bp.route('/materiais/<int:material_id>', methods=['GET'])
@login_required
def get_material(material_id):
    """Obter um material específico"""
    material = Material.query.get_or_404(material_id)
    return jsonify(material.to_dict())

@material_bp.route('/materiais/<int:material_id>', methods=['PUT'])
@login_required
@supervisor_required
def update_material(material_id):
    """Atualizar um material"""
    from src.models.auth import User
    from flask import g
    
    material = Material.query.get_or_404(material_id)
    data = request.json
    
    
    # Salvar quantidade anterior para possível movimentação
    quantidade_anterior = material.quantidade
    
    # Atualizar campos
    material.nome = data.get('nome', material.nome)
    material.categoria = data.get('categoria', material.categoria)
    material.subcategoria = data.get('subcategoria', material.subcategoria)
    material.quantidade_minima = data.get('quantidade_minima', material.quantidade_minima)
    material.unidade = data.get('unidade', material.unidade)
    material.localizacao = data.get('localizacao', material.localizacao)
    material.fornecedor = data.get('fornecedor', material.fornecedor)
    material.preco_unitario = data.get('preco_unitario', material.preco_unitario)
    material.codigo_interno = data.get('codigo_interno', material.codigo_interno)
    material.codigo_fornecedor = data.get('codigo_fornecedor', material.codigo_fornecedor)
    material.descricao = data.get('descricao', material.descricao)
    material.ativo = data.get('ativo', material.ativo)
    
    # Se a quantidade foi alterada, registrar movimentação
    nova_quantidade = data.get('quantidade')
    if nova_quantidade is not None:
        # Converter para int para evitar erro de tipo
        nova_quantidade = int(nova_quantidade)
        if nova_quantidade != quantidade_anterior:
            material.quantidade = nova_quantidade
            
            # Determinar tipo de movimentação
            if nova_quantidade > quantidade_anterior:
                tipo = 'entrada'
                quantidade_mov = nova_quantidade - quantidade_anterior
            else:
                tipo = 'saida'
                quantidade_mov = quantidade_anterior - nova_quantidade
            
            movimentacao = MovimentacaoEstoque(
                material_id=material.id,
                tipo_movimentacao=tipo,
                quantidade=quantidade_mov,
                quantidade_anterior=quantidade_anterior,
                quantidade_atual=nova_quantidade,
                motivo=data.get('motivo_movimentacao', 'Ajuste manual'),
                responsavel=data.get('responsavel', 'Sistema'),
                responsavel_id=g.user_id
            )
            db.session.add(movimentacao)
    
    try:
        db.session.commit()
        return jsonify(material.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@material_bp.route('/materiais/<int:material_id>', methods=['DELETE'])
@login_required
@supervisor_required
def delete_material(material_id):
    """Excluir um material (soft delete)"""
    from src.models.auth import User
    from flask import g
    
    material = Material.query.get_or_404(material_id)
    
    
    material.ativo = False
    db.session.commit()
    return '', 204

@material_bp.route('/materiais/<int:material_id>/movimentacoes', methods=['GET'])
@login_required
def get_movimentacoes_material(material_id):
    """Obter histórico de movimentações de um material"""
    material = Material.query.get_or_404(material_id)
    movimentacoes = MovimentacaoEstoque.query.filter_by(material_id=material_id).order_by(MovimentacaoEstoque.data_movimentacao.desc()).all()
    return jsonify([mov.to_dict() for mov in movimentacoes])

@material_bp.route('/materiais/<int:material_id>/movimentacao', methods=['POST'])
@login_required
@supervisor_required
def criar_movimentacao(material_id):
    """Criar uma nova movimentação de estoque"""
    import json
    from src.models.auth import User
    
    material = Material.query.get_or_404(material_id)
    data = request.json
    
    tipo = data.get('tipo_movimentacao')
    quantidade = data.get('quantidade', 0)
    
    if not tipo or tipo not in ['entrada', 'saida']:
        return jsonify({'error': 'Tipo de movimentação inválido'}), 400
    
    if quantidade <= 0:
        return jsonify({'error': 'Quantidade deve ser maior que zero'}), 400
    
    quantidade_anterior = material.quantidade
    
    if tipo == 'entrada':
        nova_quantidade = quantidade_anterior + quantidade
    else:  # saida
        nova_quantidade = quantidade_anterior - quantidade
        if nova_quantidade < 0:
            return jsonify({'error': 'Quantidade insuficiente em estoque'}), 400
    
    # Atualizar quantidade do material
    material.quantidade = nova_quantidade
    
    # Processar imagens se fornecidas
    imagens_json = None
    if data.get('imagens'):
        imagens_json = json.dumps(data['imagens'])
    
    # Criar movimentação
    movimentacao = MovimentacaoEstoque(
        material_id=material_id,
        tipo_movimentacao=tipo,
        quantidade=quantidade,
        quantidade_anterior=quantidade_anterior,
        quantidade_atual=nova_quantidade,
        motivo=data.get('motivo', ''),
        responsavel=data.get('responsavel', 'Sistema'),
        responsavel_id=data.get('responsavel_id'),
        imagens=imagens_json
    )
    
    try:
        db.session.add(movimentacao)
        db.session.commit()
        return jsonify(movimentacao.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@material_bp.route('/categorias', methods=['GET'])
@login_required
def get_categorias():
    """Obter lista de categorias disponíveis"""
    categorias = db.session.query(Material.categoria).distinct().filter_by(ativo=True).all()
    return jsonify([cat[0] for cat in categorias if cat[0]])

@material_bp.route('/subcategorias', methods=['GET'])
@login_required
def get_subcategorias():
    """Obter lista de subcategorias disponíveis"""
    categoria = request.args.get('categoria')
    query = db.session.query(Material.subcategoria).distinct().filter_by(ativo=True)
    
    if categoria:
        query = query.filter_by(categoria=categoria)
    
    subcategorias = query.all()
    return jsonify([subcat[0] for subcat in subcategorias if subcat[0]])

@material_bp.route('/usuarios', methods=['GET'])
@login_required
def get_usuarios():
    """Obter lista de usuários para seleção de responsável"""
    from src.models.auth import User
    usuarios = User.query.filter_by(ativo=True).all()
    return jsonify([{
        'id': user.id,
        'nome': user.nome_completo,
        'email': user.email,
        'username': user.username,
        'role': user.role.value
    } for user in usuarios])

@material_bp.route('/upload', methods=['POST'])
@login_required
def upload_image():
    """Upload de imagem para movimentação"""
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    # Verificar se é uma imagem
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    if not ('.' in file.filename and 
            file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
    
    # Gerar nome único para o arquivo
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    
    # Criar diretório se não existir
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Salvar arquivo
    file_path = os.path.join(upload_dir, unique_filename)
    file.save(file_path)
    
    return jsonify({
        'filename': unique_filename,
        'url': f'/api/uploads/{unique_filename}'
    })

@material_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    """Servir arquivos de upload"""
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    return send_from_directory(upload_dir, filename)

@material_bp.route('/movimentacoes/<int:movimentacao_id>/pdf', methods=['GET'])
@login_required
def gerar_pdf_movimentacao(movimentacao_id):
    """Gerar PDF da movimentação"""
    movimentacao = MovimentacaoEstoque.query.get_or_404(movimentacao_id)
    
    # Criar buffer para o PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=25,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading3'],
        fontSize=16,
        spaceAfter=15,
        textColor=colors.darkblue
    )
    
    # Conteúdo do PDF
    story = []
    
    # Logo e Título
    try:
        logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'logo-r2-3.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=2*inch, height=1*inch)
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 10))
    except Exception as e:
        print(f"Erro ao carregar logo: {e}")
    
    story.append(Paragraph("R2 Telecomunicações", title_style))
    story.append(Paragraph("Controle de Materiais - Fibreco", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Informações da movimentação
    story.append(Paragraph("Dados da Movimentação", heading_style))
    
    # Obter nome do responsável
    responsavel_nome = movimentacao.responsavel
    if movimentacao.responsavel_id:
        from src.models.auth import User
        user = User.query.get(movimentacao.responsavel_id)
        if user:
            responsavel_nome = user.nome_completo
        else:
            # Se o usuário não for encontrado, usar o nome do campo responsavel
            responsavel_nome = movimentacao.responsavel or 'Usuário não encontrado'
    else:
        # Se não há responsavel_id, usar o campo responsavel
        responsavel_nome = movimentacao.responsavel or 'Sistema'
    
    # Tabela de informações
    data = [
        ['Material:', movimentacao.material.nome if movimentacao.material else 'N/A'],
        ['Tipo:', movimentacao.tipo_movimentacao.title()],
        ['Quantidade:', str(movimentacao.quantidade)],
        ['Estoque Anterior:', str(movimentacao.quantidade_anterior)],
        ['Estoque Atual:', str(movimentacao.quantidade_atual)],
        ['Data:', movimentacao.data_movimentacao.strftime('%d/%m/%Y %H:%M') if movimentacao.data_movimentacao else 'N/A'],
        ['Responsável:', responsavel_nome or 'N/A'],
        ['Motivo:', movimentacao.motivo or 'N/A']
    ]
    
    table = Table(data, colWidths=[2.5*inch, 5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    story.append(Spacer(1, 20))
    
    # Imagens
    if movimentacao.imagens:
        import json
        imagens = json.loads(movimentacao.imagens) if isinstance(movimentacao.imagens, str) else movimentacao.imagens
        
        if imagens:
            story.append(Paragraph("Imagens Anexadas", heading_style))
            
            # Preparar imagens para o PDF
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
            
            for i, url in enumerate(imagens[:6]):  # Máximo 6 imagens por página
                try:
                    # Extrair nome do arquivo da URL
                    filename = url.split('/')[-1]
                    image_path = os.path.join(upload_dir, filename)
                    
                    if os.path.exists(image_path):
                        # Redimensionar imagem para caber no PDF (maior)
                        img = Image(image_path, width=3.5*inch, height=2.5*inch)
                        story.append(img)
                        story.append(Spacer(1, 15))
                        
                        if (i + 1) % 2 == 0:  # Quebrar linha a cada 2 imagens
                            story.append(Spacer(1, 15))
                except Exception as e:
                    print(f"Erro ao processar imagem {url}: {e}")
                    continue
    
    # Rodapé
    story.append(Spacer(1, 30))
    story.append(Paragraph(f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                          ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)))
    
    # Construir PDF
    doc.build(story)
    
    # Preparar resposta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=movimentacao_{movimentacao_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    
    return response

# ==================== ROTAS DE ATIVIDADES ====================

@material_bp.route('/atividades', methods=['GET'])
@login_required
def get_atividades():
    """Listar atividades baseado no papel do usuário"""
    from src.models.auth import User
    from flask import g
    
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    status = request.args.get('status')
    
    # Base query
    if user.role.value == 'admin':
        # Admins veem todas as atividades
        query = Atividade.query
    elif user.role.value == 'supervisor':
        # Supervisores veem atividades que criaram
        query = Atividade.query.filter_by(supervisor_id=user.id)
    else:
        # Usuários comuns veem atividades atribuídas a eles
        query = Atividade.query.filter_by(usuario_id=user.id)
    
    if status:
        query = query.filter_by(status=status)
    
    atividades = query.order_by(Atividade.data_criacao.desc()).all()
    return jsonify([atividade.to_dict() for atividade in atividades])

@material_bp.route('/atividades/<int:atividade_id>', methods=['GET'])
@login_required
def get_atividade(atividade_id):
    """Obter uma atividade específica"""
    from src.models.auth import User
    from flask import g
    
    user = User.query.get(g.user_id)
    atividade = Atividade.query.get_or_404(atividade_id)
    
    # Verificar se o usuário pode acessar esta atividade
    if user.role.value == 'admin':
        pass  # Admins podem ver todas as atividades
    elif user.role.value == 'supervisor':
        if atividade.supervisor_id != user.id:
            return jsonify({'error': 'Acesso negado'}), 403
    else:
        if atividade.usuario_id != user.id:
            return jsonify({'error': 'Acesso negado'}), 403
    
    return jsonify(atividade.to_dict())

@material_bp.route('/atividades', methods=['POST'])
@login_required
@supervisor_required
def create_atividade():
    """Criar nova atividade (apenas supervisores)"""
    from src.models.auth import User
    from flask import g
    
    data = request.json
    
    # Validações
    if not data.get('titulo'):
        return jsonify({'error': 'Título é obrigatório'}), 400
    if not data.get('usuario_id'):
        return jsonify({'error': 'Usuário responsável é obrigatório'}), 400
    
    # Verificar se o usuário existe e é um usuário comum
    usuario = User.query.get(data['usuario_id'])
    if not usuario or usuario.role.value != 'user':
        return jsonify({'error': 'Usuário inválido ou não é um usuário comum'}), 400
    
    # Verificar material apenas se fornecido
    material = None
    if data.get('material_id'):
        material = Material.query.get(data['material_id'])
        if not material:
            return jsonify({'error': 'Material não encontrado'}), 404
        
        # Verificar se há estoque suficiente apenas se quantidade for fornecida
        if data.get('quantidade_necessaria') and material.quantidade < data['quantidade_necessaria']:
            return jsonify({'error': 'Estoque insuficiente'}), 400
    
    atividade = Atividade(
        titulo=data['titulo'],
        descricao=data.get('descricao'),
        usuario_id=data['usuario_id'],
        supervisor_id=g.user_id,
        material_id=data.get('material_id'),  # Opcional
        quantidade_necessaria=data.get('quantidade_necessaria', 0),  # Opcional, padrão 0
        data_limite=datetime.fromisoformat(data['data_limite']) if data.get('data_limite') else None,
        observacoes=data.get('observacoes')
    )
    
    try:
        db.session.add(atividade)
        db.session.commit()
        
        # Enviar notificação para o usuário atribuído
        from src.routes.notifications import notify_activity_assigned
        notify_activity_assigned(atividade)
        
        return jsonify(atividade.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_bp.route('/atividades/<int:atividade_id>/concluir', methods=['POST'])
@login_required
def concluir_atividade(atividade_id):
    """Concluir atividade (usuário responsável)"""
    from src.models.auth import User
    from src.models.material import MaterialUsado
    from flask import g
    import json
    
    user = User.query.get(g.user_id)
    atividade = Atividade.query.get_or_404(atividade_id)
    data = request.json or {}
    
    # Verificar se o usuário pode concluir esta atividade
    if user.role.value == 'user' and atividade.usuario_id != user.id:
        return jsonify({'error': 'Você não pode concluir esta atividade'}), 403
    elif user.role.value not in ['admin', 'supervisor'] and atividade.usuario_id != user.id:
        return jsonify({'error': 'Acesso negado'}), 403
    
    if atividade.status != 'pendente':
        return jsonify({'error': 'Atividade já foi processada'}), 400
    
    # Atualizar status da atividade
    atividade.status = 'concluida'
    atividade.data_conclusao = get_recife_time_utc()
    
    # Atualizar campos de conclusão
    atividade.descricao_servico = data.get('descricao_servico', '')
    if data.get('imagens_conclusao'):
        atividade.imagens_conclusao = json.dumps(data['imagens_conclusao'])
    
    # Atualizar campos de geolocalização
    atividade.latitude = data.get('latitude')
    atividade.longitude = data.get('longitude')
    atividade.endereco = data.get('endereco', '')
    
    # Processar materiais usados
    materiais_usados = data.get('materiais_usados', [])
    movimentacoes_criadas = []
    
    for material_data in materiais_usados:
        material_id = material_data.get('material_id')
        quantidade_usada = material_data.get('quantidade_usada', 0)
        
        if not material_id or quantidade_usada <= 0:
            continue
            
        # Buscar o material
        material = Material.query.get(material_id)
        if not material:
            return jsonify({'error': f'Material ID {material_id} não encontrado'}), 404
        
        # Verificar se há estoque suficiente
        if material.quantidade < quantidade_usada:
            return jsonify({'error': f'Estoque insuficiente de {material.nome}. Disponível: {material.quantidade}, Necessário: {quantidade_usada}'}), 400
        
        # Salvar quantidade anterior para a movimentação
        quantidade_anterior = material.quantidade
        quantidade_atual = quantidade_anterior - quantidade_usada
        
        # Criar movimentação de saída
        movimentacao = MovimentacaoEstoque(
            material_id=material_id,
            tipo_movimentacao='saida',
            quantidade=quantidade_usada,
            quantidade_anterior=quantidade_anterior,
            quantidade_atual=quantidade_atual,
            motivo=f'Atividade concluída: {atividade.titulo}',
            responsavel=user.nome_completo,
            responsavel_id=user.id
        )
        
        # Criar registro de material usado
        material_usado = MaterialUsado(
            atividade_id=atividade_id,
            material_id=material_id,
            quantidade_usada=quantidade_usada
        )
        
        # Atualizar estoque do material
        material.quantidade = quantidade_atual
        
        # Adicionar ao session
        db.session.add(movimentacao)
        db.session.add(material_usado)
        movimentacoes_criadas.append(movimentacao)
    
    try:
        db.session.commit()
        
        response_data = {
            'message': 'Atividade concluída com sucesso',
            'atividade': atividade.to_dict(),
            'materiais_usados': len(materiais_usados),
            'movimentacoes': [mov.to_dict() for mov in movimentacoes_criadas]
        }
        
        if movimentacoes_criadas:
            materiais_nomes = [mov.material.nome for mov in movimentacoes_criadas]
            response_data['message'] += f'. Materiais retirados do estoque: {", ".join(materiais_nomes)}.'
        else:
            response_data['message'] += ' Nenhum material foi retirado do estoque.'
        
        return jsonify(response_data)
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_bp.route('/atividades/<int:atividade_id>', methods=['PUT'])
@login_required
@supervisor_required
def update_atividade(atividade_id):
    """Atualizar atividade (apenas supervisores)"""
    from flask import g
    
    atividade = Atividade.query.get_or_404(atividade_id)
    
    # Verificar se o supervisor pode editar esta atividade
    if atividade.supervisor_id != g.user_id:
        return jsonify({'error': 'Você não pode editar esta atividade'}), 403
    
    if atividade.status != 'pendente':
        return jsonify({'error': 'Apenas atividades pendentes podem ser editadas'}), 400
    
    data = request.json
    
    if 'titulo' in data:
        atividade.titulo = data['titulo']
    if 'descricao' in data:
        atividade.descricao = data['descricao']
    if 'quantidade_necessaria' in data:
        atividade.quantidade_necessaria = data['quantidade_necessaria']
    if 'data_limite' in data:
        atividade.data_limite = datetime.fromisoformat(data['data_limite']) if data['data_limite'] else None
    if 'observacoes' in data:
        atividade.observacoes = data['observacoes']
    
    try:
        db.session.commit()
        
        # Enviar notificação para admins e supervisores
        from src.routes.notifications import notify_activity_completed
        notify_activity_completed(atividade)
        
        return jsonify(atividade.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_bp.route('/atividades/<int:atividade_id>', methods=['DELETE'])
@login_required
@supervisor_required
def delete_atividade(atividade_id):
    """Deletar atividade (apenas supervisores)"""
    from flask import g
    
    atividade = Atividade.query.get_or_404(atividade_id)
    
    # Verificar se o supervisor pode deletar esta atividade
    if atividade.supervisor_id != g.user_id:
        return jsonify({'error': 'Você não pode deletar esta atividade'}), 403
    
    if atividade.status != 'pendente':
        return jsonify({'error': 'Apenas atividades pendentes podem ser deletadas'}), 400
    
    try:
        db.session.delete(atividade)
        db.session.commit()
        return jsonify({'message': 'Atividade deletada com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@material_bp.route('/relatorios/mensal', methods=['GET'])
@login_required
def relatorio_mensal():
    """Gerar relatório mensal para admins"""
    from src.models.auth import User
    from src.models.material import Material, MovimentacaoEstoque, Atividade, MaterialUsado
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    import io
    from datetime import datetime, timedelta
    from flask import make_response, g
    import json
    
    # Verificar se é admin
    user = User.query.get(g.user_id)
    if user.role.value != 'admin':
        return jsonify({'error': 'Acesso negado. Apenas administradores podem acessar relatórios mensais.'}), 403
    
    # Obter parâmetros da query
    mes = request.args.get('mes', datetime.now().month)
    ano = request.args.get('ano', datetime.now().year)
    
    try:
        mes = int(mes)
        ano = int(ano)
    except ValueError:
        return jsonify({'error': 'Mês e ano devem ser números válidos'}), 400
    
    # Definir período
    data_inicio = datetime(ano, mes, 1)
    if mes == 12:
        data_fim = datetime(ano + 1, 1, 1) - timedelta(days=1)
    else:
        data_fim = datetime(ano, mes + 1, 1) - timedelta(days=1)
    
    # Coletar dados
    # Atividades do mês
    atividades_mes = Atividade.query.filter(
        Atividade.data_criacao >= data_inicio,
        Atividade.data_criacao <= data_fim
    ).all()
    
    # Atividades concluídas
    atividades_concluidas = [a for a in atividades_mes if a.status == 'concluida']
    
    # Movimentações de estoque
    movimentacoes_mes = MovimentacaoEstoque.query.filter(
        MovimentacaoEstoque.data_movimentacao >= data_inicio,
        MovimentacaoEstoque.data_movimentacao <= data_fim
    ).all()
    
    # Materiais mais usados
    materiais_usados = MaterialUsado.query.join(Atividade).filter(
        Atividade.data_conclusao >= data_inicio,
        Atividade.data_conclusao <= data_fim
    ).all()
    
    # Estatísticas por usuário
    usuarios_stats = {}
    for atividade in atividades_mes:
        if atividade.usuario_id not in usuarios_stats:
            usuarios_stats[atividade.usuario_id] = {
                'nome': atividade.usuario.nome_completo if atividade.usuario else 'N/A',
                'total_atividades': 0,
                'atividades_concluidas': 0,
                'atividades_pendentes': 0
            }
        usuarios_stats[atividade.usuario_id]['total_atividades'] += 1
        if atividade.status == 'concluida':
            usuarios_stats[atividade.usuario_id]['atividades_concluidas'] += 1
        elif atividade.status == 'pendente':
            usuarios_stats[atividade.usuario_id]['atividades_pendentes'] += 1
    
    # Criar PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=15,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    story = []
    
    # Logo e Título
    try:
        logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'logo-r2-3.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=2*inch, height=1*inch)
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 10))
    except Exception as e:
        print(f"Erro ao carregar logo: {e}")
    
    story.append(Paragraph("R2 Telecomunicações", title_style))
    story.append(Paragraph(f"Relatório Mensal - {mes:02d}/{ano}", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Resumo Executivo
    story.append(Paragraph("Resumo Executivo", heading_style))
    
    resumo_data = [
        ['Período:', f"{mes:02d}/{ano}"],
        ['Total de Atividades:', str(len(atividades_mes))],
        ['Atividades Concluídas:', str(len(atividades_concluidas))],
        ['Taxa de Conclusão:', f"{(len(atividades_concluidas)/len(atividades_mes)*100):.1f}%" if atividades_mes else "0%"],
        ['Movimentações de Estoque:', str(len(movimentacoes_mes))],
        ['Usuários Ativos:', str(len(usuarios_stats))]
    ]
    
    resumo_table = Table(resumo_data, colWidths=[2.5*inch, 3.5*inch])
    resumo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(resumo_table)
    story.append(Spacer(1, 20))
    
    # Estatísticas por Usuário
    if usuarios_stats:
        story.append(Paragraph("Performance por Usuário", heading_style))
        
        user_data = [['Usuário', 'Total', 'Concluídas', 'Pendentes', 'Taxa Conclusão']]
        for user_id, stats in usuarios_stats.items():
            taxa = (stats['atividades_concluidas'] / stats['total_atividades'] * 100) if stats['total_atividades'] > 0 else 0
            user_data.append([
                stats['nome'],
                str(stats['total_atividades']),
                str(stats['atividades_concluidas']),
                str(stats['atividades_pendentes']),
                f"{taxa:.1f}%"
            ])
        
        user_table = Table(user_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
        user_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(user_table)
        story.append(Spacer(1, 20))
    
    # Materiais Mais Usados
    if materiais_usados:
        story.append(Paragraph("Materiais Mais Utilizados", heading_style))
        
        # Contar uso de materiais
        material_count = {}
        for material_usado in materiais_usados:
            material_id = material_usado.material_id
            if material_id not in material_count:
                material_count[material_id] = {
                    'nome': material_usado.material.nome if material_usado.material else 'N/A',
                    'quantidade': 0
                }
            material_count[material_id]['quantidade'] += material_usado.quantidade_usada
        
        # Ordenar por quantidade
        sorted_materials = sorted(material_count.items(), key=lambda x: x[1]['quantidade'], reverse=True)
        
        material_data = [['Material', 'Quantidade Usada']]
        for material_id, data in sorted_materials[:10]:  # Top 10
            material_data.append([data['nome'], str(data['quantidade'])])
        
        material_table = Table(material_data, colWidths=[4*inch, 2*inch])
        material_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(material_table)
        story.append(Spacer(1, 20))
    
    # Movimentações de Estoque
    if movimentacoes_mes:
        story.append(Paragraph("Movimentações de Estoque", heading_style))
        
        mov_data = [['Data', 'Material', 'Tipo', 'Quantidade', 'Responsável']]
        for mov in movimentacoes_mes[-20:]:  # Últimas 20 movimentações
            mov_data.append([
                mov.data_movimentacao.strftime('%d/%m/%Y') if mov.data_movimentacao else 'N/A',
                mov.material.nome if mov.material else 'N/A',
                mov.tipo_movimentacao.title(),
                str(mov.quantidade),
                mov.responsavel or 'Sistema'
            ])
        
        mov_table = Table(mov_data, colWidths=[1*inch, 2*inch, 1*inch, 1*inch, 1.5*inch])
        mov_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkorange),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(mov_table)
        story.append(Spacer(1, 20))
    
    # Rodapé
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                          ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)))
    
    # Construir PDF
    doc.build(story)
    
    # Preparar resposta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=relatorio_mensal_{mes:02d}_{ano}.pdf'
    
    return response

@material_bp.route('/atividades/<int:atividade_id>/pdf', methods=['GET'])
@login_required
def gerar_pdf_atividade(atividade_id):
    """Gerar PDF da atividade concluída"""
    from src.models.material import MaterialUsado
    import json
    
    atividade = Atividade.query.get_or_404(atividade_id)
    
    # Verificar se a atividade está concluída
    if atividade.status != 'concluida':
        return jsonify({'error': 'Apenas atividades concluídas podem gerar PDF'}), 400
    
    # Criar buffer para o PDF com margens otimizadas para A4
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    # Estilos otimizados para A4
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=18,
        alignment=TA_CENTER,
        textColor=colors.darkblue
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    # Conteúdo do PDF
    story = []
    
    # Logo e Título
    try:
        logo_path = os.path.join(os.path.dirname(__file__), '..', '..', 'logo-r2-3.png')
        if os.path.exists(logo_path):
            logo = Image(logo_path, width=2*inch, height=1*inch)
            logo.hAlign = 'CENTER'
            story.append(logo)
            story.append(Spacer(1, 10))
    except Exception as e:
        print(f"Erro ao carregar logo: {e}")
    
    story.append(Paragraph("R2 Telecomunicações", title_style))
    story.append(Paragraph("Relatório de Atividade Concluída", subtitle_style))
    story.append(Spacer(1, 15))
    
    # Informações da atividade
    story.append(Paragraph("Dados da Atividade", heading_style))
    
    # Tabela de informações otimizada para A4
    data = [
        ['Título:', atividade.titulo],
        ['Descrição:', atividade.descricao or 'N/A'],
        ['Usuário Responsável:', atividade.usuario.nome_completo if atividade.usuario else 'N/A'],
        ['Supervisor:', atividade.supervisor.nome_completo if atividade.supervisor else 'N/A'],
        ['Data de Criação:', atividade.data_criacao.strftime('%d/%m/%Y %H:%M') if atividade.data_criacao else 'N/A'],
        ['Data de Conclusão:', atividade.data_conclusao.strftime('%d/%m/%Y %H:%M') if atividade.data_conclusao else 'N/A'],
        ['Status:', atividade.status.title()]
    ]
    
    table = Table(data, colWidths=[2.2*inch, 4.8*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (1, 0), (1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    story.append(Spacer(1, 15))
    
    # Descrição do serviço realizado
    if atividade.descricao_servico:
        story.append(Paragraph("Descrição do Serviço Realizado", heading_style))
        story.append(Paragraph(atividade.descricao_servico, styles['Normal']))
        story.append(Spacer(1, 15))
    
    # Geolocalização
    if atividade.latitude and atividade.longitude:
        story.append(Paragraph("Localização do Serviço", heading_style))
        
        # Criar tabela de geolocalização
        geo_data = []
        if atividade.endereco:
            geo_data.append(['Endereço:', atividade.endereco])
        geo_data.append(['Latitude:', f"{atividade.latitude:.6f}"])
        geo_data.append(['Longitude:', f"{atividade.longitude:.6f}"])
        
        # Adicionar link do Google Maps
        maps_url = f"https://www.google.com/maps?q={atividade.latitude},{atividade.longitude}"
        geo_data.append(['Google Maps:', maps_url])
        
        geo_table = Table(geo_data, colWidths=[2.2*inch, 4.8*inch])
        geo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (1, 0), (1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(geo_table)
        story.append(Spacer(1, 15))
    
    # Materiais usados
    materiais_usados = MaterialUsado.query.filter_by(atividade_id=atividade_id).all()
    if materiais_usados:
        story.append(Paragraph("Materiais Utilizados", heading_style))
        
        # Tabela de materiais
        material_data = [['Material', 'Quantidade Usada', 'Unidade']]
        for material_usado in materiais_usados:
            material_data.append([
                material_usado.material.nome if material_usado.material else 'N/A',
                str(material_usado.quantidade_usada),
                material_usado.material.unidade if material_usado.material else 'N/A'
            ])
        
        # Tabela de materiais otimizada para A4
        material_table = Table(material_data, colWidths=[3.5*inch, 1.5*inch, 1.5*inch])
        material_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(material_table)
        story.append(Spacer(1, 15))
        
        # Quebra de página após materiais
        story.append(PageBreak())
    
    # Imagens da conclusão
    if atividade.imagens_conclusao:
        imagens = json.loads(atividade.imagens_conclusao) if isinstance(atividade.imagens_conclusao, str) else atividade.imagens_conclusao
        
        if imagens:
            story.append(Paragraph("Imagens da Conclusão", heading_style))
            story.append(Paragraph(f"Total de imagens: {len(imagens)}", styles['Normal']))
            story.append(Spacer(1, 12))
            
            # Preparar imagens para o PDF
            upload_dir = os.path.join(os.getcwd(), 'uploads')
            
            # Processar imagens em pares (duas por linha)
            imagens_processadas = 0
            imagens_validas = []
            
            # Primeiro, coletar todas as imagens válidas
            for i, url in enumerate(imagens):
                try:
                    filename = url.split('/')[-1]
                    image_path = os.path.join(upload_dir, filename)
                    
                    if os.path.exists(image_path):
                        imagens_validas.append({
                            'index': i + 1,
                            'filename': filename,
                            'path': image_path
                        })
                    else:
                        print(f"Arquivo de imagem não encontrado: {image_path}")
                except Exception as e:
                    print(f"Erro ao processar imagem {url}: {e}")
                    continue
            
            # Agora organizar em pares (duas por linha)
            for i in range(0, len(imagens_validas), 2):
                # Criar linha com até 2 imagens
                linha_imagens = imagens_validas[i:i+2]
                
                # Criar tabela para organizar as imagens lado a lado
                if len(linha_imagens) == 2:
                    # Duas imagens na mesma linha
                    img1 = linha_imagens[0]
                    img2 = linha_imagens[1]
                    
                    try:
                        # Criar imagens redimensionadas para A4
                        img_obj1 = Image(img1['path'], width=2.6*inch, height=1.95*inch)
                        img_obj2 = Image(img2['path'], width=2.6*inch, height=1.95*inch)
                        
                        # Tabela com duas colunas otimizada para A4
                        img_table_data = [
                            [f"Imagem {img1['index']}: {img1['filename']}", f"Imagem {img2['index']}: {img2['filename']}"],
                            [img_obj1, img_obj2]
                        ]
                        
                        img_table = Table(img_table_data, colWidths=[2.8*inch, 2.8*inch])
                        img_table.setStyle(TableStyle([
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 8),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.grey),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
                            ('TOPPADDING', (0, 0), (-1, 0), 4),
                            ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
                            ('TOPPADDING', (0, 1), (-1, 1), 4),
                            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ]))
                        
                        story.append(img_table)
                        story.append(Spacer(1, 12))
                        imagens_processadas += 2
                        
                    except Exception as e:
                        print(f"Erro ao criar tabela de imagens: {e}")
                        # Fallback: adicionar imagens individualmente
                        for img in linha_imagens:
                            try:
                                story.append(Paragraph(f"Imagem {img['index']}: {img['filename']}", 
                                                      ParagraphStyle('ImageTitle', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))
                                img_obj = Image(img['path'], width=2.8*inch, height=2.1*inch)
                                story.append(img_obj)
                                story.append(Spacer(1, 8))
                                imagens_processadas += 1
                            except Exception as e2:
                                print(f"Erro ao processar imagem {img['filename']}: {e2}")
                                continue
                
                else:
                    # Uma imagem sozinha (última linha ímpar)
                    img = linha_imagens[0]
                    try:
                        story.append(Paragraph(f"Imagem {img['index']}: {img['filename']}", 
                                              ParagraphStyle('ImageTitle', parent=styles['Normal'], fontSize=8, textColor=colors.grey)))
                        img_obj = Image(img['path'], width=2.8*inch, height=2.1*inch)
                        story.append(img_obj)
                        story.append(Spacer(1, 12))
                        imagens_processadas += 1
                    except Exception as e:
                        print(f"Erro ao processar imagem {img['filename']}: {e}")
                        continue
                
                # Quebrar página a cada 6 imagens (3 linhas) para melhor aproveitamento do A4
                if imagens_processadas % 6 == 0 and i + 2 < len(imagens_validas):
                    story.append(PageBreak())
            
            if imagens_processadas == 0:
                story.append(Paragraph("Nenhuma imagem pôde ser carregada.", 
                                      ParagraphStyle('Warning', parent=styles['Normal'], fontSize=10, textColor=colors.orange)))
            else:
                # Adicionar seção "Informações das Imagens" após todas as imagens
                story.append(Spacer(1, 15))
                story.append(Paragraph("Informações das Imagens", 
                                      ParagraphStyle('LinksTitle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, textColor=colors.darkblue)))
                story.append(Spacer(1, 10))
                
                # Criar lista de informações das imagens
                for img in imagens_validas:
                    # Limpar o nome do arquivo
                    clean_filename = img['filename'].split('/')[-1] if '/' in img['filename'] else img['filename']
                    clean_filename = clean_filename.split('\\')[-1] if '\\' in clean_filename else clean_filename
                    
                    # Criar texto informativo
                    info_text = f"<b>Imagem {img['index']}</b>: {clean_filename}"
                    
                    # Adicionar como parágrafo
                    story.append(Paragraph(info_text, 
                                          ParagraphStyle('ImageInfo', parent=styles['Normal'], fontSize=9, textColor=colors.black, leftIndent=20)))
                    story.append(Spacer(1, 5))
                
                # Adicionar nota sobre as imagens
                story.append(Spacer(1, 10))
                story.append(Paragraph("<b>Nota:</b> As imagens acima estão incluídas no PDF. Para visualizar em tamanho maior, use um visualizador de PDF que suporte zoom ou extraia as imagens do documento.", 
                                      ParagraphStyle('Note', parent=styles['Normal'], fontSize=8, textColor=colors.grey, leftIndent=20, rightIndent=20)))
    
    # Rodapé otimizado para A4
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                          ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)))
    
    # Construir PDF
    doc.build(story)
    
    # Preparar resposta
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename=atividade_{atividade_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    
    return response

@material_bp.route('/atividades/<int:atividade_id>/imagens', methods=['GET'])
@login_required
def visualizar_imagens_atividade(atividade_id):
    """Visualizar imagens de uma atividade em uma página web"""
    atividade = Atividade.query.get_or_404(atividade_id)
    
    # Verificar se o usuário tem acesso à atividade
    if request.current_user.role.value == 'user' and atividade.usuario_id != request.current_user.id:
        return jsonify({'error': 'Acesso negado'}), 403
    
    if not atividade.imagens_conclusao:
        return jsonify({'error': 'Nenhuma imagem encontrada para esta atividade'}), 404
    
    # Processar imagens
    imagens = json.loads(atividade.imagens_conclusao) if isinstance(atividade.imagens_conclusao, str) else atividade.imagens_conclusao
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    
    imagens_info = []
    for i, url in enumerate(imagens):
        try:
            filename = url.split('/')[-1]
            image_path = os.path.join(upload_dir, filename)
            
            if os.path.exists(image_path):
                imagens_info.append({
                    'index': i + 1,
                    'filename': filename,
                    'url': f'/api/uploads/{filename}',
                    'path': image_path
                })
        except Exception as e:
            print(f"Erro ao processar imagem {url}: {e}")
            continue
    
    # Gerar HTML para visualização
    html_content = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Imagens da Atividade - {atividade.titulo}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e0e0e0;
            }}
            .header h1 {{
                color: #2c3e50;
                margin: 0;
            }}
            .header p {{
                color: #7f8c8d;
                margin: 10px 0 0 0;
            }}
            .images-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }}
            .image-card {{
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .image-card img {{
                width: 100%;
                height: 200px;
                object-fit: cover;
                cursor: pointer;
                transition: transform 0.3s ease;
            }}
            .image-card img:hover {{
                transform: scale(1.05);
            }}
            .image-info {{
                padding: 15px;
            }}
            .image-info h3 {{
                margin: 0 0 10px 0;
                color: #2c3e50;
                font-size: 16px;
            }}
            .image-info p {{
                margin: 0 0 10px 0;
                color: #7f8c8d;
                font-size: 14px;
            }}
            .download-btn {{
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                font-size: 14px;
                transition: background 0.3s ease;
            }}
            .download-btn:hover {{
                background: #2980b9;
            }}
            .back-btn {{
                background: #95a5a6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin-bottom: 20px;
            }}
            .back-btn:hover {{
                background: #7f8c8d;
            }}
            .modal {{
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.9);
            }}
            .modal-content {{
                margin: auto;
                display: block;
                max-width: 90%;
                max-height: 90%;
                margin-top: 5%;
            }}
            .close {{
                position: absolute;
                top: 15px;
                right: 35px;
                color: #f1f1f1;
                font-size: 40px;
                font-weight: bold;
                cursor: pointer;
            }}
            .close:hover {{
                color: #bbb;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <a href="javascript:history.back()" class="back-btn">← Voltar</a>
            
            <div class="header">
                <h1>Imagens da Atividade</h1>
                <p><strong>Título:</strong> {atividade.titulo}</p>
                <p><strong>Data:</strong> {atividade.data_criacao.strftime('%d/%m/%Y %H:%M')}</p>
                <p><strong>Total de Imagens:</strong> {len(imagens_info)}</p>
            </div>
            
            <div class="images-grid">
    """
    
    for img in imagens_info:
        html_content += f"""
                <div class="image-card">
                    <img src="{img['url']}" alt="Imagem {img['index']}" onclick="openModal(this)">
                    <div class="image-info">
                        <h3>Imagem {img['index']}</h3>
                        <p><strong>Arquivo:</strong> {img['filename']}</p>
                        <a href="{img['url']}" download="{img['filename']}" class="download-btn">📥 Download</a>
                    </div>
                </div>
        """
    
    html_content += """
            </div>
        </div>
        
        <!-- Modal para visualização em tamanho grande -->
        <div id="imageModal" class="modal">
            <span class="close" onclick="closeModal()">&times;</span>
            <img class="modal-content" id="modalImage">
        </div>
        
        <script>
            function openModal(img) {
                const modal = document.getElementById('imageModal');
                const modalImg = document.getElementById('modalImage');
                modal.style.display = 'block';
                modalImg.src = img.src;
            }
            
            function closeModal() {
                document.getElementById('imageModal').style.display = 'none';
            }
            
            // Fechar modal clicando fora da imagem
            window.onclick = function(event) {
                const modal = document.getElementById('imageModal');
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
    """
    
    return html_content

@material_bp.route('/uploads/<filename>')
@login_required
def serve_uploaded_file(filename):
    """Servir arquivos de upload"""
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    file_path = os.path.join(upload_dir, filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'Arquivo não encontrado'}), 404
    
    return send_file(file_path)

@material_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    """Obter dados para dashboard baseado no papel do usuário"""
    from src.models.auth import User
    from flask import g
    
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Base query para materiais
    materiais_query = Material.query.filter_by(ativo=True)
    
    # Filtrar por usuário baseado no papel
    if user.role.value == 'user':
        # Usuários comuns veem apenas seus materiais
        materiais_query = materiais_query.filter_by(usuario_id=user.id)
    # Admins e Supervisores veem todos os materiais
    
    # Estatísticas de materiais
    total_materiais = materiais_query.count()
    materiais_sem_estoque = materiais_query.filter(Material.quantidade <= 0).count()
    materiais_estoque_baixo = materiais_query.filter(
        Material.quantidade > 0, 
        Material.quantidade <= Material.quantidade_minima
    ).count()
    
    # Últimas movimentações
    if user.role.value == 'user':
        # Usuários comuns veem apenas movimentações de seus materiais
        ultimas_movimentacoes = MovimentacaoEstoque.query.join(Material).filter(
            Material.usuario_id == user.id
        ).order_by(
            MovimentacaoEstoque.data_movimentacao.desc()
        ).limit(10).all()
    else:
        # Admins e Supervisores veem todas as movimentações
        ultimas_movimentacoes = MovimentacaoEstoque.query.order_by(
            MovimentacaoEstoque.data_movimentacao.desc()
        ).limit(10).all()
    
    # Materiais por categoria
    categorias_count = db.session.query(
        Material.categoria, 
        db.func.count(Material.id)
    ).filter_by(ativo=True)
    
    # Filtrar categorias por usuário se necessário
    if user.role.value == 'user':
        categorias_count = categorias_count.filter_by(usuario_id=user.id)
    
    categorias_count = categorias_count.group_by(Material.categoria).all()
    
    return jsonify({
        'total_materiais': total_materiais,
        'materiais_sem_estoque': materiais_sem_estoque,
        'materiais_estoque_baixo': materiais_estoque_baixo,
        'ultimas_movimentacoes': [mov.to_dict() for mov in ultimas_movimentacoes],
        'materiais_por_categoria': [{'categoria': cat, 'count': count} for cat, count in categorias_count]
    })

@material_bp.route('/dashboard/graficos', methods=['GET'])
@login_required
def get_dashboard_graficos():
    """Obter dados para gráficos do dashboard baseado no papel do usuário"""
    from src.models.auth import User
    from flask import g
    from datetime import datetime, timedelta
    import calendar
    
    user = User.query.get(g.user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Base query para materiais
    materiais_query = Material.query.filter_by(ativo=True)
    
    # Filtrar por usuário baseado no papel
    if user.role.value == 'user':
        materiais_query = materiais_query.filter_by(usuario_id=user.id)
    
    # 1. Gráfico de Materiais por Categoria (Pizza)
    categorias_data = db.session.query(
        Material.categoria,
        db.func.count(Material.id).label('count'),
        db.func.sum(Material.quantidade).label('total_quantidade')
    ).filter_by(ativo=True)
    
    if user.role.value == 'user':
        categorias_data = categorias_data.filter_by(usuario_id=user.id)
    
    categorias_data = categorias_data.group_by(Material.categoria).all()
    
    materiais_por_categoria = [
        {
            'categoria': cat,
            'count': count,
            'total_quantidade': int(total_quantidade) if total_quantidade else 0
        }
        for cat, count, total_quantidade in categorias_data
    ]
    
    # 2. Gráfico de Movimentações dos Últimos 6 Meses (Linha)
    data_inicio = datetime.now() - timedelta(days=180)
    
    movimentacoes_query = MovimentacaoEstoque.query.filter(
        MovimentacaoEstoque.data_movimentacao >= data_inicio
    )
    
    if user.role.value == 'user':
        movimentacoes_query = movimentacoes_query.join(Material).filter(
            Material.usuario_id == user.id
        )
    
    movimentacoes_mensais = db.session.query(
        db.func.strftime('%Y-%m', MovimentacaoEstoque.data_movimentacao).label('mes'),
        MovimentacaoEstoque.tipo_movimentacao,
        db.func.count(MovimentacaoEstoque.id).label('count'),
        db.func.sum(MovimentacaoEstoque.quantidade).label('total_quantidade')
    ).filter(
        MovimentacaoEstoque.data_movimentacao >= data_inicio
    )
    
    if user.role.value == 'user':
        movimentacoes_mensais = movimentacoes_mensais.join(Material).filter(
            Material.usuario_id == user.id
        )
    
    movimentacoes_mensais = movimentacoes_mensais.group_by(
        db.func.strftime('%Y-%m', MovimentacaoEstoque.data_movimentacao),
        MovimentacaoEstoque.tipo_movimentacao
    ).all()
    
    # Organizar dados por mês
    movimentacoes_por_mes = {}
    for mes, tipo, count, total_quantidade in movimentacoes_mensais:
        if mes not in movimentacoes_por_mes:
            movimentacoes_por_mes[mes] = {
                'entrada': {'count': 0, 'quantidade': 0},
                'saida': {'count': 0, 'quantidade': 0},
                'ajuste': {'count': 0, 'quantidade': 0}
            }
        movimentacoes_por_mes[mes][tipo] = {
            'count': count,
            'quantidade': int(total_quantidade) if total_quantidade else 0
        }
    
    # 3. Gráfico de Atividades por Status (Barras)
    atividades_query = Atividade.query
    
    if user.role.value == 'admin':
        # Admins veem todas as atividades
        pass
    elif user.role.value == 'supervisor':
        # Supervisores veem atividades que criaram
        atividades_query = atividades_query.filter_by(supervisor_id=user.id)
    else:
        # Usuários comuns veem atividades atribuídas a eles
        atividades_query = atividades_query.filter_by(usuario_id=user.id)
    
    atividades_por_status = db.session.query(
        Atividade.status,
        db.func.count(Atividade.id).label('count')
    ).filter(
        Atividade.data_criacao >= data_inicio
    )
    
    if user.role.value == 'supervisor':
        atividades_por_status = atividades_por_status.filter_by(supervisor_id=user.id)
    elif user.role.value == 'user':
        atividades_por_status = atividades_por_status.filter_by(usuario_id=user.id)
    
    atividades_por_status = atividades_por_status.group_by(Atividade.status).all()
    
    atividades_status_data = [
        {
            'status': status,
            'count': count
        }
        for status, count in atividades_por_status
    ]
    
    # 4. Relatório Mensal Atual
    mes_atual = datetime.now().strftime('%Y-%m')
    
    # Atividades do mês atual
    atividades_mes_atual = atividades_query.filter(
        db.func.strftime('%Y-%m', Atividade.data_criacao) == mes_atual
    ).count()
    
    atividades_concluidas_mes = atividades_query.filter(
        db.func.strftime('%Y-%m', Atividade.data_criacao) == mes_atual,
        Atividade.status == 'concluida'
    ).count()
    
    # Movimentações do mês atual
    movimentacoes_mes_atual = movimentacoes_query.filter(
        db.func.strftime('%Y-%m', MovimentacaoEstoque.data_movimentacao) == mes_atual
    ).count()
    
    # Materiais mais usados no mês
    materiais_mais_usados = db.session.query(
        Material.nome,
        db.func.sum(MaterialUsado.quantidade_usada).label('total_usado')
    ).join(MaterialUsado).join(Atividade).filter(
        db.func.strftime('%Y-%m', Atividade.data_conclusao) == mes_atual,
        Atividade.status == 'concluida'
    )
    
    if user.role.value == 'user':
        materiais_mais_usados = materiais_mais_usados.filter(Material.usuario_id == user.id)
    
    materiais_mais_usados = materiais_mais_usados.group_by(
        Material.id, Material.nome
    ).order_by(db.func.sum(MaterialUsado.quantidade_usada).desc()).limit(5).all()
    
    materiais_mais_usados_data = [
        {
            'nome': nome,
            'total_usado': int(total_usado) if total_usado else 0
        }
        for nome, total_usado in materiais_mais_usados
    ]
    
    return jsonify({
        'materiais_por_categoria': materiais_por_categoria,
        'movimentacoes_por_mes': movimentacoes_por_mes,
        'atividades_por_status': atividades_status_data,
        'relatorio_mensal': {
            'mes': mes_atual,
            'atividades_criadas': atividades_mes_atual,
            'atividades_concluidas': atividades_concluidas_mes,
            'movimentacoes': movimentacoes_mes_atual,
            'materiais_mais_usados': materiais_mais_usados_data
        }
    })

