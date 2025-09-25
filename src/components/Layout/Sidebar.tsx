import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Settings, 
  Users, 
  Phone, 
  CheckSquare, 
  BarChart3, 
  LogOut,
  Truck,
  UserPlus,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { user, signOut } = useAuth()

  const adminMenuItems = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'config', label: 'Configuraciones', icon: Settings },
  ]

  const transactionalMenuItems = [
    { id: 'campaigns', label: 'Campañas', icon: Calendar },
    { id: 'data-update', label: 'Actualización de Datos', icon: UserPlus },
    { id: 'call-management', label: 'Gestión de Llamadas', icon: Phone },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  ]

  const reportsMenuItems = [
    { id: 'no-answer-report', label: 'Números que no contestan', icon: AlertCircle },
    { id: 'interests-report', label: 'Detalle de intereses', icon: Truck },
  ]

  const agentMenuItems = [
    { id: 'data-update', label: 'Actualización de Datos', icon: UserPlus },
    { id: 'call-management', label: 'Gestión de Llamadas', icon: Phone },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  ]

  const getMenuItems = () => {
    if (user?.role === 'admin') {
      return { 
        admin: adminMenuItems, 
        transaccional: transactionalMenuItems, 
        reportes: reportsMenuItems 
      }
    } else if (user?.role === 'manager') {
      return { 
        transaccional: transactionalMenuItems, 
        reportes: reportsMenuItems 
      }
    } else {
      return { 
        transaccional: agentMenuItems 
      }
    }
  }

  const menuItems = getMenuItems()

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#D95F2A] rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4A4A4A]">Logicem</h1>
            <p className="text-sm text-gray-500">Call Center</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {Object.entries(menuItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            <h3 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {section}
            </h3>
            <nav className="space-y-1 px-3">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === item.id
                        ? 'bg-[#D95F2A] text-white'
                        : 'text-[#4A4A4A] hover:bg-[#EAEAEA]'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#D95F2A] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#4A4A4A] truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-[#D95F2A] transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}