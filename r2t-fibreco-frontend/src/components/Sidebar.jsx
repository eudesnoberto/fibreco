import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  Plus,
  Users,
  Settings,
  Menu,
  X,
  ClipboardList,
  BarChart3,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../contexts/AuthContext'

export function Sidebar({ open, setOpen }) {
  const location = useLocation()
  const { isAdmin, isSupervisor } = useAuth()

  // Função para fechar o menu em dispositivos móveis
  const handleLinkClick = () => {
    // Verifica se a tela é menor que lg (1024px) - modo mobile/tablet
    if (window.innerWidth < 1024) {
      setOpen(false)
    }
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['user', 'supervisor', 'admin']
    },
    {
      title: 'Materiais',
      icon: Package,
      path: '/materiais',
      roles: ['user', 'supervisor', 'admin']
    },
    {
      title: 'Movimentações',
      icon: ArrowUpDown,
      path: '/movimentacoes',
      roles: ['user', 'supervisor', 'admin']
    },
    {
      title: 'Atividades',
      icon: ClipboardList,
      path: '/atividades',
      roles: ['user', 'supervisor', 'admin']
    },
    {
      title: 'Usuários',
      icon: Users,
      path: '/usuarios',
      roles: ['admin']
    },
    {
      title: 'Relatórios',
      icon: BarChart3,
      path: '/relatorios',
      roles: ['admin']
    },
    {
      title: 'Relatório Mensal',
      icon: BarChart3,
      path: '/relatorios/mensal',
      roles: ['supervisor', 'admin']
    },
    {
      title: 'Sobre',
      icon: Info,
      path: '/sobre',
      roles: ['user', 'supervisor', 'admin']
    }
  ]

  const quickActions = [
    {
      title: 'Novo Material',
      icon: Plus,
      path: '/materiais/novo',
      roles: ['admin']
    },
    {
      title: 'Nova Movimentação',
      icon: ArrowUpDown,
      path: '/movimentacoes/nova',
      roles: ['user', 'supervisor', 'admin']
    },
    {
      title: 'Nova Atividade',
      icon: ClipboardList,
      path: '/atividades/nova',
      roles: ['supervisor', 'admin']
    }
  ]

  const canAccess = (roles) => {
    if (isAdmin()) return true
    if (isSupervisor()) return roles.includes('supervisor')
    return roles.includes('user')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 mobile-overlay z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 w-64 border-r border-gray-200 flex-col">

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {menuItems
              .filter(item => canAccess(item.roles))
              .map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        {/* Quick Actions */}
        <div className="p-3 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Ações Rápidas
          </h3>
          <ul className="space-y-1">
            {quickActions
              .filter(action => canAccess(action.roles))
              .map((action) => (
                <li key={action.path}>
                  <Link
                    to={action.path}
                    onClick={handleLinkClick}
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <action.icon className="flex-shrink-0 h-5 w-5 mr-3" />
                    <span className="truncate">{action.title}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
        
        <div className="h-4"></div>
      </div>

      {/* Sidebar Mobile */}
      <div className={`lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 transition-all duration-300 ${
        open ? 'w-64' : 'w-0'
      } border-r border-gray-200 flex flex-col`}>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {menuItems
              .filter(item => canAccess(item.roles))
              .map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      {open && <span className="font-medium truncate">{item.title}</span>}
                    </Link>
                  </li>
                )
              })}
          </ul>

          {/* Quick Actions */}
          {open && quickActions.some(action => canAccess(action.roles)) && (
            <div className="mt-8 px-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Ações Rápidas
              </h3>
              <ul className="space-y-1">
                {quickActions
                  .filter(action => canAccess(action.roles))
                  .map((action) => {
                    const Icon = action.icon
                    return (
                      <li key={action.path}>
                        <Link
                          to={action.path}
                          onClick={handleLinkClick}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Icon size={16} className="flex-shrink-0" />
                          <span className="text-sm truncate">{action.title}</span>
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}
          
          {/* Espaço extra no final para garantir que o último item seja visível */}
          <div className="h-4"></div>
        </nav>
      </div>
    </>
  )
}

