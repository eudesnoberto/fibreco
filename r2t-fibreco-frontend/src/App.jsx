import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { MaterialList } from './components/MaterialList'
import { MaterialForm } from './components/MaterialForm'
import { MovimentacaoList } from './components/MovimentacaoList'
import { MovimentacaoForm } from './components/MovimentacaoForm'
import DebugComponent from './components/DebugComponent'
import { UserList } from './components/UserList'
import { UserForm } from './components/UserForm'
import { AtividadeList } from './components/AtividadeList'
import { AtividadeForm } from './components/AtividadeForm'
import { AtividadeVisualizar } from './components/AtividadeVisualizar'
import { UserProfile } from './components/UserProfile'
import Relatorios from './components/Relatorios'
import { RelatorioMensalDetalhado } from './components/RelatorioMensalDetalhado'
import { About } from './components/About'
import './App.css'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  // Reset sidebar state when user changes
  React.useEffect(() => {
    if (user) {
      setSidebarOpen(false) // Always start closed
    }
  }, [user])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
        <div className={user ? "ml-0 lg:ml-64" : ""}>
          {user && <Header setSidebarOpen={setSidebarOpen} />}
          <main className={user ? "p-4 md:p-6" : ""}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/materiais" element={
                  <ProtectedRoute>
                    <MaterialList />
                  </ProtectedRoute>
                } />
                <Route path="/materiais/novo" element={
                  <ProtectedRoute requiredRole="admin">
                    <MaterialForm />
                  </ProtectedRoute>
                } />
                <Route path="/materiais/editar/:id" element={
                  <ProtectedRoute requiredRole="admin">
                    <MaterialForm />
                  </ProtectedRoute>
                } />
                <Route path="/movimentacoes" element={
                  <ProtectedRoute>
                    <MovimentacaoList />
                  </ProtectedRoute>
                } />
                <Route path="/movimentacoes/nova" element={
                  <ProtectedRoute>
                    <DebugComponent />
                  </ProtectedRoute>
                } />
                <Route path="/usuarios" element={
                  <ProtectedRoute requiredRole="admin">
                    <UserList />
                  </ProtectedRoute>
                } />
                <Route path="/usuarios/novo" element={
                  <ProtectedRoute requiredRole="admin">
                    <UserForm />
                  </ProtectedRoute>
                } />
                <Route path="/usuarios/editar/:id" element={
                  <ProtectedRoute requiredRole="admin">
                    <UserForm />
                  </ProtectedRoute>
                } />
                <Route path="/atividades" element={
                  <ProtectedRoute>
                    <AtividadeList />
                  </ProtectedRoute>
                } />
                <Route path="/atividades/nova" element={
                  <ProtectedRoute requiredRole="supervisor">
                    <AtividadeForm />
                  </ProtectedRoute>
                } />
                <Route path="/atividades/editar/:id" element={
                  <ProtectedRoute requiredRole="supervisor">
                    <AtividadeForm />
                  </ProtectedRoute>
                } />
                <Route path="/atividades/visualizar/:id" element={
                  <ProtectedRoute>
                    <AtividadeVisualizar />
                  </ProtectedRoute>
                } />
                <Route path="/relatorios" element={
                  <ProtectedRoute requiredRole="admin">
                    <Relatorios />
                  </ProtectedRoute>
                } />
                <Route path="/relatorios/mensal" element={
                  <ProtectedRoute requiredRole="supervisor">
                    <RelatorioMensalDetalhado />
                  </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/sobre" element={
                  <ProtectedRoute>
                    <About />
                  </ProtectedRoute>
                } />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App

