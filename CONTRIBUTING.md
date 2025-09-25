# Guia de Contribuição - R2T Fibreco

Obrigado por considerar contribuir para o R2T Fibreco! Este documento fornece diretrizes e informações para contribuidores.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Funcionalidades](#sugerindo-funcionalidades)
- [Documentação](#documentação)

## 🤝 Código de Conduta

### Nossos Compromissos

Para promover um ambiente aberto e acolhedor, nós, como contribuidores e mantenedores, nos comprometemos a fazer da participação em nosso projeto uma experiência livre de assédio para todos, independentemente de idade, tamanho corporal, deficiência, etnia, características sexuais, identidade e expressão de gênero, nível de experiência, educação, status socioeconômico, nacionalidade, aparência pessoal, raça, religião ou identidade e orientação sexual.

### Comportamento Esperado

- Use linguagem acolhedora e inclusiva
- Respeite pontos de vista e experiências diferentes
- Aceite graciosamente críticas construtivas
- Foque no que é melhor para a comunidade
- Demonstre empatia para com outros membros da comunidade

### Comportamento Inaceitável

- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicação de informações privadas sem permissão
- Outra conduta que possa ser considerada inadequada

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Correção de Bugs**
   - Identificar e corrigir problemas existentes
   - Melhorar tratamento de erros
   - Otimizar performance

2. **✨ Novas Funcionalidades**
   - Implementar funcionalidades solicitadas
   - Melhorar funcionalidades existentes
   - Adicionar novos componentes

3. **📚 Documentação**
   - Melhorar documentação existente
   - Adicionar exemplos de uso
   - Traduzir documentação

4. **🧪 Testes**
   - Adicionar testes unitários
   - Melhorar cobertura de testes
   - Testes de integração

5. **🎨 Interface**
   - Melhorar design e UX
   - Otimizar responsividade
   - Adicionar animações

### Processo de Contribuição

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie** uma branch para sua feature
4. **Faça** suas mudanças
5. **Teste** suas mudanças
6. **Commit** suas mudanças
7. **Push** para sua branch
8. **Abra** um Pull Request

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- Git
- Editor de código (VS Code recomendado)

### Setup Local

```bash
# 1. Fork e clone o repositório
git clone https://github.com/seu-usuario/r2t-fibreco.git
cd r2t-fibreco

# 2. Configurar backend
cd r2t-fibreco-backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# 3. Configurar frontend
cd ../r2t-fibreco-frontend
npm install

# 4. Executar testes
cd ../r2t-fibreco-backend
python -m pytest

cd ../r2t-fibreco-frontend
npm test
```

### Configuração do Editor

#### VS Code Extensions
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

#### Configurações Recomendadas
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## 📝 Padrões de Código

### Python (Backend)

#### PEP 8 Compliance
```python
# ✅ Bom
def create_material(data):
    """
    Cria um novo material no sistema.
    
    Args:
        data (dict): Dados do material
        
    Returns:
        dict: Resposta da operação
    """
    try:
        material = Material(
            nome=data['nome'],
            categoria=data['categoria']
        )
        db.session.add(material)
        db.session.commit()
        return {'message': 'Material criado'}, 201
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}, 500

# ❌ Ruim
def create_material(data):
    material=Material(nome=data['nome'],categoria=data['categoria'])
    db.session.add(material)
    db.session.commit()
    return {'message':'Material criado'},201
```

#### Estrutura de Arquivos
```
src/
├── models/          # Modelos de dados
├── routes/          # Rotas da API
├── utils/           # Utilitários
├── __init__.py
└── main.py          # Ponto de entrada
```

#### Nomenclatura
- **Funções**: `snake_case`
- **Classes**: `PascalCase`
- **Constantes**: `UPPER_CASE`
- **Arquivos**: `snake_case.py`

### JavaScript (Frontend)

#### ESLint + Prettier
```javascript
// ✅ Bom
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook personalizado para gerenciar materiais
 * @returns {Object} Estado e funções para materiais
 */
export function useMateriais() {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const fetchMateriais = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/materiais', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setMateriais(data)
    } catch (error) {
      console.error('Erro ao buscar materiais:', error)
    } finally {
      setLoading(false)
    }
  }

  return { materiais, loading, fetchMateriais }
}

// ❌ Ruim
export function useMateriais(){
const [materiais,setMateriais]=useState([])
const [loading,setLoading]=useState(false)
const {token}=useAuth()
const fetchMateriais=async()=>{
setLoading(true)
try{
const response=await fetch('/api/materiais',{headers:{'Authorization':`Bearer ${token}`}})
const data=await response.json()
setMateriais(data)
}catch(error){
console.error('Erro ao buscar materiais:',error)
}finally{
setLoading(false)
}
}
return {materiais,loading,fetchMateriais}
}
```

#### Estrutura de Componentes
```javascript
// Estrutura padrão de componente
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export function ComponentName() {
  // 1. Hooks
  const { user } = useAuth()
  
  // 2. Estado local
  const [data, setData] = useState(null)
  
  // 3. Efeitos
  useEffect(() => {
    // Lógica de efeito
  }, [])
  
  // 4. Funções
  const handleClick = () => {
    // Lógica do clique
  }
  
  // 5. Renderização
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Commits

#### Conventional Commits
```bash
# Formato
<type>[optional scope]: <description>

# Exemplos
feat: adicionar sistema de notificações
fix: corrigir erro de validação em materiais
docs: atualizar documentação da API
style: formatar código com prettier
refactor: reorganizar estrutura de componentes
test: adicionar testes para autenticação
chore: atualizar dependências
```

#### Tipos de Commit
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação de código
- **refactor**: Refatoração
- **test**: Testes
- **chore**: Tarefas de manutenção

## 🔄 Processo de Pull Request

### Antes de Abrir um PR

1. **Teste** suas mudanças localmente
2. **Execute** todos os testes
3. **Verifique** se não há conflitos
4. **Atualize** a documentação se necessário
5. **Siga** os padrões de código

### Template de PR

```markdown
## 📋 Descrição
Breve descrição das mudanças realizadas.

## 🔗 Issue Relacionada
Closes #123

## 🧪 Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testado manualmente

## 📸 Screenshots
(Se aplicável)

## 📝 Checklist
- [ ] Código segue os padrões do projeto
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Não há conflitos de merge
```

### Processo de Review

1. **Automático**: CI/CD verifica testes e linting
2. **Manual**: Mantenedores revisam o código
3. **Feedback**: Sugestões e melhorias
4. **Aprovação**: PR aprovado e mergeado

## 🐛 Reportando Bugs

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do bug.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

## 🎯 Comportamento Esperado
Descrição do que deveria acontecer.

## 📸 Screenshots
(Se aplicável)

## 🖥️ Ambiente
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 1.0.2]

## 📋 Informações Adicionais
Qualquer outra informação relevante.
```

### Critérios para Bug Reports

- **Reproduzível**: Deve ser possível reproduzir o bug
- **Específico**: Descrição clara do problema
- **Completo**: Incluir todas as informações necessárias
- **Único**: Verificar se já não foi reportado

## 💡 Sugerindo Funcionalidades

### Template de Feature Request

```markdown
## 💡 Funcionalidade Sugerida
Descrição clara da funcionalidade desejada.

## 🎯 Problema que Resolve
Descrição do problema que esta funcionalidade resolveria.

## 💭 Solução Proposta
Descrição da solução que você gostaria de ver implementada.

## 🔄 Alternativas Consideradas
Outras soluções que você considerou.

## 📋 Informações Adicionais
Qualquer outra informação relevante.
```

### Critérios para Feature Requests

- **Relevante**: Deve ser útil para o projeto
- **Específico**: Descrição clara da funcionalidade
- **Viável**: Tecnicamente possível de implementar
- **Único**: Verificar se já não foi sugerido

## 📚 Documentação

### Tipos de Documentação

1. **README.md**: Visão geral do projeto
2. **API_DOCUMENTATION.md**: Documentação da API
3. **DEVELOPER_GUIDE.md**: Guia para desenvolvedores
4. **INSTALLATION_GUIDE.md**: Guia de instalação
5. **CHANGELOG.md**: Histórico de mudanças

### Padrões de Documentação

- **Clareza**: Linguagem clara e objetiva
- **Completude**: Informações completas
- **Exemplos**: Incluir exemplos práticos
- **Atualização**: Manter documentação atualizada

### Contribuindo com Documentação

1. **Identifique** áreas que precisam de documentação
2. **Escreva** documentação clara e útil
3. **Inclua** exemplos práticos
4. **Revise** para clareza e precisão
5. **Atualize** quando necessário

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
└── fixtures/      # Dados de teste
```

### Escrevendo Testes

#### Testes Unitários
```python
def test_create_material():
    """Testa criação de material"""
    material = Material(
        nome='Teste',
        categoria='Cabos',
        quantidade_atual=10
    )
    
    assert material.nome == 'Teste'
    assert material.categoria == 'Cabos'
    assert material.quantidade_atual == 10
```

#### Testes de Integração
```python
def test_material_api(client, auth_headers):
    """Testa API de materiais"""
    response = client.post('/api/materiais', 
                          json={'nome': 'Teste', 'categoria': 'Cabos'},
                          headers=auth_headers)
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['message'] == 'Material criado com sucesso'
```

### Executando Testes

```bash
# Backend
cd r2t-fibreco-backend
python -m pytest

# Frontend
cd r2t-fibreco-frontend
npm test

# Todos os testes
npm run test:all
```

## 🏷️ Versionamento

### Semantic Versioning

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

### Exemplos

- `1.0.0` → `1.0.1`: Correção de bug
- `1.0.1` → `1.1.0`: Nova funcionalidade
- `1.1.0` → `2.0.0`: Mudança incompatível

## 📞 Suporte

### Canais de Comunicação

- **GitHub Issues**: Para bugs e feature requests
- **GitHub Discussions**: Para discussões gerais
- **Email**: [email]
- **WhatsApp**: +55 81 99569-7473

### Tempo de Resposta

- **Bugs críticos**: 24 horas
- **Bugs normais**: 3-5 dias
- **Feature requests**: 1-2 semanas
- **Discussões**: 2-3 dias

## 🙏 Agradecimentos

### Tipos de Contribuição

- **Código**: Implementação de funcionalidades
- **Documentação**: Melhoria da documentação
- **Testes**: Adição de testes
- **Design**: Melhoria da interface
- **Feedback**: Sugestões e críticas

### Reconhecimento

- **Contribuidores**: Listados no README
- **Releases**: Mencionados no changelog
- **Issues**: Reconhecidos nos comentários

---

**Guia de Contribuição R2T Fibreco** - v1.0.2  
Desenvolvido por **Francieudes Silva N. Alves**

Obrigado por contribuir! 🎉
