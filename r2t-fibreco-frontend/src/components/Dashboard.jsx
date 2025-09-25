import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Plus,
  ArrowUpDown,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { DashboardCharts } from './DashboardCharts'

export function Dashboard() {
  const { token, user } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    total_materiais: 0,
    materiais_sem_estoque: 0,
    materiais_estoque_baixo: 0,
    ultimas_movimentacoes: [],
    materiais_por_categoria: []
  })
  const [loading, setLoading] = useState(true)
  const [showCharts, setShowCharts] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!token) {
      console.error('Token não disponível')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
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

  const getStatusColor = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return 'text-green-600'
      case 'saida':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Visão geral do estoque de materiais</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowCharts(!showCharts)}
            className="w-full sm:w-auto"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}</span>
            <span className="sm:hidden">{showCharts ? 'Ocultar' : 'Gráficos'}</span>
          </Button>
          {user?.role === 'admin' && (
            <Button asChild className="w-full sm:w-auto">
              <Link to="/materiais/novo">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Novo Material</span>
                <span className="sm:hidden">Novo</span>
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/movimentacoes/nova">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nova Movimentação</span>
              <span className="sm:hidden">Movimentação</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Materiais</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{dashboardData.total_materiais}</div>
            <p className="text-xs text-muted-foreground">
              Materiais cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">{dashboardData.materiais_sem_estoque}</div>
            <p className="text-xs text-muted-foreground">
              Materiais zerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{dashboardData.materiais_estoque_baixo}</div>
            <p className="text-xs text-muted-foreground">
              Abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Movimentações</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{dashboardData.ultimas_movimentacoes.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 10
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Últimas Movimentações */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
            <CardDescription>
              Movimentações mais recentes do estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.ultimas_movimentacoes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma movimentação encontrada
                </p>
              ) : (
                dashboardData.ultimas_movimentacoes.map((mov) => (
                  <div key={mov.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium text-sm">{mov.material_nome}</p>
                      <p className="text-xs text-gray-500">
                        {mov.responsavel} • {formatDate(mov.data_movimentacao)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${getStatusColor(mov.tipo_movimentacao)}`}>
                        {mov.tipo_movimentacao === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </p>
                      <p className="text-xs text-gray-500">
                        {mov.tipo_movimentacao}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {dashboardData.ultimas_movimentacoes.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/movimentacoes">Ver todas</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materiais por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Materiais por Categoria</CardTitle>
            <CardDescription>
              Distribuição dos materiais cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.materiais_por_categoria.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma categoria encontrada
                </p>
              ) : (
                dashboardData.materiais_por_categoria.map((cat) => (
                  <div key={cat.categoria} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">{cat.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{cat.count}</p>
                      <p className="text-xs text-gray-500">materiais</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {dashboardData.materiais_por_categoria.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/materiais">Ver materiais</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Relatórios */}
      {showCharts && (
        <div className="mt-8">
          <DashboardCharts />
        </div>
      )}
    </div>
  )
}

