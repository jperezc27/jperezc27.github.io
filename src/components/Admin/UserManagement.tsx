import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, UserCheck, AlertCircle, Key, Download, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import * as XLSX from 'xlsx'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'agent'
  created_at: string
}

type SortField = 'name' | 'email' | 'role' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent' as 'admin' | 'manager' | 'agent'
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const { user: currentUser, changePassword } = useAuth()

  const itemsPerPage = 20

  useEffect(() => {
    // Load demo users from localStorage or create defaults
    const loadDemoUsers = () => {
      const stored = localStorage.getItem('demo_app_users')
      if (stored) {
        return JSON.parse(stored)
      }
      
      const defaultUsers: User[] = [
        {
          id: 'demo-admin',
          name: 'Administrador Principal',
          email: 'admin@logicem.com',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'demo-manager',
          name: 'Gestor de Campañas',
          email: 'manager@logicem.com',
          role: 'manager',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'demo-agent',
          name: 'Agente de Llamadas',
          email: 'agent@logicem.com',
          role: 'agent',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'demo-agent-2',
          name: 'Carlos Rodríguez',
          email: 'carlos@logicem.com',
          role: 'agent',
          created_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 'demo-agent-3',
          name: 'María González',
          email: 'maria@logicem.com',
          role: 'agent',
          created_at: '2024-01-03T00:00:00Z'
        },
        {
          id: 'demo-manager-2',
          name: 'Sofía Martínez',
          email: 'sofia@logicem.com',
          role: 'manager',
          created_at: '2024-01-04T00:00:00Z'
        }
      ]
      
      localStorage.setItem('demo_app_users', JSON.stringify(defaultUsers))
      return defaultUsers
    }
    
    setUsers(loadDemoUsers())
  }, [])

  // Filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else {
        aValue = aValue.toString().toLowerCase()
        bValue = bValue.toString().toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [users, searchTerm, sortField, sortDirection])

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedUsers, currentPage])

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let updatedUsers
      let updatedAuthUsers
      
      if (editingUser) {
        // Update existing user (only name and role)
        updatedUsers = users.map(u => u.id === editingUser.id ? { 
          ...u, 
          name: formData.name, 
          role: formData.role 
        } : u)
        setUsers(updatedUsers)
        setSuccess('Usuario actualizado exitosamente')
      } else {
        // Create new user with default password
        const defaultPassword = 'LogicemUser2024!'
        const newUser = {
          id: `demo-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          created_at: new Date().toISOString()
        }
        // Add new user
        updatedUsers = [newUser, ...users]
        setUsers(updatedUsers)
        
        // Also add to auth users with default password
        const authUsers = JSON.parse(localStorage.getItem('demo_auth_users') || '[]')
        const newAuthUser = {
          id: newUser.id,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }
        updatedAuthUsers = [...authUsers, newAuthUser]
        localStorage.setItem('demo_auth_users', JSON.stringify(updatedAuthUsers))
        
        setSuccess('Usuario creado exitosamente')
      }
      
      // Save to localStorage
      localStorage.setItem('demo_app_users', JSON.stringify(updatedUsers))
      
      setShowModal(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'agent' })
    } catch (error: any) {
      setError('Error al procesar la solicitud')
    }
    
    setLoading(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      // Update password in auth users
      const result = await changePassword(passwordUser!.id, newPassword)
      
      if (result.error) {
        setError('Error al cambiar la contraseña')
      } else {
        setSuccess(`✅ Contraseña actualizada para ${passwordUser?.name}. 
        
📧 Email: ${passwordUser?.email}
🔑 Nueva contraseña: ${newPassword}

Ya puedes usar estas credenciales para iniciar sesión.`)
      setShowPasswordModal(false)
      setPasswordUser(null)
      setNewPassword('')
      setConfirmPassword('')
      }
    } catch (error: any) {
      setError('Error al cambiar la contraseña')
    }
    
    setLoading(false)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleChangePassword = (user: User) => {
    setPasswordUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setShowPasswordModal(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return

    // Remove from app users
    const updatedUsers = users.filter(u => u.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem('demo_app_users', JSON.stringify(updatedUsers))
    
    // Also remove from auth users
    const authUsers = JSON.parse(localStorage.getItem('demo_auth_users') || '[]')
    const updatedAuthUsers = authUsers.filter((u: any) => u.id !== userId)
    localStorage.setItem('demo_auth_users', JSON.stringify(updatedAuthUsers))
    
    setSuccess('Usuario eliminado exitosamente')
  }

  const handleExportToExcel = () => {
    const exportData = filteredAndSortedUsers.map(user => ({
      'Nombre': user.name,
      'Email': user.email,
      'Rol': roleLabels[user.role],
      'Fecha de Creación': new Date(user.created_at).toLocaleDateString('es-CO')
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')
    
    // Auto-size columns
    const colWidths = [
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 20 }, // Rol
      { wch: 15 }  // Fecha
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gestor de Campañas',
    agent: 'Agente'
  }

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500">Administra los usuarios del sistema</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportToExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setEditingUser(null)
              setFormData({ name: '', email: '', password: '', role: 'agent' })
              setShowModal(true)
              setError('')
              setSuccess('')
            }}
            className="flex items-center space-x-2 bg-[#D95F2A] text-white px-4 py-2 rounded-lg hover:bg-[#B8532A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent w-full"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredAndSortedUsers.length} usuario{filteredAndSortedUsers.length !== 1 ? 's' : ''} encontrado{filteredAndSortedUsers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <UserCheck className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#EAEAEA]">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Usuario</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Rol</span>
                    {getSortIcon('role')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Fecha de Creación</span>
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#D95F2A] rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#4A4A4A]">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-[#D95F2A] hover:text-[#B8532A] inline-flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleChangePassword(user)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                        >
                          <Key className="w-4 h-4" />
                          <span>Contraseña</span>
                        </button>
                      )}
                      {currentUser?.id !== user.id && (
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredAndSortedUsers.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-[#D95F2A] border-[#D95F2A] text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                  placeholder="Nombre completo del usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Email *</label>
                <input
                  type="email"
                  required={!editingUser}
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A] ${
                    editingUser ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="usuario@logicem.com"
                />
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500">El email no se puede modificar</p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-[#4A4A4A]">Contraseña *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'manager' | 'agent'})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                >
                  <option value="agent">Agente</option>
                  <option value="manager">Gestor de Campañas</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-[#4A4A4A] py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-4">
              Cambiar Contraseña - {passwordUser.name}
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Confirmar Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                  placeholder="Confirma la nueva contraseña"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordUser(null)
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  className="flex-1 bg-gray-200 text-[#4A4A4A] py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}