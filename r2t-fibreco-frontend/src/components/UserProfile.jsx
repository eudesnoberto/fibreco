import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Shield, 
  Mail, 
  Calendar, 
  Key,
  Crown,
  UserCheck,
  Users
} from 'lucide-react'
import { ChangePassword } from './ChangePassword'

export function UserProfile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          description: 'Acesso total ao sistema',
          icon: Crown,
          variant: 'destructive',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      case 'supervisor':
        return {
          label: 'Supervisor',
          description: 'Gerenciamento de atividades e usuários',
          icon: UserCheck,
          variant: 'default',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      case 'user':
        return {
          label: 'Usuário',
          description: 'Execução de atividades',
          icon: Users,
          variant: 'secondary',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      default:
        return {
          label: 'Desconhecido',
          description: 'Role não identificado',
          icon: User,
          variant: 'outline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  const getRolePermissions = (role) => {
    switch (role) {
      case 'admin':
        return [
          'Visualizar e gerenciar todos os materiais',
          'Criar, editar e excluir materiais',
          'Visualizar todas as movimentações',
          'Criar e gerenciar todas as atividades',
          'Gerenciar usuários e permissões',
          'Acessar relatórios completos',
          'Configurações do sistema'
        ]
      case 'supervisor':
        return [
          'Visualizar materiais disponíveis',
          'Criar movimentações de estoque',
          'Criar e gerenciar atividades',
          'Atribuir atividades para usuários',
          'Visualizar relatórios de atividades',
          'Gerenciar usuários (limitado)'
        ]
      case 'user':
        return [
          'Visualizar materiais disponíveis',
          'Executar atividades atribuídas',
          'Concluir atividades',
          'Visualizar suas próprias atividades',
          'Registrar consumo de materiais'
        ]
      default:
        return ['Permissões não definidas']
    }
  }

  const roleInfo = getRoleInfo(user?.role)
  const RoleIcon = roleInfo.icon

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações e configurações</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Key className="w-4 h-4" />
            <span>Segurança</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="profile" className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.nome_completo || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome de Usuário</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.username || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.email || 'Não informado'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.data_cadastro ? 
                        new Date(user.data_cadastro).toLocaleDateString('pt-BR') : 
                        'Não informado'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge variant={user?.ativo ? 'default' : 'secondary'}>
                        {user?.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nível de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Nível de Acesso</span>
              </CardTitle>
              <CardDescription>
                Informações sobre suas permissões no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Badge do Role */}
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${roleInfo.bgColor}`}>
                    <RoleIcon className={`w-6 h-6 ${roleInfo.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {roleInfo.label}
                    </h3>
                    <p className="text-gray-600">{roleInfo.description}</p>
                  </div>
                </div>

                {/* Permissões */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Suas Permissões:</h4>
                  <ul className="space-y-2">
                    {getRolePermissions(user?.role).map((permission, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Alterar Senha</span>
              </CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha regularmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePassword />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

