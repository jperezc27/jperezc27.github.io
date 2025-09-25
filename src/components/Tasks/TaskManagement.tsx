import React, { useState, useEffect, useMemo } from 'react'
import { CheckSquare, Clock, AlertCircle, User, Calendar, Eye, CheckCircle, X, Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import * as XLSX from 'xlsx'

interface Task {
  id: string
  category: string
  priority: 'baja' | 'media' | 'alta' | 'urgente'
  status: 'pendiente' | 'cerrada'
  reference_id: string | null
  data: any
  observations: string | null
  created_at: string
  closed_at: string | null
  created_by: string
  closed_by: string | null
}

type SortField = 'category' | 'priority' | 'status' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function TaskManagement() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [observations, setObservations] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'cerrada'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [loading, setLoading] = useState(false)
  const [configData, setConfigData] = useState<any>({})

  const itemsPerPage = 20

  // Load configuration data for resolving IDs
  useEffect(() => {
    const loadConfigData = () => {
      const stored = localStorage.getItem('demo_config_data')
      if (stored) {
        setConfigData(JSON.parse(stored))
      }
    }
    loadConfigData()
  }, [])

  // Load tasks from localStorage
  useEffect(() => {
    const loadTasks = () => {
      const stored = localStorage.getItem('demo_tasks')
      if (stored) {
        const parsedTasks = JSON.parse(stored)
        setTasks(parsedTasks)
      }
    }
    
    loadTasks()
    
    // Refresh every 5 seconds to catch new tasks
    const interval = setInterval(loadTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper function to resolve ID to description
  const resolveIdToDescription = (sectionKey: string, id: string): string => {
    if (!configData[sectionKey] || !configData[sectionKey].items) return id
    
    const item = configData[sectionKey].items.find((item: any) => item.id === id)
    return item ? item.description : id
  }

  // Helper function to resolve multiple IDs to descriptions
  const resolveMultipleIds = (sectionKey: string, ids: string[]): string => {
    if (!Array.isArray(ids)) return 'N/A'
    
    const descriptions = ids.map(id => resolveIdToDescription(sectionKey, id))
    return descriptions.join(', ')
  }

  // Handle sorting
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

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (task.data && JSON.stringify(task.data).toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (sortField === 'priority') {
        const priorityOrder = { 'baja': 1, 'media': 2, 'alta': 3, 'urgente': 4 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
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
  }, [tasks, searchTerm, statusFilter, categoryFilter, sortField, sortDirection])

  // Paginated tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedTasks.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedTasks, currentPage])

  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage)

  const handleCloseTask = async (taskId: string) => {
    if (!observations.trim()) {
      alert('Las observaciones son obligatorias para cerrar la tarea')
      return
    }

    setLoading(true)
    
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'cerrada' as const,
              closed_at: new Date().toISOString(),
              closed_by: user?.id || 'unknown',
              observations: observations.trim()
            }
          : task
      )
      
      setTasks(updatedTasks)
      localStorage.setItem('demo_tasks', JSON.stringify(updatedTasks))
      
      setShowModal(false)
      setSelectedTask(null)
      setObservations('')
    } catch (error) {
      console.error('Error closing task:', error)
    }
    
    setLoading(false)
  }

  const handleExportToExcel = () => {
    const exportData = filteredAndSortedTasks.map(task => {
      const baseData = {
        'ID Tarea': task.id,
        'Categoría': categoryLabels[task.category as keyof typeof categoryLabels] || task.category,
        'Prioridad': task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
        'Estado': task.status === 'pendiente' ? 'Pendiente' : 'Cerrada',
        'Fecha Creación': new Date(task.created_at).toLocaleString('es-CO'),
        'Fecha Cierre': task.closed_at ? new Date(task.closed_at).toLocaleString('es-CO') : '',
        'Observaciones': task.observations || ''
      }

      // Add task-specific data
      if (task.data) {
        if (task.category === 'nuevo-vehiculo') {
          return {
            ...baseData,
            'Placa': task.data.placa || '',
            'Conductor': task.data.conductor || '',
            'Celular': task.data.celular || '',
            'Municipio Domicilio': task.data.municipioDomicilio || '',
            'Tipo Vehículo': task.data.tipoVehiculo ? resolveIdToDescription('vehicle-types', task.data.tipoVehiculo) : '',
            'Tipo Tráiler': task.data.tipoTrailer ? resolveIdToDescription('trailer-types', task.data.tipoTrailer) : '',
            'Productos Preferidos': task.data.productosPreferidos ? resolveMultipleIds('product-types', task.data.productosPreferidos) : ''
          }
        } else if (task.category === 'numeros-no-contestan') {
          return {
            ...baseData,
            'Celular': task.data.celular || ''
          }
        } else if (task.category === 'no-interesado-logicem') {
          return {
            ...baseData,
            'Celular': task.data.celular || '',
            'Placa': task.data.placa || '',
            'Nombre': task.data.nombre || '',
            'Motivo': task.data.motivo ? resolveIdToDescription('no-interest-reasons', task.data.motivo) : '',
            'Notas': task.data.notas || ''
          }
        } else if (task.category === 'restricciones-cargue') {
          return {
            ...baseData,
            'Celular': task.data.celular || '',
            'Placa': task.data.placa || '',
            'Nombre': task.data.nombre || '',
            'Motivo': task.data.motivo ? resolveIdToDescription('restriction-reasons', task.data.motivo) : '',
            'Notas': task.data.notas || ''
          }
        } else if (task.category === 'referidos') {
          return {
            ...baseData,
            'Nombre': task.data.nombre || '',
            'Celular': task.data.celular || ''
          }
        }
      }

      return baseData
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tareas')
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `tareas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const categoryLabels = {
    'nuevo-vehiculo': 'Nuevo Vehículo',
    'numeros-no-contestan': 'Números que no Contestan',
    'no-interesado-logicem': 'No Interesado Logicem',
    'restricciones-cargue': 'Restricciones de Cargue',
    'referidos': 'Referidos',
    'bloqueo-contacto': 'Bloqueo de Contacto',
    'no-conductor': 'No Conductor',
    'interesado-despues': 'Interesado Después',
    'interesado': 'Interesado'
  }

  const priorityColors = {
    'baja': 'bg-gray-100 text-gray-800',
    'media': 'bg-yellow-100 text-yellow-800',
    'alta': 'bg-orange-100 text-orange-800',
    'urgente': 'bg-red-100 text-red-800'
  }

  const statusColors = {
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'cerrada': 'bg-green-100 text-green-800'
  }

  const uniqueCategories = [...new Set(tasks.map(task => task.category))]

  const renderTaskData = (data: any, category: string) => {
    if (!data) return 'Sin datos'
    
    const entries = Object.entries(data).filter(([key, value]) => value && value !== '')
    
    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => {
          let displayValue = String(value)
          let displayKey = key.replace(/([A-Z])/g, ' $1').toLowerCase()
          
          // Resolve IDs to descriptions based on category and field
          if (category === 'nuevo-vehiculo') {
            if (key === 'tipoVehiculo') {
              displayValue = resolveIdToDescription('vehicle-types', String(value))
              displayKey = 'tipo de vehículo'
            } else if (key === 'tipoTrailer') {
              displayValue = resolveIdToDescription('trailer-types', String(value))
              displayKey = 'tipo de tráiler'
            } else if (key === 'productosPreferidos' && Array.isArray(value)) {
              displayValue = resolveMultipleIds('product-types', value)
              displayKey = 'productos preferidos'
            }
          } else if (category === 'no-interesado-logicem') {
            if (key === 'motivo') {
              displayValue = resolveIdToDescription('no-interest-reasons', String(value))
              displayKey = 'motivo'
            }
          } else if (category === 'restricciones-cargue') {
            if (key === 'motivo') {
              displayValue = resolveIdToDescription('restriction-reasons', String(value))
            }
          }
          
          return (
            <div key={key} className="text-sm">
              <span className="font-medium capitalize">{displayKey}:</span>
              <span className="ml-2">{displayValue}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Gestión de Tareas</h2>
          <p className="text-sm text-gray-500">
            Administra las tareas generadas por el sistema ({filteredAndSortedTasks.length} tareas)
          </p>
        </div>
        <button
          onClick={handleExportToExcel}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="cerrada">Cerradas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          >
            <option value="all">Todas las categorías</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>{filteredAndSortedTasks.length} resultado{filteredAndSortedTasks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#EAEAEA]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider">
                  Tarea
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Categoría</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Prioridad</span>
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Fecha</span>
                    {getSortIcon('created_at')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4A4A4A] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {tasks.length === 0 
                      ? 'No hay tareas creadas. Ve a "Actualización de Datos" para crear nuevas tareas.'
                      : 'No se encontraron tareas que coincidan con los filtros.'
                    }
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckSquare className="w-5 h-5 text-[#D95F2A] mr-3" />
                        <div>
                          <div className="text-sm font-medium text-[#4A4A4A]">
                            #{task.id.split('-')[1]}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {task.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-[#4A4A4A]">
                        {categoryLabels[task.category as keyof typeof categoryLabels] || task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                        {task.status === 'pendiente' ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Cerrada
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(task.created_at).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task)
                          setObservations(task.observations || '')
                          setShowModal(true)
                        }}
                        className="text-[#D95F2A] hover:text-[#B8532A] inline-flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </button>
                      {task.status === 'pendiente' && (
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setObservations('')
                            setShowModal(true)
                          }}
                          className="text-green-600 hover:text-green-800 inline-flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Cerrar</span>
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
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedTasks.length)}
                  </span>{' '}
                  de <span className="font-medium">{filteredAndSortedTasks.length}</span> resultados
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
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    let page
                    if (totalPages <= 10) {
                      page = i + 1
                    } else if (currentPage <= 5) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 4) {
                      page = totalPages - 9 + i
                    } else {
                      page = currentPage - 4 + i
                    }
                    
                    return (
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
                    )
                  })}
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

      {/* Task Detail Modal */}
      {showModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-[#4A4A4A]">
                Detalle de Tarea #{selectedTask.id.split('-')[1]}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedTask(null)
                  setObservations('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoría</label>
                  <p className="text-sm text-gray-900">
                    {categoryLabels[selectedTask.category as keyof typeof categoryLabels] || selectedTask.category}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedTask.status]}`}>
                    {selectedTask.status === 'pendiente' ? 'Pendiente' : 'Cerrada'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[selectedTask.priority]}`}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTask.created_at).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datos de la Tarea</label>
                <div className="bg-gray-50 rounded-md p-3">
                  {renderTaskData(selectedTask.data, selectedTask.category)}
                </div>
              </div>

              {selectedTask.observations && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">
                    {selectedTask.observations}
                  </p>
                </div>
              )}

              {selectedTask.status === 'pendiente' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observaciones al Cerrar *</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                    placeholder="Observaciones obligatorias para cerrar la tarea..."
                    required
                  />
                  {!observations.trim() && (
                    <p className="mt-1 text-xs text-red-600">Las observaciones son obligatorias para cerrar la tarea</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedTask(null)
                  setObservations('')
                }}
                className="flex-1 bg-gray-200 text-[#4A4A4A] py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                {selectedTask.status === 'pendiente' ? 'Cancelar' : 'Cerrar'}
              </button>
              {selectedTask.status === 'pendiente' && (
                <button
                  onClick={() => handleCloseTask(selectedTask.id)}
                  disabled={loading || !observations.trim()}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cerrando...' : 'Cerrar Tarea'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}