import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'

export function MaterialList() {
  const { token, user } = useAuth()
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    fetchMateriais()
    fetchCategorias()
  }, [])

  const fetchMateriais = async () => {
    if (!token) {
      console.error('Token não disponível')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('categoria', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)
      
      const response = await fetch(`/api/materiais?${params}`, {
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
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/categorias', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const deleteMaterial = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este material?')) {
      if (!token) {
        alert('Token de acesso não disponível. Faça login novamente.')
        return
      }

      try {
        const response = await fetch(`/api/materiais/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          fetchMateriais()
        }
      } catch (error) {
        console.error('Erro ao excluir material:', error)
      }
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sem_estoque':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle size={12} />
          Sem Estoque
        </Badge>
      case 'estoque_baixo':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <AlertTriangle size={12} />
          Estoque Baixo
        </Badge>
      case 'estoque_ok':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle size={12} />
          Estoque OK
        </Badge>
      default:
        return null
    }
  }

  const filteredMateriais = materiais.filter(material =>
    material.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (material.subcategoria && material.subcategoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (material.codigo_interno && material.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    fetchMateriais()
  }, [selectedCategory, selectedStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Materiais</h1>
          <p className="text-gray-600 text-sm sm:text-base">Gerencie o estoque de materiais de fibra óptica</p>
        </div>
        {user?.role === 'admin' && (
          <Button asChild className="w-full sm:w-auto">
            <Link to="/materiais/novo">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Novo Material</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Buscar por nome, categoria, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
              >
                <option value="">Todas as categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria} className="capitalize">
                    {categoria}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 sm:flex-none sm:w-40"
              >
                <option value="">Todos os status</option>
                <option value="estoque_ok">Estoque OK</option>
                <option value="estoque_baixo">Estoque Baixo</option>
                <option value="sem_estoque">Sem Estoque</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {filteredMateriais.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Nenhum material encontrado</p>
          </div>
        ) : (
          filteredMateriais.map((material) => (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{material.nome}</CardTitle>
                    <CardDescription className="capitalize text-xs sm:text-sm">
                      {material.categoria}
                      {material.subcategoria && ` • ${material.subcategoria}`}
                    </CardDescription>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(material.status_estoque)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-gray-500">Quantidade</p>
                    <p className="font-medium">{material.quantidade} {material.unidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mínimo</p>
                    <p className="font-medium">{material.quantidade_minima} {material.unidade}</p>
                  </div>
                  {material.localizacao && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Localização</p>
                      <p className="font-medium text-sm">{material.localizacao}</p>
                    </div>
                  )}
                  {material.codigo_interno && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Código</p>
                      <p className="font-medium text-sm">{material.codigo_interno}</p>
                    </div>
                  )}
                  {material.preco_unitario && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Preço Unitário</p>
                      <p className="font-medium">R$ {material.preco_unitario.toFixed(2)}</p>
                    </div>
                  )}
                  {material.usuario_nome && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Usuário Responsável</p>
                      <p className="font-medium text-sm text-blue-600">{material.usuario_nome}</p>
                    </div>
                  )}
                </div>
                
                {user?.role === 'admin' && (
                  <div className="flex justify-end space-x-2 pt-3 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/materiais/editar/${material.id}`}>
                        <Edit size={14} className="mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteMaterial(material.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

