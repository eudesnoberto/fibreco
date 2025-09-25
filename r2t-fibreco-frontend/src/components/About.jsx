import { 
  Info, 
  Package, 
  ArrowUpDown, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Bell, 
  Shield,
  Smartphone,
  Globe,
  Database,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function About() {
  const features = [
    {
      icon: Package,
      title: 'Gestão de Materiais',
      description: 'Controle completo do estoque de materiais de fibra óptica com categorias, subcategorias e controle de quantidade mínima.',
      color: 'text-blue-600'
    },
    {
      icon: ArrowUpDown,
      title: 'Movimentações',
      description: 'Registro de entradas e saídas de materiais com histórico completo e geração de PDFs.',
      color: 'text-green-600'
    },
    {
      icon: ClipboardList,
      title: 'Atividades',
      description: 'Criação e gerenciamento de atividades para usuários com sistema de conclusão e relatórios.',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Gestão de Usuários',
      description: 'Sistema de usuários com 3 níveis: Fibreco, Supervisor e Administrador com permissões específicas.',
      color: 'text-orange-600'
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Dashboard com estatísticas e relatórios mensais detalhados em PDF.',
      color: 'text-indigo-600'
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Sistema de notificações em tempo real para atividades atribuídas e concluídas.',
      color: 'text-red-600'
    }
  ]

  const technicalFeatures = [
    {
      icon: Smartphone,
      title: '100% Responsivo',
      description: 'Interface adaptada para mobile, tablet e desktop'
    },
    {
      icon: Globe,
      title: 'PWA Ready',
      description: 'Aplicação web progressiva com funcionalidades offline'
    },
    {
      icon: Database,
      title: 'SQLite',
      description: 'Banco de dados local robusto e confiável'
    },
    {
      icon: Zap,
      title: 'Performance',
      description: 'Carregamento rápido e interface fluida'
    }
  ]

  const userRoles = [
    {
      role: 'Fibreco',
      description: 'Usuário comum que executa atividades e registra movimentações de saída',
      permissions: ['Visualizar materiais', 'Concluir atividades', 'Registrar saídas', 'Receber notificações']
    },
    {
      role: 'Supervisor',
      description: 'Gerencia atividades e supervisiona o trabalho dos fibres',
      permissions: ['Todas as permissões do Fibreco', 'Criar atividades', 'Visualizar relatórios', 'Gerenciar movimentações']
    },
    {
      role: 'Administrador',
      description: 'Acesso total ao sistema com todas as funcionalidades',
      permissions: ['Todas as permissões', 'Gerenciar usuários', 'Criar materiais', 'Acessar todos os relatórios']
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-4">
          <img 
            src="/logo-r2-3.png" 
            alt="R2T Fibreco Logo" 
            className="h-12 sm:h-16 w-auto"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">R2T Fibreco</h1>
            <p className="text-base sm:text-lg text-gray-600">Sistema de Controle de Material</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <Badge variant="outline" className="text-xs sm:text-sm">
            Versão 1.0.3
          </Badge>
          <Badge variant="secondary" className="text-xs sm:text-sm text-center">
            Desenvolvido por Eudes Alves
          </Badge>
        </div>
      </div>

      {/* Funcionalidades Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Funcionalidades Principais
          </CardTitle>
          <CardDescription>
            Sistema completo para gestão de materiais de fibra óptica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-start space-x-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`flex-shrink-0 ${feature.color}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Características Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Características Técnicas
          </CardTitle>
          <CardDescription>
            Tecnologias e recursos implementados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {technicalFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Níveis de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Níveis de Usuário
          </CardTitle>
          <CardDescription>
            Sistema de permissões baseado em roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {userRoles.map((user, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {user.role}
                  </h3>
                  <Badge variant={index === 0 ? 'secondary' : index === 1 ? 'default' : 'destructive'} className="text-xs w-fit">
                    {index === 0 ? 'Básico' : index === 1 ? 'Intermediário' : 'Avançado'}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                  {user.description}
                </p>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Permissões:</h4>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.map((permission, permIndex) => (
                      <Badge key={permIndex} variant="outline" className="text-xs px-2 py-1">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações da Versão */}
      <Card>
        <CardHeader>
          <CardTitle>Versão 1.0.2 - Novidades</CardTitle>
          <CardDescription>
            Últimas atualizações e melhorias implementadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:space-y-6">
            <div className="p-3 sm:p-4 border rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-600 mb-2 text-sm sm:text-base">✅ Novas Funcionalidades</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 ml-4">
                <li>• Sistema de notificações em tempo real</li>
                <li>• Interface 100% responsiva para mobile</li>
                <li>• Menu lateral com scroll funcional</li>
                <li>• Confirmação de exclusão de usuários</li>
                <li>• Timezone de Recife para atividades</li>
              </ul>
            </div>
            
            <div className="p-3 sm:p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-600 mb-2 text-sm sm:text-base">🔧 Melhorias</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 ml-4">
                <li>• Otimização da performance geral</li>
                <li>• Melhor experiência em dispositivos móveis</li>
                <li>• Interface mais intuitiva e moderna</li>
                <li>• Correção de bugs de responsividade</li>
                <li>• Melhor organização dos componentes</li>
              </ul>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg bg-purple-50">
              <h4 className="font-semibold text-purple-600 mb-2 text-sm sm:text-base">🛡️ Segurança</h4>
              <ul className="text-xs sm:text-sm text-gray-600 space-y-1 ml-4">
                <li>• Sistema de permissões aprimorado</li>
                <li>• Validação de dados melhorada</li>
                <li>• Proteção contra exclusão acidental</li>
                <li>• Autenticação JWT segura</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-4 sm:py-6 border-t">
        <p className="text-xs sm:text-sm text-gray-500">
          © 2025 R2T Fibreco - Sistema de Controle de Material
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Desenvolvido com React, Flask e SQLite
        </p>
      </div>
    </div>
  )
}
