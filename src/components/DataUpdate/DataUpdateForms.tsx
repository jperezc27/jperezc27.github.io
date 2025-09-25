import React, { useState } from 'react'
import { Truck, PhoneOff, UserX, ShieldAlert, Users } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// Hook to get configuration data
const useConfigData = () => {
  const getConfigData = () => {
    const stored = localStorage.getItem('demo_config_data')
    if (stored) {
      return JSON.parse(stored)
    }
    return {}
  }

  const getActiveItems = (sectionKey: string) => {
    const configData = getConfigData()
    const section = configData[sectionKey]
    if (!section || !section.items) return []
    return section.items.filter((item: any) => item.active)
  }

  return { getActiveItems }
}

// Task creation utility
const createTask = (category: string, data: any, userId: string) => {
  const taskCategories = {
    'vehicle-registration': 'nuevo-vehiculo',
    'no-answer': 'numeros-no-contestan',
    'no-logicem-interest': 'no-interesado-logicem',
    'loading-restrictions': 'restricciones-cargue',
    'referrals': 'referidos'
  }

  // Priority mapping by category
  const taskPriorities = {
    'nuevo-vehiculo': 'baja',
    'numeros-no-contestan': 'media',
    'no-interesado-logicem': 'baja',
    'restricciones-cargue': 'baja',
    'referidos': 'media'
  }

  const taskCategory = taskCategories[category as keyof typeof taskCategories] || category
  const taskPriority = taskPriorities[taskCategory as keyof typeof taskPriorities] || 'media'

  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: taskCategory,
    priority: taskPriority,
    status: 'pendiente',
    reference_id: null,
    data: data,
    observations: null,
    created_at: new Date().toISOString(),
    closed_at: null,
    created_by: userId,
    closed_by: null
  }

  // Get existing tasks
  const existingTasks = JSON.parse(localStorage.getItem('demo_tasks') || '[]')
  
  // Add new task
  const updatedTasks = [task, ...existingTasks]
  
  // Save to localStorage
  localStorage.setItem('demo_tasks', JSON.stringify(updatedTasks))
  
  return task
}

interface FormData {
  [key: string]: string
}

export default function DataUpdateForms() {
  const { user } = useAuth()
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const forms = [
    {
      id: 'vehicle-registration',
      title: 'Registro de Vehículo',
      description: 'Crear o actualizar información de vehículos',
      icon: Truck,
      color: 'bg-blue-500'
    },
    {
      id: 'no-answer',
      title: 'Conductores que no Contestan',
      description: 'Marcar números que no responden llamadas',
      icon: PhoneOff,
      color: 'bg-yellow-500'
    },
    {
      id: 'no-logicem-interest',
      title: 'No Interesado en Logicem',
      description: 'Registrar conductores sin interés en Logicem',
      icon: UserX,
      color: 'bg-red-500'
    },
    {
      id: 'loading-restrictions',
      title: 'Restricciones de Cargue',
      description: 'Documentar restricciones específicas de conductores',
      icon: ShieldAlert,
      color: 'bg-orange-500'
    },
    {
      id: 'referrals',
      title: 'Crear Referidos',
      description: 'Registrar nuevos contactos referidos',
      icon: Users,
      color: 'bg-green-500'
    }
  ]

  const handleSubmit = async (formId: string, data: FormData) => {
    setLoading(true)
    setSuccess('')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Create task
      const task = createTask(formId, data, user?.id || 'unknown')
      
      // Reset form
      setFormData({})
      setActiveForm(null)
      
      // Show success message
      const formTitles = {
        'vehicle-registration': 'Registro de Vehículo',
        'no-answer': 'Número que no Contesta',
        'no-logicem-interest': 'No Interesado en Logicem',
        'loading-restrictions': 'Restricción de Cargue',
        'referrals': 'Referido'
      }
      
      const formTitle = formTitles[formId as keyof typeof formTitles] || 'Formulario'
      setSuccess(`✅ ${formTitle} guardado exitosamente. Se ha creado la tarea #${task.id.split('-')[1]}.`)
      
      // Auto-hide success message
      setTimeout(() => setSuccess(''), 5000)
      
    } catch (error) {
      alert('Error al crear la tarea. Por favor, intenta de nuevo.')
    }
    
    setLoading(false)
  }

  const renderForm = (formId: string) => {
    switch (formId) {
      case 'vehicle-registration':
        return (
          <VehicleRegistrationForm
            data={formData}
            onChange={setFormData}
            onSubmit={(data) => handleSubmit(formId, data)}
            loading={loading}
          />
        )
      case 'no-answer':
        return (
          <NoAnswerForm
            data={formData}
            onChange={setFormData}
            onSubmit={(data) => handleSubmit(formId, data)}
            loading={loading}
          />
        )
      case 'no-logicem-interest':
        return (
          <NoLogizemInterestForm
            data={formData}
            onChange={setFormData}
            onSubmit={(data) => handleSubmit(formId, data)}
            loading={loading}
          />
        )
      case 'loading-restrictions':
        return (
          <LoadingRestrictionsForm
            data={formData}
            onChange={setFormData}
            onSubmit={(data) => handleSubmit(formId, data)}
            loading={loading}
          />
        )
      case 'referrals':
        return (
          <ReferralsForm
            data={formData}
            onChange={setFormData}
            onSubmit={(data) => handleSubmit(formId, data)}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  if (activeForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveForm(null)}
            className="text-[#D95F2A] hover:text-[#B8532A] font-medium"
          >
            ← Volver
          </button>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">
            {forms.find(f => f.id === activeForm)?.title}
          </h2>
        </div>
        
        {renderForm(activeForm)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold text-[#4A4A4A]">Actualización de Datos</h2>
        <p className="text-sm text-gray-500">Selecciona el tipo de formulario que necesitas diligenciar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => {
          const Icon = form.icon
          return (
            <button
              key={form.id}
              onClick={() => setActiveForm(form.id)}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[#D95F2A] transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-12 h-12 ${form.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-[#4A4A4A] group-hover:text-[#D95F2A] transition-colors">
                    {form.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-left">
                {form.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Individual Form Components
function VehicleRegistrationForm({ data, onChange, onSubmit, loading }: any) {
  const { getActiveItems } = useConfigData()
  
  const vehicleTypes = getActiveItems('vehicle-types')
  const trailerTypes = getActiveItems('trailer-types')
  const productTypes = getActiveItems('product-types')

  const handleChange = (field: string, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const handleProductTypeChange = (productId: string, checked: boolean) => {
    const currentProducts = data.productosPreferidos || []
    let updatedProducts
    
    if (checked) {
      updatedProducts = [...currentProducts, productId]
    } else {
      updatedProducts = currentProducts.filter((id: string) => id !== productId)
    }
    
    onChange({ ...data, productosPreferidos: updatedProducts })
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Placa *</label>
            <input
              type="text"
              required
              placeholder="AAA123"
              pattern="[A-Z]{3}[0-9]{3}"
              value={data.placa || ''}
              onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Conductor *</label>
            <input
              type="text"
              required
              value={data.conductor || ''}
              onChange={(e) => handleChange('conductor', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Celular *</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              placeholder="3001234567"
              value={data.celular || ''}
              onChange={(e) => handleChange('celular', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Tipo de Vehículo *</label>
            <select
              required
              value={data.tipoVehiculo || ''}
              onChange={(e) => handleChange('tipoVehiculo', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            >
              <option value="">Seleccionar...</option>
              {vehicleTypes.map((type: any) => (
                <option key={type.id} value={type.id}>{type.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Tipo de Tráiler</label>
            <select
              value={data.tipoTrailer || ''}
              onChange={(e) => handleChange('tipoTrailer', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            >
              <option value="">Seleccionar...</option>
              {trailerTypes.map((type: any) => (
                <option key={type.id} value={type.id}>{type.description}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Municipio Domicilio</label>
            <input
              type="text"
              value={data.municipioDomicilio || ''}
              onChange={(e) => handleChange('municipioDomicilio', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
              placeholder="Municipio de domicilio"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A] mb-3">Productos Preferidos</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productTypes.map((type: any) => (
              <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(data.productosPreferidos || []).includes(type.id)}
                  onChange={(e) => handleProductTypeChange(type.id, e.target.checked)}
                  className="w-4 h-4 text-[#D95F2A] border-gray-300 rounded focus:ring-[#D95F2A] focus:ring-2"
                />
                <span className="text-sm text-[#4A4A4A]">{type.description}</span>
              </label>
            ))}
          </div>
          {productTypes.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No hay productos configurados. Ve a Configuraciones para agregar productos.
            </p>
          )}
        </div>
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Vehículo'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NoAnswerForm({ data, onChange, onSubmit, loading }: any) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Celular *</label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            placeholder="3001234567"
            value={data.celular || ''}
            onChange={(e) => onChange({ ...data, celular: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          />
          <p className="mt-1 text-xs text-gray-500">Número de 10 dígitos que no contesta</p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Marcar como No Contesta'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NoLogizemInterestForm({ data, onChange, onSubmit, loading }: any) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Celular *</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              placeholder="3001234567"
              value={data.celular || ''}
              onChange={(e) => onChange({ ...data, celular: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Nombre *</label>
            <input
              type="text"
              required
              value={data.nombre || ''}
              onChange={(e) => onChange({ ...data, nombre: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Motivo de No Interés *</label>
          <select
            required
            value={data.motivo || ''}
            onChange={(e) => onChange({ ...data, motivo: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          >
            <option value="">Seleccionar...</option>
            <option value="mala-atencion">Mala atención</option>
            <option value="no-paga-tiempo">No paga a tiempo</option>
            <option value="experiencia-negativa">Experiencia negativa anterior</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Notas *</label>
          <textarea
            required
            rows={3}
            value={data.notas || ''}
            onChange={(e) => onChange({ ...data, notas: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            placeholder="Detalles adicionales del motivo..."
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar No Interés'}
          </button>
        </div>
      </form>
    </div>
  )
}

function LoadingRestrictionsForm({ data, onChange, onSubmit, loading }: any) {
  const { getActiveItems } = useConfigData()
  
  const restrictionReasons = getActiveItems('restriction-reasons')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Celular *</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              placeholder="3001234567"
              value={data.celular || ''}
              onChange={(e) => onChange({ ...data, celular: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Placa *</label>
            <input
              type="text"
              required
              placeholder="AAA123"
              pattern="[A-Z]{3}[0-9]{3}"
              value={data.placa || ''}
              onChange={(e) => onChange({ ...data, placa: e.target.value.toUpperCase() })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Nombre *</label>
          <input
            type="text"
            required
            value={data.nombre || ''}
            onChange={(e) => onChange({ ...data, nombre: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Motivo de Restricción *</label>
          <select
            required
            value={data.motivo || ''}
            onChange={(e) => onChange({ ...data, motivo: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
          >
            <option value="">Seleccionar...</option>
            {restrictionReasons.map((reason: any) => (
              <option key={reason.id} value={reason.id}>{reason.description}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#4A4A4A]">Notas *</label>
          <textarea
            required
            rows={3}
            value={data.notas || ''}
            onChange={(e) => onChange({ ...data, notas: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            placeholder="Detalles específicos de la restricción..."
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Registrar Restricción'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ReferralsForm({ data, onChange, onSubmit, loading }: any) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Nombre del Contacto *</label>
            <input
              type="text"
              required
              value={data.nombre || ''}
              onChange={(e) => onChange({ ...data, nombre: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
              placeholder="Nombre completo del referido"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A4A4A]">Celular *</label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              placeholder="3001234567"
              value={data.celular || ''}
              onChange={(e) => onChange({ ...data, celular: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D95F2A]"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#D95F2A] text-white py-2 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Referido'}
          </button>
        </div>
      </form>
    </div>
  )
}