# R2T Fibreco - Guia de Instalação

## 📋 Visão Geral

Este guia fornece instruções detalhadas para instalar e configurar o sistema R2T Fibreco em diferentes ambientes, desde desenvolvimento local até produção.

## 🖥️ Requisitos do Sistema

### Mínimos
- **CPU**: 2 cores
- **RAM**: 4GB
- **Armazenamento**: 10GB livres
- **Sistema Operacional**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Recomendados
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Armazenamento**: 50GB+ SSD
- **Sistema Operacional**: Windows 11, macOS 12+, Ubuntu 20.04+

## 🔧 Pré-requisitos

### Software Necessário
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Editor de Código** (VS Code recomendado) - [Download](https://code.visualstudio.com/)

### Verificar Instalações
```bash
# Verificar Python
python --version
# Deve retornar: Python 3.11.x ou superior

# Verificar Node.js
node --version
# Deve retornar: v18.x.x ou superior

# Verificar npm
npm --version
# Deve retornar: 9.x.x ou superior

# Verificar Git
git --version
# Deve retornar: git version 2.x.x ou superior
```

## 📥 Instalação

### 1. Clonar o Repositório
```bash
# Clonar o repositório
git clone <repository-url>
cd R2TFibreco

# Verificar estrutura
ls -la
# Deve mostrar: r2t-fibreco-backend/, r2t-fibreco-frontend/, README.md
```

### 2. Configurar Backend

#### Windows
```cmd
# Navegar para o backend
cd r2t-fibreco-backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
venv\Scripts\activate

# Atualizar pip
python -m pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Verificar instalação
python -c "import flask; print('Flask instalado com sucesso')"
```

#### Linux/macOS
```bash
# Navegar para o backend
cd r2t-fibreco-backend

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Atualizar pip
python -m pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt

# Verificar instalação
python -c "import flask; print('Flask instalado com sucesso')"
```

### 3. Configurar Frontend

```bash
# Navegar para o frontend
cd r2t-fibreco-frontend

# Instalar dependências
npm install

# Verificar instalação
npm list --depth=0
```

### 4. Configurar Banco de Dados

#### SQLite (Desenvolvimento)
```bash
# O banco SQLite será criado automaticamente na primeira execução
# Não é necessária configuração adicional
```

#### PostgreSQL (Produção)
```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE r2t_fibreco;
CREATE USER r2t_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE r2t_fibreco TO r2t_user;
\q
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

#### Backend (.env)
```bash
# Criar arquivo .env no diretório r2t-fibreco-backend
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
DATABASE_URL=sqlite:///r2t_fibreco.db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

#### Frontend (.env)
```bash
# Criar arquivo .env no diretório r2t-fibreco-frontend
VITE_API_URL=http://localhost:5002
VITE_APP_NAME=R2T Fibreco
VITE_APP_VERSION=1.0.2
```

### 2. Configuração do Banco de Dados

#### Inicializar Banco (SQLite)
```bash
# Navegar para o backend
cd r2t-fibreco-backend

# Ativar ambiente virtual
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

# Executar script de inicialização
python -c "
from src.main import app, db
with app.app_context():
    db.create_all()
    print('Banco de dados inicializado com sucesso!')
"
```

#### Inicializar Banco (PostgreSQL)
```bash
# Atualizar DATABASE_URL no .env
DATABASE_URL=postgresql://r2t_user:sua_senha@localhost:5432/r2t_fibreco

# Executar script de inicialização
python -c "
from src.main import app, db
with app.app_context():
    db.create_all()
    print('Banco de dados inicializado com sucesso!')
"
```

### 3. Criar Usuário Administrador

```bash
# Executar script para criar admin
python -c "
from src.main import app, db
from src.models.auth import User, UserRole
from werkzeug.security import generate_password_hash

with app.app_context():
    # Verificar se admin já existe
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            nome_completo='Administrador',
            email='admin@r2t.com',
            password_hash=generate_password_hash('admin123'),
            role=UserRole.ADMIN
        )
        db.session.add(admin)
        db.session.commit()
        print('Usuário administrador criado!')
        print('Username: admin')
        print('Password: admin123')
    else:
        print('Usuário administrador já existe!')
"
```

## 🚀 Execução

### 1. Iniciar Backend

#### Windows
```cmd
# Navegar para o backend
cd r2t-fibreco-backend

# Ativar ambiente virtual
venv\Scripts\activate

# Iniciar servidor
python src/main.py
```

#### Linux/macOS
```bash
# Navegar para o backend
cd r2t-fibreco-backend

# Ativar ambiente virtual
source venv/bin/activate

# Iniciar servidor
python src/main.py
```

**Saída esperada:**
```
 * Running on http://127.0.0.1:5002
 * Debug mode: on
```

### 2. Iniciar Frontend

```bash
# Navegar para o frontend
cd r2t-fibreco-frontend

# Iniciar servidor de desenvolvimento
npm run dev
```

**Saída esperada:**
```
  VITE v4.4.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Verificar Instalação

1. **Acesse o frontend**: http://localhost:5173
2. **Faça login** com:
   - Username: `admin`
   - Password: `admin123`
3. **Verifique funcionalidades**:
   - Dashboard carrega
   - Menu lateral funciona
   - Lista de materiais aparece

## 🔧 Configurações Avançadas

### 1. Configuração de Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/r2t-fibreco
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Configuração de SSL

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configuração de Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🐳 Instalação com Docker

### 1. Docker Compose

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
      - DATABASE_URL=postgresql://r2t_user:senha@db:5432/r2t_fibreco
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

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
      - POSTGRES_USER=r2t_user
      - POSTGRES_PASSWORD=senha
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Executar com Docker

```bash
# Build e executar
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 🔍 Solução de Problemas

### Problemas Comuns

#### 1. Erro de Porta em Uso
```bash
# Verificar processos usando a porta
# Windows
netstat -ano | findstr :5002
netstat -ano | findstr :5173

# Linux/macOS
lsof -i :5002
lsof -i :5173

# Matar processo
# Windows
taskkill /PID <PID> /F

# Linux/macOS
kill -9 <PID>
```

#### 2. Erro de Dependências Python
```bash
# Limpar cache do pip
pip cache purge

# Reinstalar dependências
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

#### 3. Erro de Dependências Node.js
```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### 4. Erro de Banco de Dados
```bash
# Verificar permissões
# Windows
icacls uploads /grant Everyone:F

# Linux/macOS
chmod 755 uploads
chown -R $USER:$USER uploads
```

### Logs de Debug

#### Backend
```bash
# Executar com debug
FLASK_DEBUG=1 python src/main.py

# Ver logs detalhados
tail -f logs/app.log
```

#### Frontend
```bash
# Executar com debug
npm run dev -- --debug

# Ver logs no console do navegador
# F12 -> Console
```

## 📊 Monitoramento

### 1. Health Check

```bash
# Verificar backend
curl http://localhost:5002/api/health

# Verificar frontend
curl http://localhost:5173
```

### 2. Métricas de Performance

```bash
# Monitorar uso de CPU/RAM
# Windows
tasklist /fi "imagename eq python.exe"
tasklist /fi "imagename eq node.exe"

# Linux/macOS
top -p $(pgrep -f "python.*main.py")
top -p $(pgrep -f "node.*vite")
```

### 3. Logs de Aplicação

```bash
# Backend logs
tail -f r2t-fibreco-backend/logs/app.log

# Frontend logs (no console do navegador)
# F12 -> Console -> Network
```

## 🔄 Atualizações

### 1. Atualizar Código

```bash
# Fazer backup
cp -r R2TFibreco R2TFibreco_backup_$(date +%Y%m%d)

# Atualizar código
git pull origin main

# Atualizar dependências
cd r2t-fibreco-backend
pip install -r requirements.txt

cd ../r2t-fibreco-frontend
npm install
```

### 2. Atualizar Banco de Dados

```bash
# Executar migrações (se houver)
python -c "
from src.main import app, db
with app.app_context():
    # Executar migrações aqui
    print('Migrações executadas!')
"
```

## 📞 Suporte

### Contato
- **Desenvolvedor**: Francieudes Silva N. Alves
- **Email**: [email]
- **WhatsApp**: +55 81 99569-7473

### Recursos
- **Documentação**: README.md
- **API**: API_DOCUMENTATION.md
- **Desenvolvimento**: DEVELOPER_GUIDE.md
- **Issues**: GitHub Issues

---

**Guia de Instalação R2T Fibreco** - v1.0.2  
Desenvolvido por **Francieudes Silva N. Alves**
