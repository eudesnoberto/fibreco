import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Calendar, User, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../contexts/AuthContext'

export function AtividadeForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token } = useAuth()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    usuario_id: '',
    data_limite: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchUsuarios()
    if (isEditing) {
      fetchAtividade()
    }
  }, [id, isEditing])

  const fetchUsuarios = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas usuários comuns (role user)
        const usuariosComuns = data.filter(user => user.role === 'user')
        setUsuarios(usuariosComuns)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }


  const fetchAtividade = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/atividades/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
          titulo: data.titulo || '',
          descricao: data.descricao || '',
          usuario_id: data.usuario_id || '',
          data_limite: data.data_limite ? data.data_limite.split('T')[0] : '',
          observacoes: data.observacoes || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar atividade:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      return
    }

    // Validação dos campos obrigatórios
    if (!formData.titulo.trim()) {
      alert('Título é obrigatório')
      return
    }
    if (!formData.usuario_id) {
      alert('Usuário responsável é obrigatório')
      return
    }

    try {
      setLoading(true)
      const url = isEditing ? `/api/atividades/${id}` : '/api/atividades'
      const method = isEditing ? 'PUT' : 'POST'

      const requestData = {
        ...formData
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        navigate('/atividades')
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error)
      alert('Erro ao salvar atividade')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/atividades')} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isEditing ? 'Atualize as informações da atividade' : 'Crie uma nova atividade para um usuário'}
          </p>
          {!isEditing && (
            <div className="mt-2 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>Como Supervisor:</strong> Crie atividades para usuários gastarem materiais específicos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Atividade</CardTitle>
          <CardDescription>
            Preencha os dados da atividade que será atribuída ao usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Título */}
              <div className="lg:col-span-2">
                <Label htmlFor="titulo">Título da Atividade *</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Instalação de cabo óptico na rua X"
                  required
                />
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descreva detalhadamente a atividade..."
                  rows={3}
                />
              </div>

              {/* Usuário Responsável */}
              <div>
                <Label htmlFor="usuario_id">Usuário Responsável *</Label>
                <select
                  id="usuario_id"
                  name="usuario_id"
                  value={formData.usuario_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione um usuário</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} ({usuario.email})
                    </option>
                  ))}
                </select>
              </div>


              {/* Data Limite */}
              <div>
                <Label htmlFor="data_limite">Data Limite</Label>
                <Input
                  id="data_limite"
                  name="data_limite"
                  type="date"
                  value={formData.data_limite}
                  onChange={handleChange}
                />
              </div>

              {/* Observações */}
              <div className="lg:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Observações adicionais sobre a atividade..."
                  rows={2}
                />
              </div>
            </div>

            {/* Resumo da Atividade */}
            {formData.titulo && formData.usuario_id && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Resumo da Atividade</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Título</p>
                    <p className="font-medium">{formData.titulo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Usuário Responsável</p>
                    <p className="font-medium text-blue-600">
                      {usuarios.find(u => u.id === parseInt(formData.usuario_id))?.nome}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>ℹ️</strong> O usuário poderá escolher qual material usar (ou não usar nenhum) ao concluir a atividade
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/atividades')} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Atualizar' : 'Criar Atividade'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
