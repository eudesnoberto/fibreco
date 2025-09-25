import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2 } from 'lucide-react'

export const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <img 
              src="/logo-r2-3.png" 
              alt="R2T Fibreco Logo"
              className="h-8 w-auto mr-3"
            />
            <h2 className="text-2xl font-extrabold text-gray-900">
              Fibreco
            </h2>
          </div>
          <p className="text-sm text-gray-600">
            Sistema de Gestão de Estoque
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Desenvolvido por{' '}
            <span 
              className="text-blue-600 hover:text-blue-800 cursor-pointer underline"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  window.open('https://wa.me/5581995697473', '_blank');
                }
              }}
            >
              Eudes Alves
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
