import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/Auth/LoginForm'
import Sidebar from './components/Layout/Sidebar'
import Header from './components/Layout/Header'
import UserManagement from './components/Admin/UserManagement'
import ConfigurationManagement from './components/Admin/ConfigurationManagement'
import CampaignManagement from './components/Campaigns/CampaignManagement'
import DataUpdateForms from './components/DataUpdate/DataUpdateForms'
import TaskManagement from './components/Tasks/TaskManagement'
import CallManagement from './components/CallManagement/CallManagement'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeView, setActiveView] = useState('campaigns')


  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAEAEA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D95F2A] mx-auto"></div>
          <p className="mt-4 text-[#4A4A4A]">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }


  const getViewTitle = (view: string) => {
    const titles: Record<string, string> = {
      users: 'Gestión de Usuarios',
      config: 'Configuraciones',
      campaigns: 'Gestión de Campañas',
      'data-update': 'Actualización de Datos',
      'call-management': 'Gestión de Llamadas',
      tasks: 'Gestión de Tareas',
      'no-answer-report': 'Números que no Contestan',
      'interests-report': 'Detalle de Intereses'
    }
    return titles[view] || 'Dashboard'
  }

  const renderView = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />
      case 'config':
        return <ConfigurationManagement />
      case 'campaigns':
        return <CampaignManagement />
      case 'data-update':
        return <DataUpdateForms />
      case 'call-management':
        return <CallManagement />
      case 'tasks':
        return (
          <TaskManagement />
        )
      case 'no-answer-report':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">Reporte de Números que no Contestan</h3>
            <p className="text-gray-500">Esta funcionalidad está en desarrollo</p>
          </div>
        )
      case 'interests-report':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">Detalle de Intereses</h3>
            <p className="text-gray-500">Esta funcionalidad está en desarrollo</p>
          </div>
        )
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">Bienvenido a Logicem Call Center</h3>
            <p className="text-gray-500">Selecciona una opción del menú para comenzar</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#EAEAEA] flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col">
        <Header title={getViewTitle(activeView)} />
        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App