import React, { useState, useEffect } from 'react'
import { Plus, Edit, ToggleLeft, ToggleRight, Upload, Download } from 'lucide-react'

interface ConfigItem {
  id: string
  description: string
  active: boolean
  created_at: string
  created_by?: string
}

interface ConfigSection {
  title: string
  items: ConfigItem[]
}

export default function ConfigurationManagement() {
  const [activeSection, setActiveSection] = useState('vehicle-types')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)
  const [newDescription, setNewDescription] = useState('')
  const [configSections, setConfigSections] = useState<Record<string, ConfigSection>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Initialize demo data
  useEffect(() => {
    const initializeConfigData = () => {
      const stored = localStorage.getItem('demo_config_data')
      if (stored) {
        return JSON.parse(stored)
      }

      const defaultConfig: Record<string, ConfigSection> = {
        'vehicle-types': {
          title: 'Tipos de Vehículo',
          items: [
            { id: '1', description: 'Tractocamión', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'Dobletroque', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Sencillo', active: false, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'trailer-types': {
          title: 'Tipos de Tráiler',
          items: [
            { id: '1', description: 'Estacas', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'Plancha', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Furgón', active: true, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'product-types': {
          title: 'Tipos de Productos Preferidos',
          items: [
            { id: '1', description: 'Acerero', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'Carrocería general', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Construcción', active: false, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'no-interest-reasons': {
          title: 'No Interesado en Logicem',
          items: [
            { id: '1', description: 'Mala atención', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'No paga a tiempo', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Experiencia negativa anterior', active: true, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'restriction-reasons': {
          title: 'Motivos de Restricción de Cargue',
          items: [
            { id: '1', description: 'Tiempo de cargue lento', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'Vía en mal estado', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Horarios restringidos', active: true, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'offer-rejection-reasons': {
          title: 'Motivos de No Interés en Ofertas',
          items: [
            { id: '1', description: 'Flete bajo', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'No se encuentra cerca', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Ya está cargado', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '4', description: 'Destino no conveniente', active: false, created_at: '2024-01-01T00:00:00Z' },
          ]
        },
        'clients': {
          title: 'Clientes',
          items: [
            { id: '1', description: 'Cliente A', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '2', description: 'Cliente B', active: true, created_at: '2024-01-01T00:00:00Z' },
            { id: '3', description: 'Cliente C', active: false, created_at: '2024-01-01T00:00:00Z' },
          ]
        }
      }

      localStorage.setItem('demo_config_data', JSON.stringify(defaultConfig))
      return defaultConfig
    }

    setConfigSections(initializeConfigData())
  }, [])

  const saveConfigData = (newConfig: Record<string, ConfigSection>) => {
    localStorage.setItem('demo_config_data', JSON.stringify(newConfig))
    setConfigSections(newConfig)
  }

  const handleToggleActive = (itemId: string) => {
    const updatedConfig = { ...configSections }
    const currentSection = updatedConfig[activeSection]
    
    currentSection.items = currentSection.items.map(item =>
      item.id === itemId ? { ...item, active: !item.active } : item
    )
    
    saveConfigData(updatedConfig)
    setSuccess(`Estado actualizado exitosamente`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleEdit = (item: ConfigItem) => {
    setEditingItem(item)
    setNewDescription(item.description)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!newDescription.trim()) {
      setError('La descripción es requerida')
      setLoading(false)
      return
    }

    try {
      const updatedConfig = { ...configSections }
      const currentSection = updatedConfig[activeSection]

      if (editingItem) {
        // Update existing item
        currentSection.items = currentSection.items.map(item =>
          item.id === editingItem.id 
            ? { ...item, description: newDescription.trim() }
            : item
        )
        setSuccess('Item actualizado exitosamente')
      } else {
        // Create new item
        const newItem: ConfigItem = {
          id: `demo-${Date.now()}`,
          description: newDescription.trim(),
          active: true,
          created_at: new Date().toISOString()
        }
        currentSection.items.push(newItem)
        setSuccess('Item creado exitosamente')
      }

      saveConfigData(updatedConfig)
      setShowModal(false)
      setEditingItem(null)
      setNewDescription('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al guardar el item')
    }
    
    setLoading(false)
  }

  const handleDelete = (itemId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este item?')) return

    const updatedConfig = { ...configSections }
    const currentSection = updatedConfig[activeSection]
    
    currentSection.items = currentSection.items.filter(item => item.id !== itemId)
    
    saveConfigData(updatedConfig)
    setSuccess('Item eliminado exitosamente')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleImportCSV = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const csv = e.target?.result as string
            
            // Split by lines and filter empty lines
            const lines = csv.split('\n').filter(line => line.trim())
            
            if (lines.length === 0) {
              setError('El archivo CSV está vacío')
              return
            }
            
            // Check if first line contains headers or data
            const firstLine = lines[0].trim()
            let dataStartIndex = 0
            let hasHeaders = false
            
            // If first line contains "description" or "descripcion", treat as header
            if (firstLine.toLowerCase().includes('description') || firstLine.toLowerCase().includes('descripcion')) {
              hasHeaders = true
              dataStartIndex = 1
            }
            
            if (lines.length <= dataStartIndex) {
              setError('No hay datos para importar en el archivo CSV')
              return
            }
            
            const updatedConfig = { ...configSections }
            const currentSection = updatedConfig[activeSection]
            let importedCount = 0
            
            // Process CSV data
            for (let i = dataStartIndex; i < lines.length; i++) {
              const line = lines[i].trim()
              if (!line) continue
              
              // Handle both comma-separated and single values
              const values = line.split(',')
              let description = ''
              
              if (hasHeaders) {
                // If has headers, try to find description column
                const headers = lines[0].toLowerCase().split(',')
                const descIndex = headers.findIndex(h => h.includes('description') || h.includes('descripcion'))
                description = descIndex >= 0 ? values[descIndex] : values[0]
              } else {
                // If no headers, assume first column is description
                description = values[0]
              }
              
              // Clean description
              description = description.trim().replace(/"/g, '').replace(/'/g, '')
              
              if (description) {
                // Check if item already exists
                const existingItem = currentSection.items.find(item => 
                  item.description.toLowerCase() === description.toLowerCase()
                )
                
                if (!existingItem) {
                  const newItem: ConfigItem = {
                    id: `import-${Date.now()}-${i}`,
                    description: description,
                    active: true,
                    created_at: new Date().toISOString()
                  }
                  currentSection.items.push(newItem)
                  importedCount++
                } else {
                }
              }
            }
            
            if (importedCount === 0) {
              setError('No se pudieron importar elementos. Verifica el formato del archivo.')
              return
            }
            
            saveConfigData(updatedConfig)
            setSuccess('✅ Importación completada exitosamente. Se agregaron ' + importedCount + ' nuevos elementos.')
            setTimeout(() => setSuccess(''), 5000)
            
          } catch (error) {
            setError('Error al procesar el archivo CSV. Verifica que el formato sea correcto.')
          }
        }
        reader.onerror = () => {
          setError('Error al leer el archivo')
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleExportCSV = () => {
    const currentSection = configSections[activeSection]
    if (!currentSection) return

    const csvContent = [
      'description,active,created_at',
      ...currentSection.items.map(item => 
        '"' + item.description + '",' + item.active + ',' + item.created_at
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeSection + '_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    
    setSuccess('Archivo CSV exportado exitosamente')
    setTimeout(() => setSuccess(''), 3000)
  }

  const sectionKeys = Object.keys(configSections)
  const currentSection = configSections[activeSection]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Configuraciones</h2>
          <p className="text-sm text-gray-500">Gestiona las listas desplegables del sistema</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleImportCSV}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingItem(null)
              setNewDescription('')
              setShowModal(true)
              setError('')
              setSuccess('')
            }}
            className="flex items-center space-x-2 bg-[#D95F2A] text-white px-4 py-2 rounded-lg hover:bg-[#B8532A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Item</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-[#4A4A4A] mb-3">Secciones</h3>
          <nav className="space-y-1">
            {sectionKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === key
                    ? 'bg-[#D95F2A] text-white'
                    : 'text-[#4A4A4A] hover:bg-[#EAEAEA]'
                }`}
              >
                {configSections[key]?.title || key}
              </button>
            ))}
          </nav>
        </div>

        {/* Items List */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-4">
              {currentSection?.title || 'Cargando...'}
            </h3>
            
            {currentSection && (
              <div className="space-y-2">
                {currentSection.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay items en esta sección. Agrega uno nuevo.
                  </div>
                ) : (
                  currentSection.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                      <div className="flex-1">
                        <span className={`text-sm ${item.active ? 'text-[#4A4A4A]' : 'text-gray-400 line-through'}`}>
                          {item.description}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(item.id)}
                          className="text-gray-600 hover:text-[#D95F2A] transition-colors"
                          title={item.active ? 'Desactivar' : 'Activar'}
                        >
                          {item.active ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-gray-600 hover:text-[#D95F2A] transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors ml-2"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-4">
              {editingItem ? 'Editar Item' : 'Nuevo Item'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A4A4A]">Descripción *</label>
                <input
                  type="text"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
                  placeholder="Ingresa la descripción"
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
                    setShowModal(false)
                    setEditingItem(null)
                    setNewDescription('')
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
                  {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}