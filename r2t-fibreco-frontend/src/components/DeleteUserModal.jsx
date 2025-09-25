import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

export function DeleteUserModal({ isOpen, onClose, onConfirm, user }) {
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Limpar o campo sempre que o modal abrir
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('')
      setIsDeleting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    if (confirmationText !== 'Deletar') {
      alert('Por favor, digite exatamente "Deletar" para confirmar a exclusão.')
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setConfirmationText('')
    setIsDeleting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-red-900">Excluir Usuário</CardTitle>
                <CardDescription className="text-red-700">
                  Esta ação não pode ser desfeita
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isDeleting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">
              Você está prestes a excluir permanentemente:
            </h3>
            <div className="text-sm text-red-800">
              <p><strong>Nome:</strong> {user?.nome_completo}</p>
              <p><strong>Usuário:</strong> {user?.username}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Para confirmar, digite <span className="font-bold text-red-600">Deletar</span>:
            </Label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite 'Deletar' para confirmar"
              className="border-red-200 focus:border-red-500 focus:ring-red-500"
              disabled={isDeleting}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={confirmationText !== 'Deletar' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                'Excluir Usuário'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
