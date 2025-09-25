import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Calendar, Download, BarChart3, Users, Package, TrendingUp } from 'lucide-react'

const Relatorios = () => {
  const { user, token } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [generatingReport, setGeneratingReport] = useState(false)
  const [stats, setStats] = useState(null)

  // Verificar se é admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar relatórios.</p>
        </div>
      </div>
    )
  }

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const gerarRelatorioMensal = async () => {
    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      return
    }

    setGeneratingReport(true)
    
    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      setGeneratingReport(false)
      alert('⏰ Timeout: A geração do relatório está demorando mais que o esperado. Tente novamente.')
    }, 60000) // 60 segundos para relatórios mais complexos
    
    try {
      const response = await fetch(`/api/relatorios/mensal?mes=${selectedMonth}&ano=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        // Criar blob e fazer download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio_mensal_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        alert('✅ Relatório mensal gerado e baixado com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro ao gerar relatório: ${error.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório')
    } finally {
      setGeneratingReport(false)
    }
  }

  const obterEstatisticasRapidas = async () => {
    if (!token) return

    try {
      // Buscar dados básicos para estatísticas rápidas
      const [atividadesResponse, materiaisResponse] = await Promise.all([
        fetch('/api/atividades', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/materiais', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (atividadesResponse.ok && materiaisResponse.ok) {
        const atividades = await atividadesResponse.json()
        const materiais = await materiaisResponse.json()
        
        // Calcular estatísticas básicas
        const totalAtividades = atividades.length
        const atividadesConcluidas = atividades.filter(a => a.status === 'concluida').length
        const atividadesPendentes = atividades.filter(a => a.status === 'pendente').length
        const taxaConclusao = totalAtividades > 0 ? (atividadesConcluidas / totalAtividades * 100) : 0
        
        const materiaisComEstoque = materiais.filter(m => m.quantidade > 0).length
        const materiaisSemEstoque = materiais.filter(m => m.quantidade === 0).length
        
        setStats({
          totalAtividades,
          atividadesConcluidas,
          atividadesPendentes,
          taxaConclusao,
          totalMateriais: materiais.length,
          materiaisComEstoque,
          materiaisSemEstoque
        })
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
    }
  }

  useEffect(() => {
    obterEstatisticasRapidas()
  }, [])

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {generatingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
            </div>
            
            <div className="text-4xl mb-4">📊</div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerando Relatório...</h3>
            <p className="text-gray-600 text-sm mb-4">
              Processando dados do mês {months[selectedMonth - 1]?.label}/{selectedYear}
            </p>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
            
            <p className="text-xs text-gray-500">
              Isso pode levar alguns minutos...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Relatórios e estatísticas do sistema</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>Admin: {user?.nome_completo}</span>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Atividades</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAtividades}</div>
              <p className="text-xs text-muted-foreground">
                {stats.atividadesConcluidas} concluídas, {stats.atividadesPendentes} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taxaConclusao.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Eficiência geral
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiais</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMateriais}</div>
              <p className="text-xs text-muted-foreground">
                {stats.materiaisComEstoque} com estoque, {stats.materiaisSemEstoque} zerados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Dados no relatório mensal
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Relatório Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={20} />
            Relatório Mensal
          </CardTitle>
          <CardDescription>
            Gere um relatório completo com estatísticas, performance de usuários e movimentações do mês selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium text-blue-900 mb-2">📊 O que inclui o relatório:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Resumo executivo com métricas principais</li>
              <li>• Performance individual por usuário</li>
              <li>• Materiais mais utilizados</li>
              <li>• Movimentações de estoque</li>
              <li>• Taxa de conclusão de atividades</li>
            </ul>
          </div>

          <Button
            onClick={gerarRelatorioMensal}
            disabled={generatingReport}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Gerando Relatório...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Gerar Relatório Mensal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              ✓
            </Badge>
            <div>
              <p className="font-medium">Acesso Restrito</p>
              <p className="text-sm text-gray-600">Apenas administradores podem gerar relatórios mensais.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              📄
            </Badge>
            <div>
              <p className="font-medium">Formato PDF</p>
              <p className="text-sm text-gray-600">Relatórios são gerados em formato PDF para fácil compartilhamento.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              📊
            </Badge>
            <div>
              <p className="font-medium">Dados Históricos</p>
              <p className="text-sm text-gray-600">Acesse dados de qualquer mês/ano para análise comparativa.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Relatorios

