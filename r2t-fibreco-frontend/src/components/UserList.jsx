import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { useAuth } from '../contexts/AuthContext'
import { DeleteUserModal } from './DeleteUserModal'

export const UserList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const { token, user } = useAuth()

  const fetchUsers = async () => {
    if (!token) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao carregar usuários')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteClick = (userToDelete) => {
    setUserToDelete(userToDelete)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remover usuário da lista
        setUsers(users.filter(u => u.id !== userToDelete.id))
        setDeleteModalOpen(false)
        setUserToDelete(null)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao excluir usuário')
      }
    } catch (err) {
      alert('Erro de conexão')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'user': 'Fibreco'
    }
    return labels[role] || role
  }

  const getRoleVariant = (role) => {
    const variants = {
      'admin': 'destructive',
      'supervisor': 'default',
      'user': 'secondary'
    }
    return variants[role] || 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários do sistema</p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/usuarios/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {users.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((tableUser) => (
                <TableRow key={tableUser.id}>
                  <TableCell className="font-medium">
                    {tableUser.nome_completo}
                  </TableCell>
                  <TableCell>{tableUser.username}</TableCell>
                  <TableCell>{tableUser.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(tableUser.role)}>
                      {getRoleLabel(tableUser.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tableUser.ativo ? 'default' : 'secondary'}>
                      {tableUser.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tableUser.data_criacao).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.role === 'admin' && (
                      <div className="flex justify-end space-x-2">
                        <Link to={`/usuarios/editar/${tableUser.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(tableUser)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        user={userToDelete}
      />
    </div>
  )
}
