import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, TrendingUp, Users, Package, Activity } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function RelatorioMensalDetalhado() {
  const { token, user } = useAuth()
  const [mesSelecionado, setMesSelecionado] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState('')
  const [relatorioData, setRelatorioData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Gerar opções de mês e ano
  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ]

  const anos = Array.from({ length: 5 }, (_, i) => {
    const ano = new Date().getFullYear() - i
    return { value: ano.toString(), label: ano.toString() }
  })

  // Definir mês e ano atual como padrão
  useEffect(() => {
    const agora = new Date()
    setMesSelecionado(agora.getMonth() + 1 < 10 ? `0${agora.getMonth() + 1}` : `${agora.getMonth() + 1}`)
    setAnoSelecionado(agora.getFullYear().toString())
  }, [])

  // Buscar dados do relatório quando mês/ano mudarem
  useEffect(() => {
    if (mesSelecionado && anoSelecionado) {
      fetchRelatorioData()
    }
  }, [mesSelecionado, anoSelecionado])

  const fetchRelatorioData = async () => {
    if (!token || !mesSelecionado || !anoSelecionado) return

    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/graficos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRelatorioData(data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const gerarPDFRelatorio = async () => {
    if (!token || !mesSelecionado || !anoSelecionado) return

    setGeneratingPDF(true)
    try {
      const response = await fetch(`/api/relatorios/mensal?mes=${mesSelecionado}&ano=${anoSelecionado}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio_mensal_${mesSelecionado}_${anoSelecionado}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Erro ao gerar relatório PDF')
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar relatório PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (user?.role !== 'admin' && user?.role !== 'supervisor') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso restrito a administradores e supervisores</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Mensal Detalhado</h1>
          <p className="text-gray-600">Análise completa das atividades e movimentações</p>
        </div>
        <div className="flex space-x-3">
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map((ano) => (
                <SelectItem key={ano.value} value={ano.value}>
                  {ano.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={gerarPDFRelatorio} 
            disabled={generatingPDF || !mesSelecionado || !anoSelecionado}
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {relatorioData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Criadas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {relatorioData.relatorio_mensal.atividades_criadas}
              </div>
              <p className="text-xs text-muted-foreground">
                {meses.find(m => m.value === mesSelecionado)?.label} {anoSelecionado}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades Concluídas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {relatorioData.relatorio_mensal.atividades_concluidas}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de conclusão: {relatorioData.relatorio_mensal.atividades_criadas > 0 
                  ? Math.round((relatorioData.relatorio_mensal.atividades_concluidas / relatorioData.relatorio_mensal.atividades_criadas) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {relatorioData.relatorio_mensal.movimentacoes}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de movimentações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materiais Usados</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {relatorioData.relatorio_mensal.materiais_mais_usados.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Tipos diferentes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Materiais Mais Usados */}
      {relatorioData && relatorioData.relatorio_mensal.materiais_mais_usados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Materiais Mais Utilizados</CardTitle>
            <CardDescription>
              Top 5 materiais com maior consumo no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorioData.relatorio_mensal.materiais_mais_usados.map((material, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{material.nome}</p>
                      <p className="text-sm text-gray-500">
                        {material.total_usado} unidades utilizadas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {material.total_usado}
                    </div>
                    <div className="text-xs text-gray-500">unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Atividades */}
      {relatorioData && relatorioData.atividades_por_status.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Atividades</CardTitle>
            <CardDescription>
              Distribuição das atividades por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatorioData.atividades_por_status.map((status) => {
                const statusMap = {
                  'pendente': { label: 'Pendentes', color: 'bg-yellow-100 text-yellow-800' },
                  'concluida': { label: 'Concluídas', color: 'bg-green-100 text-green-800' },
                  'cancelada': { label: 'Canceladas', color: 'bg-red-100 text-red-800' }
                }
                const statusInfo = statusMap[status.status] || { label: status.status, color: 'bg-gray-100 text-gray-800' }
                
                return (
                  <div key={status.status} className="text-center p-4 border rounded-lg">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                    <div className="text-2xl font-bold mt-2">{status.count}</div>
                    <div className="text-xs text-gray-500">atividades</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando dados do relatório...</p>
        </div>
      )}
    </div>
  )
}
