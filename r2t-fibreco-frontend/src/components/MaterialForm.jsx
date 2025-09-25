import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../contexts/AuthContext'

export function MaterialForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token, user } = useAuth()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    subcategoria: '',
    quantidade: 0,
    quantidade_minima: 10,
    unidade: 'unidade',
    localizacao: 'Afogados',
    fornecedor: 'VIVO',
    preco_unitario: '',
    codigo_interno: '',
    codigo_fornecedor: '',
    descricao: '',
    usuario_id: ''
  })

  const categorias = [
    'plaquetas',
    'cabos',
    'caixas',
    'conectores',
    'tubetes',
    'cordões',
    'splitters',
    'acessórios'
  ]

  const subcategorias = {
    plaquetas: ['emenda', 'distribuição'],
    cabos: ['fig8', 'drop', 'subterrâneo', 'aéreo'],
    caixas: ['cto', 'gp', 'hermética', 'distribuição'],
    conectores: ['sc_apc', 'precom', 'lc', 'fc'],
    tubetes: ['proteção', 'emenda'],
    cordões: ['patch_cord', 'pigtail'],
    splitters: ['1x2', '1x4', '1x8', '1x16', '1x32'],
    acessórios: ['fixação', 'proteção', 'identificação']
  }

  const unidades = [
    'unidade',
    'metro',
    'rolo',
    'caixa',
    'pacote'
  ]

  useEffect(() => {
    fetchUsuarios()
    if (isEditing) {
      fetchMaterial()
    }
  }, [id, isEditing])

  const fetchUsuarios = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Usuários recebidos da API:', data)
        // Filtrar apenas usuários comuns (role user)
        const usuariosComuns = data.filter(user => user.role === 'user')
        console.log('Usuários comuns filtrados:', usuariosComuns)
        setUsuarios(usuariosComuns)
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const fetchMaterial = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/materiais/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
          nome: data.nome || '',
          categoria: data.categoria || '',
          subcategoria: data.subcategoria || '',
          quantidade: data.quantidade || 0,
          quantidade_minima: data.quantidade_minima || 10,
          unidade: data.unidade || 'unidade',
          localizacao: 'Afogados', // Valor estático
          fornecedor: 'VIVO', // Valor estático
          preco_unitario: data.preco_unitario || '',
          codigo_interno: data.codigo_interno || '',
          codigo_fornecedor: data.codigo_fornecedor || '',
          descricao: data.descricao || '',
          usuario_id: data.usuario_id || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar material:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      setLoading(false)
      return
    }

    try {
      const url = isEditing ? `/api/materiais/${id}` : '/api/materiais'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          preco_unitario: formData.preco_unitario ? parseFloat(formData.preco_unitario) : null
        })
      })

      if (response.ok) {
        navigate('/materiais')
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao salvar material')
      }
    } catch (error) {
      console.error('Erro ao salvar material:', error)
      alert('Erro ao salvar material')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Reset subcategoria when categoria changes
    if (name === 'categoria') {
      setFormData(prev => ({
        ...prev,
        subcategoria: ''
      }))
    }
  }

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/materiais')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Material' : 'Novo Material'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do material' : 'Cadastre um novo material no estoque'}
          </p>
          {!isEditing && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Como Admin:</strong> Você pode atribuir este material a um usuário específico ou deixá-lo disponível para todos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Material</CardTitle>
          <CardDescription>
            Preencha os dados do material de fibra óptica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome do Material *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Cabo Fig8 12 Fibras SM"
                  required
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat} className="capitalize">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div>
                <Label htmlFor="subcategoria">Subcategoria</Label>
                <select
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!formData.categoria}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {formData.categoria && subcategorias[formData.categoria]?.map(subcat => (
                    <option key={subcat} value={subcat} className="capitalize">
                      {subcat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade */}
              <div>
                <Label htmlFor="quantidade">Quantidade Atual</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="0"
                  value={formData.quantidade}
                  onChange={handleChange}
                />
              </div>

              {/* Quantidade Mínima */}
              <div>
                <Label htmlFor="quantidade_minima">Quantidade Mínima *</Label>
                <Input
                  id="quantidade_minima"
                  name="quantidade_minima"
                  type="number"
                  min="0"
                  value={formData.quantidade_minima}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Unidade */}
              <div>
                <Label htmlFor="unidade">Unidade *</Label>
                <select
                  id="unidade"
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {unidades.map(unidade => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Localização */}
              <div>
                <Label htmlFor="localizacao">Localização</Label>
                <Input
                  id="localizacao"
                  name="localizacao"
                  value={formData.localizacao}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Afogados (fixo)"
                />
                <p className="text-xs text-gray-500 mt-1">Campo fixo: Afogados</p>
              </div>

              {/* Fornecedor */}
              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  name="fornecedor"
                  value={formData.fornecedor}
                  readOnly
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="VIVO (fixo)"
                />
                <p className="text-xs text-gray-500 mt-1">Campo fixo: VIVO</p>
              </div>

              {/* Preço Unitário */}
              <div>
                <Label htmlFor="preco_unitario">Preço Unitário (R$)</Label>
                <Input
                  id="preco_unitario"
                  name="preco_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_unitario}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              {/* Código Interno */}
              <div>
                <Label htmlFor="codigo_interno">Código Interno</Label>
                <Input
                  id="codigo_interno"
                  name="codigo_interno"
                  value={formData.codigo_interno}
                  onChange={handleChange}
                  placeholder="Ex: CB-FG8-12F-SM"
                />
              </div>

              {/* Código Fornecedor */}
              <div>
                <Label htmlFor="codigo_fornecedor">Código do Fornecedor</Label>
                <Input
                  id="codigo_fornecedor"
                  name="codigo_fornecedor"
                  value={formData.codigo_fornecedor}
                  onChange={handleChange}
                />
              </div>

              {/* Usuário Responsável */}
              <div className="md:col-span-2">
                <Label htmlFor="usuario_id">Usuário Responsável</Label>
                <select
                  id="usuario_id"
                  name="usuario_id"
                  value={formData.usuario_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um usuário (opcional)</option>
                  {usuarios.length > 0 ? (
                    usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome} ({usuario.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Nenhum usuário comum disponível</option>
                  )}
                </select>
                
                {/* Mostrar usuário selecionado */}
                {formData.usuario_id && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">
                        Material será atribuído para:
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-blue-900">
                        {usuarios.find(u => u.id === parseInt(formData.usuario_id))?.nome}
                      </p>
                      <p className="text-sm text-blue-700">
                        {usuarios.find(u => u.id === parseInt(formData.usuario_id))?.email}
                      </p>
                    </div>
                  </div>
                )}
                
                {!formData.usuario_id && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600">
                        Material não será atribuído a nenhum usuário específico
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Apenas admins e supervisores poderão visualizar este material
                    </p>
                  </div>
                )}
                
                {usuarios.length === 0 ? (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>⚠️ Nenhum usuário comum encontrado!</strong>
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Para atribuir materiais a usuários, é necessário ter usuários com role "user" cadastrados no sistema.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Dica:</strong> Selecione um usuário para que ele possa visualizar e gerenciar este material
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descrição detalhada do material..."
                  rows={3}
                />
              </div>
            </div>

            {/* Resumo do Material */}
            {formData.nome && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo do Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nome</p>
                    <p className="font-medium">{formData.nome}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Categoria</p>
                    <p className="font-medium capitalize">{formData.categoria}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantidade Inicial</p>
                    <p className="font-medium">{formData.quantidade} {formData.unidade}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Usuário Responsável</p>
                    <p className="font-medium">
                      {formData.usuario_id ? (
                        <span className="text-blue-600">
                          {usuarios.find(u => u.id === parseInt(formData.usuario_id))?.nome || 'Usuário não encontrado'}
                        </span>
                      ) : (
                        <span className="text-gray-500">Nenhum usuário atribuído</span>
                      )}
                    </p>
                  </div>
                </div>
                {formData.usuario_id && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-700">
                      <strong>✓</strong> Este material será visível apenas para o usuário selecionado
                    </p>
                  </div>
                )}
                {!formData.usuario_id && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-700">
                      <strong>ℹ</strong> Este material será visível apenas para admins e supervisores
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/materiais')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEditing ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

