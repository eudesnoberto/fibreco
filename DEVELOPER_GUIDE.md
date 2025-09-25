# R2T Fibreco - Guia do Desenvolvedor

## 📋 Visão Geral

Este guia é destinado a desenvolvedores que desejam contribuir, manter ou estender o sistema R2T Fibreco. Ele contém informações técnicas detalhadas sobre a arquitetura, padrões de código e processos de desenvolvimento.

## 🏗️ Arquitetura do Sistema

### Estrutura Geral
```
R2TFibreco/
├── r2t-fibreco-backend/     # API Flask
├── r2t-fibreco-frontend/    # Interface React
├── README.md               # Documentação principal
├── API_DOCUMENTATION.md    # Documentação da API
└── DEVELOPER_GUIDE.md      # Este arquivo
```

### Backend (Flask)
```
r2t-fibreco-backend/
├── src/
│   ├── main.py             # Ponto de entrada
│   ├── models/             # Modelos de dados
│   │   ├── auth.py         # Usuários e sessões
│   │   ├── material.py     # Materiais e atividades
│   │   └── notification.py # Notificações
│   ├── routes/             # Rotas da API
│   │   ├── auth.py         # Autenticação
│   │   ├── material.py     # Materiais e atividades
│   │   └── notifications.py # Notificações
│   ├── utils/              # Utilitários
│   │   └── timezone.py     # Gerenciamento de timezone
│   └── __init__.py
├── uploads/                # Arquivos enviados
├── requirements.txt        # Dependências Python
└── .env                   # Variáveis de ambiente
```

### Frontend (React)
```
r2t-fibreco-frontend/
├── src/
│   ├── App.jsx             # Componente principal
│   ├── App.css             # Estilos globais
│   ├── components/         # Componentes React
│   │   ├── Header.jsx      # Cabeçalho
│   │   ├── Sidebar.jsx     # Menu lateral
│   │   ├── Dashboard.jsx   # Painel principal
│   │   ├── MaterialList.jsx # Lista de materiais
│   │   ├── AtividadeList.jsx # Lista de atividades
│   │   ├── NotificationDropdown.jsx # Notificações
│   │   └── ui/             # Componentes de UI
│   ├── contexts/           # Contextos React
│   │   ├── AuthContext.jsx # Autenticação
│   │   └── NotificationContext.jsx # Notificações
│   ├── pages/              # Páginas
│   └── main.jsx            # Ponto de entrada
├── public/                 # Arquivos estáticos
├── package.json            # Dependências Node.js
└── vite.config.js          # Configuração Vite
```

## 🔧 Configuração do Ambiente

### Pré-requisitos
- **Python 3.11+**
- **Node.js 18+**
- **Git**
- **Editor de código** (VS Code recomendado)

### Backend Setup
```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python src/main.py
```

### Frontend Setup
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📊 Modelos de Dados

### User Model
```python
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    nome_completo = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.USER)
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    atividades = db.relationship('Atividade', backref='usuario', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
```

### Material Model
```python
class Material(db.Model):
    __tablename__ = 'materials'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    descricao = db.Column(db.Text)
    categoria = db.Column(db.String(80), nullable=False)
    subcategoria = db.Column(db.String(80))
    quantidade_atual = db.Column(db.Integer, default=0, nullable=False)
    quantidade_minima = db.Column(db.Integer, default=0, nullable=False)
    fornecedor = db.Column(db.String(80), default='VIVO')
    localizacao = db.Column(db.String(80), default='Afogados')
    data_criacao = db.Column(db.DateTime, default=get_recife_time_utc, nullable=False)
    
    # Relacionamentos
    movimentacoes = db.relationship('MovimentacaoEstoque', backref='material', lazy=True)
    materiais_usados = db.relationship('MaterialUsado', backref='material', lazy=True)
```

### Atividade Model
```python
class Atividade(db.Model):
    __tablename__ = 'atividade'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    usuario_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.Enum(StatusAtividade), default=StatusAtividade.PENDENTE, nullable=False)
    data_criacao = db.Column(db.DateTime, default=get_recife_time_utc, nullable=False)
    data_conclusao = db.Column(db.DateTime)
    observacoes = db.Column(db.Text)
    imagens_conclusao = db.Column(db.Text)  # JSON string
    
    # Relacionamentos
    materiais_usados = db.relationship('MaterialUsado', backref='atividade', lazy=True)
    notifications = db.relationship('Notification', backref='activity', lazy=True)
```

### Notification Model
```python
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('atividade.id'), nullable=True)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=get_recife_time_utc, nullable=False)
```

## 🔐 Sistema de Autenticação

### JWT Implementation
```python
import jwt
from datetime import datetime, timedelta

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```

### Decorators de Autorização
```python
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token não fornecido'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer '
            user_id = verify_token(token)
            if not user_id:
                return jsonify({'error': 'Token inválido'}), 401
            
            g.user_id = user_id
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Token inválido'}), 401
    
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = User.query.get(g.user_id)
        if not user or user.role != UserRole.ADMIN:
            return jsonify({'error': 'Acesso negado'}), 403
        return f(*args, **kwargs)
    
    return decorated_function
```

## 🎨 Frontend Architecture

### Context API Usage
```javascript
// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
```

### Component Structure
```javascript
// Exemplo de componente
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function MaterialList() {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchMateriais()
  }, [])

  const fetchMateriais = async () => {
    try {
      const response = await fetch('/api/materiais', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMateriais(data)
      }
    } catch (error) {
      console.error('Erro ao buscar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="space-y-4">
      {materiais.map(material => (
        <div key={material.id} className="p-4 border rounded">
          <h3>{material.nome}</h3>
          <p>Quantidade: {material.quantidade_atual}</p>
        </div>
      ))}
    </div>
  )
}
```

## 🎯 Padrões de Código

### Python (Backend)
```python
# PEP 8 Compliance
def create_material(data):
    """
    Cria um novo material no sistema.
    
    Args:
        data (dict): Dados do material
        
    Returns:
        dict: Resposta da operação
        
    Raises:
        ValueError: Se os dados forem inválidos
    """
    try:
        # Validação de dados
        if not data.get('nome'):
            raise ValueError('Nome é obrigatório')
        
        # Criação do material
        material = Material(
            nome=data['nome'],
            descricao=data.get('descricao', ''),
            categoria=data['categoria'],
            subcategoria=data.get('subcategoria', ''),
            quantidade_atual=data.get('quantidade_atual', 0),
            quantidade_minima=data.get('quantidade_minima', 0)
        )
        
        db.session.add(material)
        db.session.commit()
        
        return {
            'message': 'Material criado com sucesso',
            'material': material.to_dict()
        }, 201
        
    except ValueError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': 'Erro interno do servidor'}, 500
```

### JavaScript (Frontend)
```javascript
// ESLint + Prettier Compliance
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook personalizado para gerenciar materiais
 * @returns {Object} Estado e funções para materiais
 */
export function useMateriais() {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()

  const fetchMateriais = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/materiais', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar materiais')
      }

      const data = await response.json()
      setMateriais(data)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao buscar materiais:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMateriais()
  }, [fetchMateriais])

  return {
    materiais,
    loading,
    error,
    refetch: fetchMateriais
  }
}
```

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/
│   ├── test_models.py
│   ├── test_auth.py
│   └── test_materials.py
├── integration/
│   ├── test_api.py
│   └── test_database.py
├── e2e/
│   ├── test_user_flow.py
│   └── test_material_flow.py
└── fixtures/
    ├── users.json
    └── materials.json
```

### Exemplo de Teste Unitário
```python
import pytest
from src.models.material import Material
from src.models.auth import db

class TestMaterialModel:
    def test_create_material(self, app):
        """Testa criação de material"""
        with app.app_context():
            material = Material(
                nome='Teste',
                categoria='Cabos',
                quantidade_atual=10,
                quantidade_minima=5
            )
            
            db.session.add(material)
            db.session.commit()
            
            assert material.id is not None
            assert material.nome == 'Teste'
            assert material.categoria == 'Cabos'
```

### Exemplo de Teste de API
```python
import pytest
from src.main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_create_material(client, auth_headers):
    """Testa criação de material via API"""
    response = client.post('/api/materiais', 
                          json={
                              'nome': 'Teste',
                              'categoria': 'Cabos',
                              'quantidade_atual': 10
                          },
                          headers=auth_headers)
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Material criado com sucesso'
```

## 🚀 Deploy

### Configuração de Produção
```python
# config.py
import os

class ProductionConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
```

### Docker
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5002

CMD ["gunicorn", "--bind", "0.0.0.0:5002", "src.main:app"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./r2t-fibreco-backend
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/r2t_fibreco
    depends_on:
      - db

  frontend:
    build: ./r2t-fibreco-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=r2t_fibreco
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔧 Ferramentas de Desenvolvimento

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.flake8",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json"
  ]
}
```

### Scripts de Desenvolvimento
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write src"
  }
}
```

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
echo "Executando testes..."
python -m pytest tests/unit/
echo "Executando linting..."
npm run lint
echo "Verificando formatação..."
npm run format
```

## 📚 Recursos Adicionais

### Documentação de APIs
- **Swagger/OpenAPI**: Documentação automática
- **Postman**: Coleção de requests
- **Insomnia**: Testes de API

### Monitoramento
- **Logging**: Estrutura de logs
- **Métricas**: Performance e uso
- **Alertas**: Notificações de erro

### Backup
- **Database**: Backup automático
- **Files**: Backup de uploads
- **Config**: Backup de configurações

---

**Guia do Desenvolvedor R2T Fibreco** - v1.0.2  
Desenvolvido por **Francieudes Silva N. Alves**
