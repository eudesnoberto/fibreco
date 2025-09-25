import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ArrowUp, ArrowDown, Upload, X, Image as ImageIcon, Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '../contexts/AuthContext'

export function MovimentacaoForm() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [materiais, setMateriais] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [atividades, setAtividades] = useState([])
  const [materiaisSelecionados, setMateriaisSelecionados] = useState([])
  const [imagens, setImagens] = useState([])
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    tipo_movimentacao: 'entrada',
    motivo: '',
    responsavel: '',
    responsavel_id: '',
    atividade_id: ''
  })

  useEffect(() => {
    fetchMateriais()
    fetchUsuarios()
    if (user?.role === 'user') {
      fetchAtividades()
      // Usuários comuns só podem fazer saídas
      setFormData(prev => ({
        ...prev,
        tipo_movimentacao: 'saida'
      }))
    }
  }, [user])

  const fetchMateriais = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/materiais', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Para movimentações, mostrar todos os materiais (incluindo zerados)
        // pois podem ser usados para ajustes e entradas
        setMateriais(data)
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error)
    }
  }

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
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const fetchAtividades = async () => {
    if (!token) {
      console.error('Token não disponível')
      return
    }

    try {
      const response = await fetch('/api/atividades', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas atividades pendentes do usuário logado
        const atividadesPendentes = data.filter(atividade => 
          atividade.status === 'pendente' && atividade.usuario_id === user.id
        )
        setAtividades(atividadesPendentes)
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          return data.url
        } else {
          throw new Error('Erro no upload')
        }
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImagens(prev => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setImagens(prev => prev.filter((_, i) => i !== index))
  }

  const adicionarMaterial = () => {
    setMateriaisSelecionados(prev => [
      ...prev,
      {
        id: Date.now(), // ID temporário
        material_id: '',
        quantidade: '',
        material: null
      }
    ])
  }

  const removerMaterial = (index) => {
    setMateriaisSelecionados(prev => prev.filter((_, i) => i !== index))
  }

  const atualizarMaterial = (index, field, value) => {
    setMateriaisSelecionados(prev => {
      const novos = [...prev]
      novos[index] = {
        ...novos[index],
        [field]: value
      }
      
      // Se mudou o material_id, atualizar o objeto material
      if (field === 'material_id') {
        const material = materiais.find(m => m.id === parseInt(value))
        novos[index].material = material
      }
      
      return novos
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!token) {
      alert('Token de acesso não disponível. Faça login novamente.')
      setLoading(false)
      return
    }

    // Validar se há materiais selecionados
    if (materiaisSelecionados.length === 0) {
      alert('Selecione pelo menos um material.')
      setLoading(false)
      return
    }

    // Validar se todos os materiais têm quantidade
    const materiaisInvalidos = materiaisSelecionados.filter(m => !m.material_id || !m.quantidade)
    if (materiaisInvalidos.length > 0) {
      alert('Todos os materiais devem ter quantidade definida.')
      setLoading(false)
      return
    }

    try {
      let movimentacoesCriadas = 0
      let erros = []

      // Criar movimentação para cada material
      for (const materialSelecionado of materiaisSelecionados) {
        try {
          const response = await fetch(`/api/materiais/${materialSelecionado.material_id}/movimentacao`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tipo_movimentacao: formData.tipo_movimentacao,
              quantidade: parseInt(materialSelecionado.quantidade),
              motivo: formData.motivo,
              responsavel: formData.responsavel,
              responsavel_id: formData.responsavel_id ? parseInt(formData.responsavel_id) : null,
              imagens: imagens
            })
          })

          if (response.ok) {
            movimentacoesCriadas++
          } else {
            const error = await response.json()
            erros.push(`${materialSelecionado.material?.nome}: ${error.error}`)
          }
        } catch (error) {
          erros.push(`${materialSelecionado.material?.nome}: Erro de conexão`)
        }
      }

      // Se a movimentação foi criada com sucesso e há uma atividade selecionada, concluir a atividade
      if (movimentacoesCriadas > 0 && formData.atividade_id) {
        try {
          const atividadeResponse = await fetch(`/api/atividades/${formData.atividade_id}/concluir`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              observacoes: `Atividade concluída via movimentação. Motivo: ${formData.motivo}`
            })
          })

          if (atividadeResponse.ok) {
            alert(`${movimentacoesCriadas} movimentação(ões) criada(s) e atividade concluída com sucesso!`)
          } else {
            alert(`${movimentacoesCriadas} movimentação(ões) criada(s), mas houve erro ao concluir a atividade.`)
          }
        } catch (atividadeError) {
          console.error('Erro ao concluir atividade:', atividadeError)
          alert(`${movimentacoesCriadas} movimentação(ões) criada(s), mas houve erro ao concluir a atividade.`)
        }
      } else if (movimentacoesCriadas > 0) {
        alert(`${movimentacoesCriadas} movimentação(ões) criada(s) com sucesso!`)
      }

      if (erros.length > 0) {
        alert(`Alguns erros ocorreram:\n${erros.join('\n')}`)
      }

      if (movimentacoesCriadas > 0) {
        navigate('/movimentacoes')
      }
    } catch (error) {
      console.error('Erro ao criar movimentação:', error)
      alert('Erro ao criar movimentação')
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

    // Se mudou o responsável_id, atualizar também o responsavel
    if (name === 'responsavel_id') {
      const usuario = usuarios.find(u => u.id === parseInt(value))
      if (usuario) {
        setFormData(prev => ({
          ...prev,
          responsavel: usuario.nome
        }))
      }
    }


    // Se selecionou uma atividade, preencher automaticamente os campos
    if (name === 'atividade_id') {
      const atividade = atividades.find(a => a.id === parseInt(value))
      if (atividade) {
        // Preencher automaticamente os campos com dados da atividade
        setFormData(prev => ({
          ...prev,
          motivo: `Conclusão da atividade: ${atividade.titulo}`,
          tipo_movimentacao: 'saida'
        }))
        
        // Adicionar o material da atividade aos materiais selecionados
        const material = materiais.find(m => m.id === atividade.material_id)
        if (material) {
          setMateriaisSelecionados([{
            id: Date.now(),
            material_id: atividade.material_id,
            quantidade: atividade.quantidade_necessaria,
            material: material
          }])
        }
      }
    }
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/movimentacoes')} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {user?.role === 'user' ? 'Concluir Atividade' : 'Nova Movimentação'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {user?.role === 'user' 
              ? 'Conclua suas atividades e registre o material utilizado' 
              : 'Registre uma entrada ou saída de material'
            }
          </p>
        </div>
      </div>

      {/* Atividades Pendentes - Apenas para usuários comuns */}
      {user?.role === 'user' && atividades.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Suas Atividades Pendentes</CardTitle>
            <CardDescription className="text-blue-600">
              Selecione uma atividade para concluí-la automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="atividade_id">Atividade para Concluir</Label>
                <select
                  id="atividade_id"
                  name="atividade_id"
                  value={formData.atividade_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma atividade (opcional)</option>
                  {atividades.map(atividade => (
                    <option key={atividade.id} value={atividade.id}>
                      {atividade.titulo} - {atividade.material_nome} ({atividade.quantidade_necessaria} unid.)
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.atividade_id && (() => {
                const atividade = atividades.find(a => a.id === parseInt(formData.atividade_id))
                return atividade ? (
                  <div className="p-3 bg-white border border-blue-200 rounded-md">
                    <h4 className="font-medium text-gray-900">{atividade.titulo}</h4>
                    <p className="text-sm text-gray-600 mt-1">{atividade.descricao}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p><strong>Material:</strong> {atividade.material_nome}</p>
                      <p><strong>Quantidade:</strong> {atividade.quantidade_necessaria} unidades</p>
                      {atividade.data_limite && (
                        <p><strong>Prazo:</strong> {new Date(atividade.data_limite).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700">
                        <strong>✓</strong> Ao salvar esta movimentação, a atividade será automaticamente concluída
                      </p>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Movimentação</CardTitle>
          <CardDescription>
            Selecione os materiais e informe os dados da movimentação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Materiais Selecionados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Materiais *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarMaterial}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Material</span>
                </Button>
              </div>

              {materiaisSelecionados.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum material selecionado</p>
                  <p className="text-sm">Clique em "Adicionar Material" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materiaisSelecionados.map((materialSelecionado, index) => (
                    <div key={materialSelecionado.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Material {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removerMaterial(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`material_${index}`}>Material *</Label>
                          <select
                            id={`material_${index}`}
                            value={materialSelecionado.material_id}
                            onChange={(e) => atualizarMaterial(index, 'material_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          >
                            <option value="">Selecione um material</option>
                            {materiais.map(material => (
                              <option key={material.id} value={material.id}>
                                {material.nome} - {material.categoria}
                                {material.subcategoria && ` (${material.subcategoria})`}
                                - Estoque: {material.quantidade} {material.unidade}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`quantidade_${index}`}>Quantidade *</Label>
                          <Input
                            id={`quantidade_${index}`}
                            type="number"
                            min="1"
                            value={materialSelecionado.quantidade}
                            onChange={(e) => atualizarMaterial(index, 'quantidade', e.target.value)}
                            placeholder="Quantidade"
                            required
                          />
                        </div>
                      </div>
                      
                      {materialSelecionado.material && (
                        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
                          <div className="text-sm text-gray-600">
                            <p><strong>Estoque atual:</strong> {materialSelecionado.material.quantidade} {materialSelecionado.material.unidade}</p>
                            {formData.tipo_movimentacao === 'saida' && materialSelecionado.quantidade && (
                              <p className={`mt-1 ${parseInt(materialSelecionado.quantidade) > materialSelecionado.material.quantidade ? 'text-red-600' : 'text-green-600'}`}>
                                <strong>Estoque após movimentação:</strong> {materialSelecionado.material.quantidade - parseInt(materialSelecionado.quantidade)} {materialSelecionado.material.unidade}
                                {parseInt(materialSelecionado.quantidade) > materialSelecionado.material.quantidade && ' ⚠️ Estoque insuficiente!'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Tipo de Movimentação */}
              <div>
                <Label htmlFor="tipo_movimentacao">Tipo de Movimentação *</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                  {user?.role !== 'user' && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="tipo_movimentacao"
                        value="entrada"
                        checked={formData.tipo_movimentacao === 'entrada'}
                        onChange={handleChange}
                        className="text-green-600"
                      />
                      <ArrowUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm sm:text-base">Entrada</span>
                    </label>
                  )}
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tipo_movimentacao"
                      value="saida"
                      checked={formData.tipo_movimentacao === 'saida'}
                      onChange={handleChange}
                      className="text-red-600"
                      disabled={user?.role === 'user' && formData.tipo_movimentacao !== 'saida'}
                    />
                    <ArrowDown className="w-4 h-4 text-red-600" />
                    <span className="text-sm sm:text-base">Saída</span>
                  </label>
                </div>
                {user?.role === 'user' && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 Como usuário, você pode apenas registrar saídas para concluir atividades
                  </p>
                )}
              </div>


              {/* Responsável */}
              <div>
                <Label htmlFor="responsavel_id">Responsável</Label>
                <select
                  id="responsavel_id"
                  name="responsavel_id"
                  value={formData.responsavel_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione um responsável</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} ({usuario.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  placeholder="Descreva o motivo da movimentação..."
                  rows={3}
                />
              </div>

              {/* Upload de Imagens */}
              <div className="md:col-span-2">
                <Label htmlFor="imagens">Anexar Imagens</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="imagens"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imagens').click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploading ? 'Enviando...' : 'Selecionar Imagens'}
                    </Button>
                    <span className="text-sm text-gray-500">
                      Selecione uma ou mais imagens (PNG, JPG, JPEG, GIF, WEBP)
                    </span>
                  </div>

                  {/* Preview das imagens */}
                  {imagens.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagens.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Anexo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            {materialSelecionado && formData.quantidade && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Movimentação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Material</p>
                      <p className="font-medium">{materialSelecionado.nome}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estoque Atual</p>
                      <p className="font-medium">
                        {materialSelecionado.quantidade} {materialSelecionado.unidade}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Novo Estoque</p>
                      <p className={`font-medium ${quantidadeInsuficiente ? 'text-red-600' : 'text-green-600'}`}>
                        {novaQuantidade !== null ? `${novaQuantidade} ${materialSelecionado.unidade}` : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/movimentacoes')}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || quantidadeInsuficiente || !formData.material_id || !formData.quantidade}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

