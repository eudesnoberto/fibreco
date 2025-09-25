import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  XCircle,
  User,
  Package,
  Calendar,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'

export function AtividadeList() {
  const { token, user } = useAuth()
  const [atividades, setAtividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showConcluirModal, setShowConcluirModal] = useState(false)
  const [atividadeParaConcluir, setAtividadeParaConcluir] = useState(null)
  const [materiais, setMateriais] = useState([])
  const [materiaisUsados, setMateriaisUsados] = useState([])
  const [descricaoServico, setDescricaoServico] = useState('')
  const [imagensConclusao, setImagensConclusao] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [endereco, setEndereco] = useState('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false)
  const [geolocalizacaoInicializada, setGeolocalizacaoInicializada] = useState(false)

  useEffect(() => {
    fetchAtividades()
    fetchMateriais()
  }, [])

  const fetchAtividades = async () => {
    if (!token) {
      console.error('Token não disponível')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      if (selectedStatus) params.append('status', selectedStatus)
      
      const url = `/api/atividades?${params}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAtividades(data)
      } else {
        const error = await response.json()
        console.error('Erro ao buscar atividades:', error)
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMateriais = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/materiais', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas materiais com quantidade > 0
        const materiaisDisponiveis = data.filter(material => material.quantidade > 0)
        setMateriais(materiaisDisponiveis)
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    }
  }

  const deleteAtividade = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return

    try {
      const response = await fetch(`/api/atividades/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        fetchAtividades()
      } else {
        alert('Erro ao excluir atividade')
      }
    } catch (error) {
      console.error('Erro ao excluir atividade:', error)
      alert('Erro ao excluir atividade')
    }
  }

  const abrirModalConcluir = (atividade) => {
    setAtividadeParaConcluir(atividade)
    setMateriaisUsados([])
    setDescricaoServico('')
    setImagensConclusao([])
    setLatitude('')
    setLongitude('')
    setEndereco('')
    setGeolocalizacaoInicializada(false) // Reset para permitir nova inicialização
    setShowConcluirModal(true)
    
    // Inicializar geolocalização automaticamente após um pequeno delay
    setTimeout(() => {
      inicializarGeolocalizacao()
    }, 500)
  }

  const adicionarMaterial = () => {
    setMateriaisUsados([...materiaisUsados, { material_id: '', quantidade_usada: 0 }])
  }

  const removerMaterial = (index) => {
    setMateriaisUsados(materiaisUsados.filter((_, i) => i !== index))
  }

  const atualizarMaterial = (index, field, value) => {
    const novosMateriais = [...materiaisUsados]
    novosMateriais[index][field] = value
    setMateriaisUsados(novosMateriais)
  }

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    const uploadedUrls = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          uploadedUrls.push(result.url)
        } else {
          console.error('Erro ao fazer upload da imagem:', file.name)
        }
      }

      setImagensConclusao([...imagensConclusao, ...uploadedUrls])
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploadingImages(false)
    }
  }

  const removerImagem = (index) => {
    setImagensConclusao(imagensConclusao.filter((_, i) => i !== index))
  }

  const inicializarGeolocalizacao = () => {
    if (!navigator.geolocation) {
      console.log('Geolocalização não é suportada por este navegador.')
      return
    }

    if (geolocalizacaoInicializada) {
      return // Já foi inicializada
    }

    setObtendoLocalizacao(true)
    setGeolocalizacaoInicializada(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        
        // Tentar obter o endereço usando reverse geocoding
        obterEnderecoPorCoordenadas(lat, lng)
        
        setObtendoLocalizacao(false)
        console.log('✅ Localização obtida automaticamente!')
      },
      (error) => {
        console.error('Erro ao obter localização automaticamente:', error)
        setObtendoLocalizacao(false)
        setGeolocalizacaoInicializada(false) // Permite tentar novamente
        
        // Não mostrar alerta para inicialização automática, apenas log
        console.log('Geolocalização automática falhou, usuário pode inserir manualmente')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Timeout menor para inicialização automática
        maximumAge: 300000 // 5 minutos
      }
    )
  }

  const obterGeolocalizacao = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada por este navegador.')
      return
    }

    setObtendoLocalizacao(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        
        // Tentar obter o endereço usando reverse geocoding
        obterEnderecoPorCoordenadas(lat, lng)
        
        setObtendoLocalizacao(false)
        alert('✅ Localização obtida com sucesso!')
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        setObtendoLocalizacao(false)
        
        let errorMessage = 'Erro ao obter localização: '
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permissão negada. Por favor, permita o acesso à localização nas configurações do navegador.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Localização indisponível. Verifique se o GPS está ativado.'
            break
          case error.TIMEOUT:
            errorMessage += 'Tempo limite excedido. Tente novamente.'
            break
          default:
            errorMessage += 'Erro desconhecido.'
            break
        }
        
        alert(errorMessage + '\n\nVocê pode inserir as coordenadas manualmente nos campos abaixo.')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutos
      }
    )
  }

  const obterEnderecoPorCoordenadas = async (lat, lng) => {
    try {
      // Usar a API de reverse geocoding do OpenStreetMap (gratuita)
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      const data = await response.json()
      
      if (data && data.display_name) {
        // Formatar o endereço de forma mais limpa
        const enderecoFormatado = formatarEndereco(data)
        setEndereco(enderecoFormatado)
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error)
      // Não mostrar erro para o usuário, pois as coordenadas já foram obtidas
    }
  }

  const formatarEndereco = (data) => {
    const address = data.address || {}
    const parts = []
    
    if (address.house_number && address.road) {
      parts.push(`${address.road}, ${address.house_number}`)
    } else if (address.road) {
      parts.push(address.road)
    }
    
    if (address.suburb || address.neighbourhood) {
      parts.push(address.suburb || address.neighbourhood)
    }
    
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village)
    }
    
    if (address.state) {
      parts.push(address.state)
    }
    
    return parts.join(' - ')
  }

  const concluirAtividade = async () => {
    if (!atividadeParaConcluir) return

    try {
      const requestData = {
        descricao_servico: descricaoServico,
        imagens_conclusao: imagensConclusao,
        materiais_usados: materiaisUsados.filter(m => m.material_id && m.quantidade_usada > 0),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        endereco: endereco
      }

      const response = await fetch(`/api/atividades/${atividadeParaConcluir.id}/concluir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const result = await response.json()
        fetchAtividades()
        setShowConcluirModal(false)
        alert(result.message)
      } else {
        const error = await response.json()
        alert(`Erro ao concluir atividade:\n\n${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao concluir atividade:', error)
      alert('Erro de conexão ao concluir atividade')
    }
  }

  const gerarPDFAtividade = async (atividadeId) => {
    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      return
    }

    setGeneratingPDF(true)
    
    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      setGeneratingPDF(false)
      alert('⏰ Timeout: A geração do PDF está demorando mais que o esperado. Tente novamente.')
    }, 30000) // 30 segundos
    
    try {
      const response = await fetch(`/api/atividades/${atividadeId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      clearTimeout(timeoutId) // Limpar timeout se a requisição completar

      if (response.ok) {
        // Criar blob e fazer download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `atividade_${atividadeId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Mostrar mensagem de sucesso
        alert('✅ PDF gerado e baixado com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao gerar PDF: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      clearTimeout(timeoutId) // Limpar timeout em caso de erro
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF')
    } finally {
      setGeneratingPDF(false)
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
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'em_andamento':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'concluida':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelada':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const filteredAtividades = atividades.filter(atividade =>
    atividade.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    atividade.usuario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    atividade.material_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const canCreateAtividade = user?.role === 'supervisor' || user?.role === 'admin'
  const canEditAtividade = (atividade) => {
    if (user?.role === 'admin') return true
    if (user?.role === 'supervisor') return atividade.supervisor_id === user.id
    return false
  }

  return (
    <div className="space-y-6">
      {/* Loading Overlay para PDF */}
      {generatingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center shadow-xl">
            {/* Spinner animado */}
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
            
            {/* Ícone de PDF */}
            <div className="text-4xl mb-4">📄</div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerando PDF...</h3>
            <p className="text-gray-600 text-sm mb-4">
              Por favor, aguarde enquanto o relatório é processado.
            </p>
            
            {/* Barra de progresso animada */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            
            <p className="text-xs text-gray-500">
              Isso pode levar alguns segundos...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {user?.role === 'supervisor' || user?.role === 'admin' 
              ? 'Gerencie atividades para usuários' 
              : 'Suas atividades atribuídas'
            }
          </p>
        </div>
        {canCreateAtividade && (
          <Button asChild className="w-full sm:w-auto">
            <Link to="/atividades/nova">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Atividade</span>
              <span className="sm:hidden">Nova</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar por título, usuário ou material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm md:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <Button variant="outline" onClick={fetchAtividades} className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Filtrar</span>
                <span className="sm:hidden">Filtrar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atividades List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Atividades</CardTitle>
          <CardDescription>
            {filteredAtividades.length} atividade(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          ) : filteredAtividades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAtividades.map((atividade) => (
                <div key={atividade.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(atividade.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{atividade.titulo}</h3>
                        {getStatusBadge(atividade.status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{atividade.usuario_nome}</span>
                        </div>
                        {atividade.material_nome && (
                          <div className="flex items-center space-x-1">
                            <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{atividade.material_nome} ({atividade.quantidade_necessaria} unid.)</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Criada em: {formatDate(atividade.data_criacao)}</span>
                        </div>
                      </div>
                      {atividade.descricao && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-2">{atividade.descricao}</p>
                      )}
                      {atividade.data_limite && (
                        <p className="text-xs sm:text-sm text-orange-600 mt-1">
                          <strong>Prazo:</strong> {formatDate(atividade.data_limite)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                    {/* Botão Visualizar - sempre visível */}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                    >
                      <Link to={`/atividades/visualizar/${atividade.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Visualizar</span>
                        <span className="sm:hidden">Ver</span>
                      </Link>
                    </Button>
                    
                    {atividade.status === 'pendente' && user?.role === 'user' && atividade.usuario_id === user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalConcluir(atividade)}
                        className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                        title="Concluir atividade e registrar saída de estoque"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Concluir</span>
                        <span className="sm:hidden">Concluir</span>
                      </Button>
                    )}
                    {atividade.status === 'pendente' && user?.role === 'supervisor' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalConcluir(atividade)}
                        className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                        title="Concluir atividade (supervisor)"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Concluir</span>
                        <span className="sm:hidden">Concluir</span>
                      </Button>
                    )}
                    {atividade.status === 'pendente' && user?.role === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalConcluir(atividade)}
                        className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                        title="Concluir atividade (admin)"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Concluir</span>
                        <span className="sm:hidden">Concluir</span>
                      </Button>
                    )}
                    {canEditAtividade(atividade) && (
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                        <Link to={`/atividades/editar/${atividade.id}`}>
                          <Edit size={14} className="mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                          <span className="sm:hidden">Editar</span>
                        </Link>
                      </Button>
                    )}
                    {atividade.status === 'concluida' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => gerarPDFAtividade(atividade.id)}
                        disabled={generatingPDF}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      >
                        {generatingPDF ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                            <span className="hidden sm:inline">Gerando...</span>
                            <span className="sm:hidden">Gerando...</span>
                          </>
                        ) : (
                          <>
                            📄 <span className="hidden sm:inline">PDF</span>
                            <span className="sm:hidden">PDF</span>
                          </>
                        )}
                      </Button>
                    )}
                    {canEditAtividade(atividade) && atividade.status === 'pendente' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteAtividade(atividade.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto"
                      >
                        <Trash2 size={14} className="mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                        <span className="sm:hidden">Excluir</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Conclusão de Atividade */}
      {showConcluirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Concluir Atividade</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              <strong>{atividadeParaConcluir?.titulo}</strong>
            </p>
            
            <div className="space-y-6">
              {/* Descrição do Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do Serviço Realizado
                </label>
                <textarea
                  value={descricaoServico}
                  onChange={(e) => setDescricaoServico(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="Descreva o serviço que foi realizado..."
                />
              </div>

              {/* Geolocalização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização do Serviço (opcional)
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                  <p className="text-sm text-blue-800">
                    <strong>📍 Geolocalização Automática:</strong> Sua localização está sendo capturada automaticamente
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                    <li>Permita o acesso à localização quando solicitado pelo navegador</li>
                    <li>Os campos serão preenchidos automaticamente</li>
                    <li>Ou clique no botão GPS para tentar novamente</li>
                    <li>Ou insira as coordenadas manualmente se preferir</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  {obtendoLocalizacao && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <span className="text-sm text-green-800">Obtendo localização automaticamente...</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Ex: -23.550520"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Ex: -46.633308"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={obterGeolocalizacao}
                        disabled={obtendoLocalizacao}
                        className={`px-3 py-2 text-white text-sm rounded flex items-center gap-1 ${
                          obtendoLocalizacao 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title="Clique para obter sua localização atual automaticamente"
                      >
                        {obtendoLocalizacao ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Obtendo...
                          </>
                        ) : (
                          <>
                            📍 GPS
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Ex: Rua das Flores, 123 - Centro, São Paulo - SP"
                    />
                  </div>
                </div>
              </div>

              {/* Materiais Usados */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Materiais Usados (opcional)
                  </label>
                  <button
                    onClick={adicionarMaterial}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    + Adicionar Material
                  </button>
                </div>
                
                {materiaisUsados.map((material, index) => (
                  <div key={index} className="flex gap-3 mb-3 p-3 border border-gray-200 rounded">
                    <div className="flex-1">
                      <select
                        value={material.material_id}
                        onChange={(e) => atualizarMaterial(index, 'material_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione um material</option>
                        {materiais.map(mat => (
                          <option key={mat.id} value={mat.id}>
                            {mat.nome} (Estoque: {mat.quantidade} {mat.unidade})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={material.quantidade_usada}
                        onChange={(e) => atualizarMaterial(index, 'quantidade_usada', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Qtd"
                      />
                    </div>
                    <button
                      onClick={() => removerMaterial(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload de Imagens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagens da Conclusão (opcional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={uploadingImages}
                />
                {uploadingImages && (
                  <p className="text-sm text-blue-600 mt-1">Fazendo upload das imagens...</p>
                )}
                
                {/* Preview das imagens */}
                {imagensConclusao.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imagensConclusao.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removerImagem(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowConcluirModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={concluirAtividade}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Concluir Atividade</span>
                <span className="sm:hidden">Concluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
