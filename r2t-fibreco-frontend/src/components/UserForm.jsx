import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Alert, AlertDescription } from './ui/alert'
import { useAuth } from '../contexts/AuthContext'

export const UserForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, isAdmin } = useAuth()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nome_completo: '',
    password: '',
    role: 'user',
    ativo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchUser()
    }
  }, [id])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({
          username: data.user.username,
          email: data.user.email,
          nome_completo: data.user.nome_completo,
          password: '',
          role: data.user.role,
          ativo: data.user.ativo
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar usuário')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!token) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    try {
      const url = isEdit ? `/api/users/${id}` : '/api/users'
      const method = isEdit ? 'PUT' : 'POST'
      
      // Remover senha vazia em edição
      const submitData = { ...formData }
      if (isEdit && !submitData.password) {
        delete submitData.password
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        navigate('/usuarios')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao salvar usuário')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getAvailableRoles = () => {
    if (isAdmin()) {
      return [
        { value: 'user', label: 'Fibreco' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'admin', label: 'Administrador' }
      ]
    }
    return [
      { value: 'user', label: 'Fibreco' }
    ]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/usuarios">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Edite as informações do usuário' : 'Crie um novo usuário no sistema'}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Preencha os dados do usuário abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Digite o nome de usuário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Digite o email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => handleChange('nome_completo', e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha {isEdit ? '(deixe em branco para manter a atual)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={isEdit ? 'Digite uma nova senha' : 'Digite a senha'}
                required={!isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => handleChange('ativo', checked)}
              />
              <Label htmlFor="ativo">Usuário ativo</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Link to="/usuarios">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
