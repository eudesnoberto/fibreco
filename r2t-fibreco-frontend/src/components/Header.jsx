import { Menu, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { NotificationDropdown } from './NotificationDropdown'

export function Header({ setSidebarOpen }) {
  const { user, logout, isAdmin, isSupervisor } = useAuth()

  const getRoleLabel = () => {
    if (isAdmin()) return 'Administrador'
    if (isSupervisor()) return 'Supervisor'
    return 'Fibreco'
  }

  const getRoleVariant = () => {
    if (isAdmin()) return 'destructive'
    if (isSupervisor()) return 'default'
    return 'secondary'
  }
  return (
    <header className="bg-white shadow-sm border-b px-3 sm:px-4 md:px-6 py-3 sm:py-4 relative z-50 sticky top-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(prev => !prev)
              }
            }}
            className="p-2 flex-shrink-0 hover:bg-gray-100 hamburger-menu relative z-60"
          >
            <Menu size={20} className="w-5 h-5 text-gray-700" />
          </Button>
          
          {/* Título responsivo */}
          <div className="min-w-0 flex-1">
            <div className="hidden sm:block">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                Sistema de Controle de Material
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Gestão de materiais de fibra óptica
              </p>
            </div>
            <div className="block sm:hidden">
              <h2 className="text-sm font-semibold text-gray-900 truncate">
                R2T Fibreco
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="sm:w-4 sm:h-4" />
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-32 lg:max-w-none">
                    {user?.nome_completo || 'Usuário'}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Badge variant={getRoleVariant()} className="text-xs px-1 py-0">
                      {getRoleLabel()}
                    </Badge>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

