import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../contexts/AuthContext'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export function DashboardCharts() {
  const { token, user } = useAuth()
  const [chartsData, setChartsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartsData()
  }, [])

  const fetchChartsData = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/dashboard/graficos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setChartsData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!chartsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Erro ao carregar dados dos gráficos</p>
      </div>
    )
  }

  // Configuração do gráfico de pizza (Materiais por Categoria)
  const categoriasData = {
    labels: chartsData.materiais_por_categoria.map(item => item.categoria),
    datasets: [
      {
        data: chartsData.materiais_por_categoria.map(item => item.count),
        backgroundColor: [
          '#3B82F6', // Azul
          '#10B981', // Verde
          '#F59E0B', // Amarelo
          '#EF4444', // Vermelho
          '#8B5CF6', // Roxo
          '#06B6D4', // Ciano
          '#84CC16', // Lima
          '#F97316', // Laranja
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const categoriasOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Materiais por Categoria',
      },
    },
  }

  // Configuração do gráfico de linha (Movimentações Mensais)
  const meses = Object.keys(chartsData.movimentacoes_por_mes).sort()
  const movimentacoesData = {
    labels: meses.map(mes => {
      const [ano, mesNum] = mes.split('-')
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      return `${mesesNomes[parseInt(mesNum) - 1]}/${ano.slice(-2)}`
    }),
    datasets: [
      {
        label: 'Entradas',
        data: meses.map(mes => chartsData.movimentacoes_por_mes[mes]?.entrada?.count || 0),
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        tension: 0.4,
      },
      {
        label: 'Saídas',
        data: meses.map(mes => chartsData.movimentacoes_por_mes[mes]?.saida?.count || 0),
        borderColor: '#EF4444',
        backgroundColor: '#EF444420',
        tension: 0.4,
      },
      {
        label: 'Ajustes',
        data: meses.map(mes => chartsData.movimentacoes_por_mes[mes]?.ajuste?.count || 0),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        tension: 0.4,
      },
    ],
  }

  const movimentacoesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Movimentações dos Últimos 6 Meses',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  // Configuração do gráfico de barras (Atividades por Status)
  const atividadesData = {
    labels: chartsData.atividades_por_status.map(item => {
      const statusMap = {
        'pendente': 'Pendentes',
        'concluida': 'Concluídas',
        'cancelada': 'Canceladas'
      }
      return statusMap[item.status] || item.status
    }),
    datasets: [
      {
        label: 'Quantidade',
        data: chartsData.atividades_por_status.map(item => item.count),
        backgroundColor: [
          '#F59E0B', // Amarelo para pendentes
          '#10B981', // Verde para concluídas
          '#EF4444', // Vermelho para canceladas
        ],
        borderColor: [
          '#D97706',
          '#059669',
          '#DC2626',
        ],
        borderWidth: 1,
      },
    ],
  }

  const atividadesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Atividades por Status',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  // Configuração do gráfico de barras (Materiais Mais Usados)
  const materiaisUsadosData = {
    labels: chartsData.relatorio_mensal.materiais_mais_usados.map(item => item.nome),
    datasets: [
      {
        label: 'Quantidade Usada',
        data: chartsData.relatorio_mensal.materiais_mais_usados.map(item => item.total_usado),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
      },
    ],
  }

  const materiaisUsadosOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Materiais Mais Usados (Mês Atual)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Relatório Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Mensal - {chartsData.relatorio_mensal.mes}</CardTitle>
          <CardDescription>
            Resumo das atividades e movimentações do mês atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {chartsData.relatorio_mensal.atividades_criadas}
              </div>
              <div className="text-sm text-gray-600">Atividades Criadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {chartsData.relatorio_mensal.atividades_concluidas}
              </div>
              <div className="text-sm text-gray-600">Atividades Concluídas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {chartsData.relatorio_mensal.movimentacoes}
              </div>
              <div className="text-sm text-gray-600">Movimentações</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {chartsData.relatorio_mensal.materiais_mais_usados.length}
              </div>
              <div className="text-sm text-gray-600">Materiais Usados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gráfico de Pizza - Materiais por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Materiais por Categoria</CardTitle>
            <CardDescription>
              Distribuição dos materiais por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={categoriasData} options={categoriasOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Movimentações Mensais */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações Mensais</CardTitle>
            <CardDescription>
              Tendência de movimentações nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line data={movimentacoesData} options={movimentacoesOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Atividades por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Status</CardTitle>
            <CardDescription>
              Distribuição das atividades por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={atividadesData} options={atividadesOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Materiais Mais Usados */}
        {chartsData.relatorio_mensal.materiais_mais_usados.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Materiais Mais Usados (Mês Atual)</CardTitle>
              <CardDescription>
                Top 5 materiais mais utilizados no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={materiaisUsadosData} options={materiaisUsadosOptions} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
