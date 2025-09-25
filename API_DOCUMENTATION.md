# R2T Fibreco - Documentação da API

## 📋 Visão Geral

A API do R2T Fibreco é uma API RESTful desenvolvida em Flask que fornece endpoints para gerenciamento de materiais, atividades, usuários e notificações. A API utiliza autenticação JWT e controle de acesso baseado em roles.

## 🔗 Base URL

```
http://localhost:5002/api
```

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Todos os endpoints protegidos requerem um token válido no header `Authorization`.

### Header de Autenticação
```
Authorization: Bearer <token>
```

### Obter Token
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "nome_completo": "Administrador",
    "email": "admin@r2t.com",
    "role": "admin"
  }
}
```

## 👥 Usuários

### Listar Usuários
```http
GET /api/usuarios
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "nome_completo": "Administrador",
    "email": "admin@r2t.com",
    "role": "admin",
    "ativo": true,
    "data_criacao": "2024-01-01T00:00:00"
  }
]
```

### Criar Usuário
```http
POST /api/usuarios
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "novo_usuario",
  "nome_completo": "Novo Usuário",
  "email": "usuario@r2t.com",
  "password": "senha123",
  "role": "user"
}
```

**Resposta:**
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 2,
    "username": "novo_usuario",
    "nome_completo": "Novo Usuário",
    "email": "usuario@r2t.com",
    "role": "user",
    "ativo": true
  }
}
```

### Atualizar Usuário
```http
PUT /api/usuarios/2
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome_completo": "Nome Atualizado",
  "email": "novo@email.com"
}
```

### Deletar Usuário
```http
DELETE /api/usuarios/2
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

### Alterar Senha
```http
PUT /api/usuarios/2/senha
Authorization: Bearer <token>
Content-Type: application/json

{
  "senha_atual": "senha123",
  "nova_senha": "nova_senha123"
}
```

## 📦 Materiais

### Listar Materiais
```http
GET /api/materiais
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `categoria` - Filtrar por categoria
- `subcategoria` - Filtrar por subcategoria
- `search` - Buscar por nome

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Cabo de Fibra Óptica",
    "descricao": "Cabo de fibra óptica 24 fibras",
    "categoria": "Cabos",
    "subcategoria": "Fibra Óptica",
    "quantidade_atual": 100,
    "quantidade_minima": 10,
    "fornecedor": "VIVO",
    "localizacao": "Afogados",
    "data_criacao": "2024-01-01T00:00:00"
  }
]
```

### Criar Material
```http
POST /api/materiais
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Novo Material",
  "descricao": "Descrição do material",
  "categoria": "Cabos",
  "subcategoria": "Fibra Óptica",
  "quantidade_atual": 50,
  "quantidade_minima": 5,
  "fornecedor": "VIVO",
  "localizacao": "Afogados"
}
```

### Atualizar Material
```http
PUT /api/materiais/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantidade_atual": 75,
  "quantidade_minima": 8
}
```

### Deletar Material
```http
DELETE /api/materiais/1
Authorization: Bearer <token>
```

## 📋 Atividades

### Listar Atividades
```http
GET /api/atividades
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `status` - Filtrar por status (pendente, em_andamento, concluida)
- `usuario_id` - Filtrar por usuário

**Resposta:**
```json
[
  {
    "id": 1,
    "titulo": "Instalação de Fibra",
    "descricao": "Instalar fibra óptica no bairro X",
    "usuario_id": 2,
    "usuario": {
      "nome_completo": "Usuário Teste"
    },
    "status": "pendente",
    "data_criacao": "2024-01-01T00:00:00",
    "data_conclusao": null,
    "observacoes": null,
    "imagens_conclusao": null
  }
]
```

### Criar Atividade
```http
POST /api/atividades
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Nova Atividade",
  "descricao": "Descrição da atividade",
  "usuario_id": 2
}
```

### Atualizar Atividade
```http
PUT /api/atividades/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "em_andamento"
}
```

### Concluir Atividade
```http
POST /api/atividades/1/concluir
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "observacoes": "Atividade concluída com sucesso",
  "imagens": [file1, file2]
}
```

### Deletar Atividade
```http
DELETE /api/atividades/1
Authorization: Bearer <token>
```

## 📊 Movimentações

### Listar Movimentações
```http
GET /api/movimentacoes
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `tipo` - Filtrar por tipo (entrada, saida)
- `material_id` - Filtrar por material
- `data_inicio` - Data de início (YYYY-MM-DD)
- `data_fim` - Data de fim (YYYY-MM-DD)

### Criar Movimentação
```http
POST /api/movimentacoes
Authorization: Bearer <token>
Content-Type: application/json

{
  "material_id": 1,
  "tipo": "entrada",
  "quantidade": 50,
  "observacoes": "Entrada de material"
}
```

### Gerar PDF de Movimentações
```http
GET /api/movimentacoes/pdf
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `data_inicio` - Data de início
- `data_fim` - Data de fim
- `material_id` - ID do material (opcional)

## 🔔 Notificações

### Listar Notificações
```http
GET /api/notifications
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Atividade Concluída",
      "message": "A atividade 'Instalação de Fibra' foi concluída por Usuário Teste",
      "type": "atividade_concluida",
      "activity_id": 1,
      "read": false,
      "created_at": "2024-01-01T00:00:00"
    }
  ],
  "unread_count": 1
}
```

### Marcar Notificação como Lida
```http
PUT /api/notifications/1/read
Authorization: Bearer <token>
```

### Marcar Todas como Lidas
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

### Deletar Notificação
```http
DELETE /api/notifications/1
Authorization: Bearer <token>
```

### Deletar Todas as Notificações
```http
DELETE /api/notifications/delete-all
Authorization: Bearer <token>
```

## 📈 Relatórios

### Dashboard
```http
GET /api/dashboard
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "total_materiais": 25,
  "materiais_baixo_estoque": 3,
  "atividades_pendentes": 5,
  "atividades_concluidas": 12,
  "movimentacoes_mes": 45
}
```

### Relatório de Atividades
```http
GET /api/atividades/relatorio
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `data_inicio` - Data de início
- `data_fim` - Data de fim
- `usuario_id` - ID do usuário (opcional)

### Gerar PDF de Atividade
```http
GET /api/atividades/1/pdf
Authorization: Bearer <token>
```

## 🚨 Códigos de Erro

### Códigos HTTP
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno do servidor

### Estrutura de Erro
```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)"
}
```

### Exemplos de Erro
```json
{
  "error": "Usuário não encontrado"
}
```

```json
{
  "error": "Erro de validação",
  "details": {
    "username": ["Este campo é obrigatório"],
    "email": ["Email inválido"]
  }
}
```

## 🔒 Permissões

### Roles e Acessos

#### Admin
- ✅ Todos os endpoints
- ✅ Gerenciar usuários
- ✅ Gerenciar materiais
- ✅ Gerenciar atividades
- ✅ Visualizar relatórios

#### Supervisor
- ✅ Visualizar materiais
- ✅ Criar/gerenciar atividades
- ✅ Visualizar relatórios
- ❌ Gerenciar materiais
- ❌ Gerenciar usuários

#### User (Fibreco)
- ✅ Visualizar materiais
- ✅ Executar atividades atribuídas
- ❌ Criar atividades
- ❌ Gerenciar usuários
- ❌ Gerenciar materiais

## 📝 Exemplos de Uso

### Fluxo Completo de Atividade

1. **Criar Atividade (Supervisor)**
```http
POST /api/atividades
{
  "titulo": "Instalação de Fibra",
  "descricao": "Instalar fibra óptica no bairro X",
  "usuario_id": 2
}
```

2. **Usuário Visualiza Atividade**
```http
GET /api/atividades?usuario_id=2
```

3. **Concluir Atividade (Usuário)**
```http
POST /api/atividades/1/concluir
Content-Type: multipart/form-data
{
  "observacoes": "Atividade concluída com sucesso",
  "imagens": [file1, file2]
}
```

4. **Supervisor Recebe Notificação**
```http
GET /api/notifications
```

### Fluxo de Movimentação

1. **Entrada de Material**
```http
POST /api/movimentacoes
{
  "material_id": 1,
  "tipo": "entrada",
  "quantidade": 50,
  "observacoes": "Entrada de material"
}
```

2. **Saída de Material**
```http
POST /api/movimentacoes
{
  "material_id": 1,
  "tipo": "saida",
  "quantidade": 10,
  "observacoes": "Material utilizado em atividade"
}
```

3. **Gerar Relatório**
```http
GET /api/movimentacoes/pdf?data_inicio=2024-01-01&data_fim=2024-01-31
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///r2t_fibreco.db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

### CORS
A API está configurada para aceitar requisições do frontend em `http://localhost:5173`.

### Timezone
O sistema utiliza o timezone de Recife (America/Recife) para todas as operações de data/hora.

## 📚 Recursos Adicionais

### Upload de Arquivos
- **Tipos permitidos**: JPG, JPEG, PNG
- **Tamanho máximo**: 16MB
- **Pasta de destino**: `uploads/`

### Paginação
Para endpoints que retornam listas, use os parâmetros:
- `page` - Número da página
- `per_page` - Itens por página

### Filtros
Muitos endpoints suportam filtros via query parameters:
- `search` - Busca textual
- `status` - Filtro por status
- `data_inicio` / `data_fim` - Filtro por data

---

**API R2T Fibreco** - Documentação v1.0.2  
Desenvolvido por **Francieudes Silva N. Alves**
