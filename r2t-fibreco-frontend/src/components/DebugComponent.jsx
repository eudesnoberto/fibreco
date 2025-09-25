import React from 'react'

const DebugComponent = () => {
  console.log('DebugComponent renderizando...')
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h1>Debug Component</h1>
      <p>Se você está vendo isso, o React está funcionando!</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      
      <h2>Teste de Conexão Backend</h2>
      <button onClick={async () => {
        try {
          const response = await fetch('http://localhost:5002/api/usuarios')
          const data = await response.json()
          console.log('Backend response:', data)
          alert('Backend conectado! Verifique o console.')
        } catch (error) {
          console.error('Erro ao conectar backend:', error)
          alert('Erro ao conectar backend: ' + error.message)
        }
      }}>
        Testar Conexão Backend
      </button>
    </div>
  )
}

export default DebugComponent

