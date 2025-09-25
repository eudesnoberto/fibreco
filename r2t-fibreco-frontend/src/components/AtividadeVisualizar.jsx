import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'

export function AtividadeVisualizar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [atividade, setAtividade] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAtividade()
  }, [id])

  const fetchAtividade = async () => {
    if (!token) {
      setError('Token não disponível')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/atividades/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAtividade(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar atividade')
      }
    } catch (error) {
      console.error('Erro ao carregar atividade:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      case 'concluida':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'em_andamento':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'concluida':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'cancelada':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEdit = () => {
    if (user?.role === 'admin') return true
    if (user?.role === 'supervisor') return atividade?.supervisor_id === user.id
    return false
  }

  const canComplete = () => {
    if (atividade?.status !== 'pendente') return false
    if (user?.role === 'admin') return true
    if (user?.role === 'supervisor') return true
    if (user?.role === 'user') return atividade?.usuario_id === user.id
    return false
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/atividades')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar atividade</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!atividade) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/atividades')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Atividade não encontrada</h3>
              <p className="text-gray-600">A atividade solicitada não foi encontrada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/atividades')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Detalhes da Atividade</h1>
            <p className="text-gray-600 text-sm sm:text-base">Visualização completa da atividade</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {canEdit() && atividade.status === 'pendente' && (
            <Button variant="outline" asChild>
              <Link to={`/atividades/editar/${atividade.id}`}>
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Editar</span>
                <span className="sm:hidden">Editar</span>
              </Link>
            </Button>
          )}
          {canComplete() && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/atividades')}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Concluir</span>
              <span className="sm:hidden">Concluir</span>
            </Button>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-3">
                {getStatusIcon(atividade.status)}
                <span>{atividade.titulo}</span>
              </CardTitle>
              <CardDescription className="mt-2">
                {atividade.descricao || 'Sem descrição'}
              </CardDescription>
            </div>
            {getStatusBadge(atividade.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Responsável</p>
                    <p className="font-medium">{atividade.usuario_nome || 'N/A'}</p>
                  </div>
                </div>

                {atividade.material_nome && (
                  <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Material</p>
                      <p className="font-medium">
                        {atividade.material_nome} ({atividade.quantidade_necessaria} unid.)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Criada em</p>
                    <p className="font-medium">{formatDate(atividade.data_criacao)}</p>
                  </div>
                </div>

                {atividade.data_limite && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Prazo</p>
                      <p className="font-medium text-orange-600">{formatDate(atividade.data_limite)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações de Conclusão (se aplicável) */}
            {atividade.status === 'concluida' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Informações de Conclusão</h3>
                
                <div className="space-y-3">
                  {atividade.data_conclusao && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Concluída em</p>
                        <p className="font-medium">{formatDate(atividade.data_conclusao)}</p>
                      </div>
                    </div>
                  )}

                  {atividade.descricao_servico && (
                    <div className="flex items-start space-x-3">
                      <FileText className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Descrição do Serviço</p>
                        <p className="font-medium text-sm">{atividade.descricao_servico}</p>
                      </div>
                    </div>
                  )}

                  {atividade.endereco && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Localização</p>
                        <p className="font-medium text-sm">{atividade.endereco}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Imagens de Conclusão (se houver) */}
      {atividade.status === 'concluida' && atividade.imagens_conclusao && atividade.imagens_conclusao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Imagens da Conclusão</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {atividade.imagens_conclusao.map((imagem, index) => (
                <div key={index} className="relative">
                  <div className="w-full h-48 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imagem}
                      alt={`Imagem ${index + 1} da conclusão`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(imagem, '_blank')}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    {/* Error placeholder */}
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Erro ao carregar imagem</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">Clique para ampliar</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materiais Usados (se houver) */}
      {atividade.status === 'concluida' && atividade.materiais_usados && atividade.materiais_usados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Materiais Utilizados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atividade.materiais_usados.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{material.material_nome}</p>
                    <p className="text-sm text-gray-500">Código: {material.material_codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{material.quantidade_usada} {material.material_unidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

