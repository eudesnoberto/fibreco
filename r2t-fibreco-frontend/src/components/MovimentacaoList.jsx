import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ArrowUp, ArrowDown, Activity, Image as ImageIcon, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'

export function MovimentacaoList() {
  const { token } = useAuth()
  const [movimentacoes, setMovimentacoes] = useState([])
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMovimentacoes()
    fetchMateriais()
  }, [])

  const fetchMovimentacoes = async () => {
    if (!token) {
      console.error('Token não disponível')
      setLoading(false)
      return
    }

    try {
      // Como não temos uma rota específica para todas as movimentações,
      // vamos buscar as movimentações de cada material
      const materiaisResponse = await fetch('/api/materiais', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (materiaisResponse.ok) {
        const materiaisData = await materiaisResponse.json()
        
        const todasMovimentacoes = []
        for (const material of materiaisData) {
          try {
            const movResponse = await fetch(`/api/materiais/${material.id}/movimentacoes`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            if (movResponse.ok) {
              const movData = await movResponse.json()
              todasMovimentacoes.push(...movData)
            }
          } catch (error) {
            console.error(`Erro ao carregar movimentações do material ${material.id}:`, error)
          }
        }
        
        // Ordenar por data mais recente
        todasMovimentacoes.sort((a, b) => new Date(b.data_movimentacao) - new Date(a.data_movimentacao))
        setMovimentacoes(todasMovimentacoes)
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
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
        setMateriais(data)
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovimentacaoIcon = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'saida':
        return <ArrowDown className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-blue-600" />
    }
  }

  const getMovimentacaoBadge = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return <Badge className="bg-green-100 text-green-800">Entrada</Badge>
      case 'saida':
        return <Badge className="bg-red-100 text-red-800">Saída</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Ajuste</Badge>
    }
  }

  const gerarPDF = async (movimentacaoId) => {
    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      return
    }

    try {
      const response = await fetch(`/api/movimentacoes/${movimentacaoId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Criar blob e fazer download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `movimentacao_${movimentacaoId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Erro ao gerar PDF')
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF')
    }
  }

  const filteredMovimentacoes = movimentacoes.filter(mov =>
    mov.material_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.responsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Movimentações</h1>
          <p className="text-sm sm:text-base text-gray-600">Histórico de movimentações do estoque</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/movimentacoes/nova">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nova Movimentação</span>
            <span className="sm:hidden">Nova</span>
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar por material, responsável ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movimentações List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            Todas as movimentações de entrada e saída do estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMovimentacoes.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredMovimentacoes.map((mov) => (
                <div key={mov.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                      {getMovimentacaoIcon(mov.tipo_movimentacao)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{mov.material_nome}</h3>
                        <div className="flex-shrink-0">
                          {getMovimentacaoBadge(mov.tipo_movimentacao)}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                          <p className="truncate">
                            <span className="font-medium">Quantidade:</span> {mov.quantidade}
                            {mov.tipo_movimentacao === 'entrada' ? ' (entrada)' : ' (saída)'}
                          </p>
                          <p className="truncate">
                            <span className="font-medium">Estoque:</span> {mov.quantidade_anterior} → {mov.quantidade_atual}
                          </p>
                        </div>
                        {mov.motivo && (
                          <p className="truncate">
                            <span className="font-medium">Motivo:</span> {mov.motivo}
                          </p>
                        )}
                        {mov.responsavel_nome && (
                          <p className="truncate">
                            <span className="font-medium">Responsável:</span> {mov.responsavel_nome}
                          </p>
                        )}
                        {mov.imagens && mov.imagens.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                              <span className="text-xs sm:text-sm text-gray-500">
                                {mov.imagens.length} imagem{mov.imagens.length > 1 ? 's' : ''} anexada{mov.imagens.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex space-x-1 sm:space-x-2">
                              {mov.imagens.slice(0, 3).map((url, index) => (
                                <img
                                  key={index}
                                  src={url}
                                  alt={`Anexo ${index + 1}`}
                                  className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(url, '_blank')}
                                />
                              ))}
                              {mov.imagens.length > 3 && (
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                  +{mov.imagens.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-col sm:items-end space-y-2 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-500">{formatDate(mov.data_movimentacao)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => gerarPDF(mov.id)}
                      className="flex items-center space-x-1 w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>PDF</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

