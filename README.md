# R2T Fibreco - Sistema de Gestão de Estoque

## 📋 Visão Geral

O **R2T Fibreco** é um sistema completo de gestão de estoque e controle de materiais desenvolvido para otimizar o gerenciamento de recursos em operações de infraestrutura de fibra óptica. O sistema oferece controle total sobre materiais, movimentações, atividades e usuários, com interface responsiva e funcionalidades avançadas.

## 🚀 Características Principais

### ✨ Funcionalidades Core
- **Gestão de Materiais**: Controle completo de estoque com categorias e subcategorias
- **Movimentações**: Registro detalhado de entradas e saídas de materiais
- **Atividades**: Criação, atribuição e acompanhamento de atividades
- **Usuários**: Sistema de usuários com diferentes níveis de acesso
- **Relatórios**: Geração de relatórios detalhados e PDFs
- **Notificações**: Sistema de notificações em tempo real

### 🎯 Controle de Acesso
- **Administradores**: Acesso total ao sistema
- **Supervisores**: Gestão de atividades e relatórios
- **Usuários (Fibreco)**: Execução de atividades atribuídas

### 📱 Interface Responsiva
- **Mobile First**: Otimizado para dispositivos móveis
- **Desktop**: Interface completa para computadores
- **Tablet**: Adaptação automática para tablets

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **Flask 2.3.3** - Framework web
- **SQLAlchemy 3.0.5** - ORM para banco de dados
- **SQLite** - Banco de dados
- **ReportLab 4.0.4** - Geração de PDFs
- **Pillow 10.0.1** - Processamento de imagens
- **Pytz 2023.3** - Gerenciamento de timezone

### Frontend
- **React 18** - Biblioteca de interface
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones

## 📦 Instalação

### Pré-requisitos
- Python 3.11 ou superior
- Node.js 18 ou superior
- npm ou yarn

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd R2TFibreco
```

### 2. Backend Setup
```bash
cd r2t-fibreco-backend
pip install -r requirements.txt
python src/main.py
```

### 3. Frontend Setup
```bash
cd r2t-fibreco-frontend
npm install
npm run dev
```

### 4. Acesso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### Users
```sql
- id (INTEGER, PRIMARY KEY)
- username (VARCHAR, UNIQUE)
- nome_completo (VARCHAR)
- email (VARCHAR)
- password_hash (VARCHAR)
- role (ENUM: user, supervisor, admin)
- ativo (BOOLEAN)
- data_criacao (DATETIME)
```

#### Materials
```sql
- id (INTEGER, PRIMARY KEY)
- nome (VARCHAR)
- descricao (TEXT)
- categoria (VARCHAR)
- subcategoria (VARCHAR)
- quantidade_atual (INTEGER)
- quantidade_minima (INTEGER)
- fornecedor (VARCHAR)
- localizacao (VARCHAR)
- data_criacao (DATETIME)
```

#### Activities
```sql
- id (INTEGER, PRIMARY KEY)
- titulo (VARCHAR)
- descricao (TEXT)
- usuario_id (INTEGER, FOREIGN KEY)
- status (ENUM: pendente, em_andamento, concluida)
- data_criacao (DATETIME)
- data_conclusao (DATETIME)
- observacoes (TEXT)
- imagens_conclusao (TEXT, JSON)
```

#### Notifications
```sql
- id (INTEGER, PRIMARY KEY)
- user_id (INTEGER, FOREIGN KEY)
- title (VARCHAR)
- message (TEXT)
- type (VARCHAR)
- activity_id (INTEGER, FOREIGN KEY)
- read (BOOLEAN)
- created_at (DATETIME)
```

## 🔐 Sistema de Autenticação

### Roles e Permissões

#### Administrador
- ✅ Criar, editar e deletar materiais
- ✅ Criar, editar e deletar usuários
- ✅ Visualizar todos os relatórios
- ✅ Gerenciar todas as atividades
- ✅ Acesso total ao sistema

#### Supervisor
- ✅ Visualizar materiais
- ✅ Criar e gerenciar atividades
- ✅ Visualizar relatórios mensais
- ✅ Gerenciar usuários comuns
- ❌ Não pode criar/editar materiais

#### Usuário (Fibreco)
- ✅ Visualizar materiais
- ✅ Executar atividades atribuídas
- ✅ Concluir atividades
- ❌ Não pode criar atividades
- ❌ Não pode gerenciar usuários

## 📊 Funcionalidades Detalhadas

### Gestão de Materiais
- **CRUD Completo**: Criar, visualizar, editar e deletar materiais
- **Controle de Estoque**: Acompanhamento de quantidade atual e mínima
- **Categorização**: Organização por categorias e subcategorias
- **Alertas**: Notificações quando estoque está baixo
- **Histórico**: Rastreamento de todas as movimentações

### Sistema de Atividades
- **Criação**: Supervisores criam atividades para usuários
- **Atribuição**: Atividades são atribuídas a usuários específicos
- **Execução**: Usuários executam e concluem atividades
- **Acompanhamento**: Status em tempo real das atividades
- **Evidências**: Upload de imagens na conclusão

### Movimentações de Estoque
- **Entradas**: Registro de materiais recebidos
- **Saídas**: Controle de materiais utilizados
- **Rastreabilidade**: Histórico completo de movimentações
- **PDFs**: Geração de relatórios em PDF

### Sistema de Notificações
- **Tempo Real**: Notificações instantâneas
- **Persistência**: Notificações ficam até serem lidas/deletadas
- **Individual**: Cada usuário tem suas próprias notificações
- **Gerenciamento**: Opções para marcar como lida ou deletar

## 🎨 Interface do Usuário

### Design System
- **Cores**: Paleta consistente com azul como cor primária
- **Tipografia**: Hierarquia clara de textos
- **Componentes**: Biblioteca de componentes reutilizáveis
- **Ícones**: Lucide React para consistência visual

### Responsividade
- **Mobile**: Interface otimizada para smartphones
- **Tablet**: Adaptação para tablets
- **Desktop**: Interface completa para computadores
- **Breakpoints**: 640px, 768px, 1024px, 1280px

### Componentes Principais
- **Header**: Navegação principal e informações do usuário
- **Sidebar**: Menu lateral com navegação
- **Cards**: Exibição de informações em cards
- **Modals**: Janelas modais para ações importantes
- **Forms**: Formulários com validação

## 🔧 API Endpoints

### Autenticação
```
POST /api/login - Login do usuário
POST /api/logout - Logout do usuário
GET /api/me - Informações do usuário logado
```

### Usuários
```
GET /api/usuarios - Listar usuários
POST /api/usuarios - Criar usuário
PUT /api/usuarios/<id> - Atualizar usuário
DELETE /api/usuarios/<id> - Deletar usuário
```

### Materiais
```
GET /api/materiais - Listar materiais
POST /api/materiais - Criar material
PUT /api/materiais/<id> - Atualizar material
DELETE /api/materiais/<id> - Deletar material
```

### Atividades
```
GET /api/atividades - Listar atividades
POST /api/atividades - Criar atividade
PUT /api/atividades/<id> - Atualizar atividade
POST /api/atividades/<id>/concluir - Concluir atividade
```

### Notificações
```
GET /api/notifications - Listar notificações
PUT /api/notifications/<id>/read - Marcar como lida
PUT /api/notifications/read-all - Marcar todas como lidas
DELETE /api/notifications/<id> - Deletar notificação
DELETE /api/notifications/delete-all - Deletar todas
```

## 📱 Funcionalidades Mobile

### Otimizações
- **Touch Friendly**: Botões e elementos otimizados para toque
- **Gestos**: Suporte a gestos nativos
- **Performance**: Carregamento otimizado
- **Offline**: Funcionalidades básicas offline

### Menu Responsivo
- **Hamburger Menu**: Menu lateral em dispositivos móveis
- **Overlay**: Fundo escuro quando menu está aberto
- **Auto-close**: Menu fecha automaticamente ao navegar

## 🔒 Segurança

### Autenticação
- **JWT Tokens**: Autenticação baseada em tokens
- **Sessions**: Controle de sessões ativas
- **Password Hashing**: Senhas criptografadas com bcrypt

### Autorização
- **Role-based Access**: Controle baseado em roles
- **Route Protection**: Proteção de rotas sensíveis
- **API Security**: Validação de permissões em endpoints

### Validação
- **Input Validation**: Validação de dados de entrada
- **SQL Injection**: Proteção contra SQL injection
- **XSS Protection**: Proteção contra XSS

## 📈 Performance

### Otimizações
- **Lazy Loading**: Carregamento sob demanda
- **Image Optimization**: Otimização de imagens
- **Caching**: Cache de dados frequentes
- **Bundle Splitting**: Divisão de código JavaScript

### Monitoramento
- **Error Tracking**: Rastreamento de erros
- **Performance Metrics**: Métricas de performance
- **User Analytics**: Análise de uso

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
└── fixtures/      # Dados de teste
```

### Executar Testes
```bash
# Backend
cd r2t-fibreco-backend
python -m pytest

# Frontend
cd r2t-fibreco-frontend
npm test
```

## 🚀 Deploy

### Produção
- **Backend**: Deploy em servidor Python (Gunicorn + Nginx)
- **Frontend**: Build estático para CDN
- **Database**: PostgreSQL para produção
- **SSL**: Certificados SSL para HTTPS

### Docker
```bash
# Build
docker-compose build

# Run
docker-compose up -d
```

## 📝 Changelog

### Versão 1.0.2
- ✅ Sistema de notificações implementado
- ✅ Interface 100% responsiva
- ✅ Menu lateral otimizado
- ✅ Funcionalidades de delete em notificações
- ✅ Timezone de Recife implementado
- ✅ Sistema de permissões aprimorado

### Versão 1.0.1
- ✅ Sistema de autenticação
- ✅ Gestão de materiais
- ✅ Sistema de atividades
- ✅ Geração de PDFs
- ✅ Interface responsiva básica

### Versão 1.0.0
- ✅ Versão inicial
- ✅ Estrutura básica
- ✅ Autenticação simples

## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Padrões de Código
- **Python**: PEP 8
- **JavaScript**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Documentação**: JSDoc para funções

## 📞 Suporte

### Contato
- **Desenvolvedor**: Francieudes Silva N. Alves
- **Email**: [email]
- **WhatsApp**: +55 81 99569-7473

### Issues
- Use o sistema de issues do GitHub
- Descreva o problema detalhadamente
- Inclua screenshots se necessário
- Especifique a versão do sistema

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- **O Altíssimo Acima de Tudo**: Por sua bondade
- **Equipe de Desenvolvimento**: Pelo trabalho dedicado
- **Usuários**: Pelo feedback e sugestões
- **Comunidade Open Source**: Pelas ferramentas utilizadas

---

**R2T Fibreco** - Sistema de Gestão de Estoque v1.0.2  
Desenvolvido por **Francieudes Silva N. Alves**
© 2025- Todos os direitos reservados
