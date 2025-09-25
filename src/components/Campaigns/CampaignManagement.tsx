import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Edit, Trash2, Calendar, Users, MapPin, Package, Eye, Search, Filter, Download, ChevronUp, ChevronDown, X, Upload, Copy, Check, Clock, AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import * as XLSX from 'xlsx'

console.log('🔄 CampaignManagement module loading...')

interface Operation {
  id: string
  name: string
  client_id: string | null
  vehicle_type_id: string | null
  trailer_type_id: string | null
  product_type: string | null
  origin: string
  destination: string
  status: 'active' | 'inactive'
  created_at: string
  deactivated_at: string | null
  created_by: string | null
}

interface Campaign {
  id: string
  operation_id: string | null
  campaign_date: string
  status: 'pending' | 'completed' | 'closed'
  created_at: string
  completed_at: string | null
  closed_at: string | null
  created_by: string | null
  vehicles: CampaignVehicle[]
}

interface CampaignVehicle {
  id: string
  campaign_id: string
  plate: string
  driver_name: string
  driver_phone: string
  status: 'sin-gestion' | 'gestionado' | 'buzon' | 'no-conductor' | 'cambio-vehiculo' | 'no-interesado-logicem' | 'restriccion-cargue' | 'no-interesado' | 'interesado-despues' | 'interesado' | 'cancelada'
  created_at: string
  updated_at: string
  created_by: string | null
}

type SortField = 'name' | 'status' | 'created_at' | 'campaign_date'
type SortDirection = 'asc' | 'desc'

export default function CampaignManagement() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'operations' | 'campaigns'>('operations')
  const [operations, setOperations] = useState<Operation[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [configData, setConfigData] = useState<any>({})
  const [showModal, setShowModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showCampaignDetailModal, setShowCampaignDetailModal] = useState(false)
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    vehicle_type_id: '',
    trailer_type_id: '',
    product_type: '',
    origin: '',
    destination: ''
  })
  const [campaignFormData, setCampaignFormData] = useState({
    operation_id: '',
    campaign_date: ''
  })
  const [vehicleFormData, setVehicleFormData] = useState({
    plate: '',
    driver_name: '',
    driver_phone: ''
  })
  const [campaignVehicles, setCampaignVehicles] = useState<Omit<CampaignVehicle, 'id' | 'campaign_id' | 'created_at' | 'updated_at' | 'created_by'>[]>([])
  const [bulkVehicleData, setBulkVehicleData] = useState('')
  const [vehicleInputMode, setVehicleInputMode] = useState<'form' | 'bulk'>('form')
  const [searchTerm, setSearchTerm] = useState('')
  const [operationStatusFilter, setOperationStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<'all' | 'pending' | 'completed' | 'closed'>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const itemsPerPage = 20

  // Calculate active operations count
  const activeOperationsCount = operations.filter(op => op.status === 'active').length

  // Count only pending campaigns for the tab
  const pendingCampaignsCount = campaigns.filter(campaign => campaign.status === 'pending').length

  // Helper function to get active items from config
  const getActiveItems = (sectionKey: string) => {
    const section = configData[sectionKey]
    if (!section || !section.items) return []
    return section.items.filter((item: any) => item.active)
  }

  // Helper function to resolve ID to description
  const resolveIdToDescription = (sectionKey: string, id: string | null): string => {
    if (!id || !configData[sectionKey] || !configData[sectionKey].items) return 'N/A'
    
    const item = configData[sectionKey].items.find((item: any) => item.id === id)
    return item ? item.description : 'N/A'
  }

  // Get campaign statistics
  const getCampaignStats = (campaign: Campaign) => {
    const vehicles = campaign.vehicles || []
    const total = vehicles.length
    const sinGestion = vehicles.filter(v => v.status === 'sin-gestion').length
    const gestionado = vehicles.filter(v => v.status === 'gestionado').length
    const interesado = vehicles.filter(v => v.status === 'interesado').length
    const noInteresado = vehicles.filter(v => v.status === 'no-interesado').length
    const cancelada = vehicles.filter(v => v.status === 'cancelada').length
    const otros = total - sinGestion - gestionado - interesado - noInteresado - cancelada
    
    const progress = total > 0 ? Math.round(((total - sinGestion) / total) * 100) : 0
    
    return {
      total,
      sinGestion,
      gestionado,
      interesado,
      noInteresado,
      cancelada,
      otros,
      progress
    }
  }

  // Handle operation form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (editingOperation) {
        // Update existing operation
        const updatedOperations = operations.map(op =>
          op.id === editingOperation.id
            ? {
                ...op,
                name: formData.name,
                client_id: formData.client_id || null,
                vehicle_type_id: formData.vehicle_type_id || null,
                trailer_type_id: formData.trailer_type_id || null,
                product_type: formData.product_type || null,
                origin: formData.origin,
                destination: formData.destination
              }
            : op
        )
        setOperations(updatedOperations)
        localStorage.setItem('demo_operations', JSON.stringify(updatedOperations))
        setSuccess('Operación actualizada exitosamente')
      } else {
        // Create new operation
        const newOperation: Operation = {
          id: `op-${Date.now()}`,
          name: formData.name,
          client_id: formData.client_id || null,
          vehicle_type_id: formData.vehicle_type_id || null,
          trailer_type_id: formData.trailer_type_id || null,
          product_type: formData.product_type || null,
          origin: formData.origin,
          destination: formData.destination,
          status: 'active',
          created_at: new Date().toISOString(),
          deactivated_at: null,
          created_by: user?.id || 'unknown'
        }

        const updatedOperations = [newOperation, ...operations]
        setOperations(updatedOperations)
        localStorage.setItem('demo_operations', JSON.stringify(updatedOperations))
        setSuccess('Operación creada exitosamente')
      }

      setShowModal(false)
      setEditingOperation(null)
      setFormData({
        name: '',
        client_id: '',
        vehicle_type_id: '',
        trailer_type_id: '',
        product_type: '',
        origin: '',
        destination: ''
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al procesar la operación')
    }

    setLoading(false)
  }

  // Handle campaign form submission
  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (campaignVehicles.length === 0) {
      setError('Debe agregar al menos un vehículo a la campaña')
      setLoading(false)
      return
    }

    try {
      const operation = operations.find(op => op.id === campaignFormData.operation_id)
      const campaignId = `camp-${Date.now()}`
      
      const vehicles: CampaignVehicle[] = campaignVehicles.map((vehicle, index) => ({
        id: `${campaignId}-veh-${index + 1}`,
        campaign_id: campaignId,
        plate: vehicle.plate,
        driver_name: vehicle.driver_name,
        driver_phone: vehicle.driver_phone,
        status: 'sin-gestion',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || 'unknown'
      }))

      const newCampaign: Campaign = {
        id: campaignId,
        operation_id: campaignFormData.operation_id,
        campaign_date: campaignFormData.campaign_date,
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
        closed_at: null,
        created_by: user?.id || 'unknown',
        vehicles: vehicles
      }

      const updatedCampaigns = [newCampaign, ...campaigns]
      setCampaigns(updatedCampaigns)
      localStorage.setItem('demo_campaigns', JSON.stringify(updatedCampaigns))
      
      setSuccess(`Campaña creada exitosamente con ${vehicles.length} vehículos`)
      setShowCampaignModal(false)
      setCampaignFormData({ operation_id: '', campaign_date: '' })
      setCampaignVehicles([])
      setVehicleFormData({ plate: '', driver_name: '', driver_phone: '' })
      setBulkVehicleData('')
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      setError('Error al crear la campaña')
    }

    setLoading(false)
  }

  // Handle add vehicle to campaign
  const handleAddVehicle = () => {
    if (!vehicleFormData.plate || !vehicleFormData.driver_name || !vehicleFormData.driver_phone) {
      setError('Todos los campos del vehículo son obligatorios')
      return
    }

    // Validate plate format
    if (!/^[A-Z]{3}[0-9]{3}$/.test(vehicleFormData.plate)) {
      setError('La placa debe tener el formato AAA123')
      return
    }

    // Validate phone format
    if (!/^[0-9]{10}$/.test(vehicleFormData.driver_phone)) {
      setError('El celular debe tener 10 dígitos')
      return
    }

    // Check for duplicate plates
    if (campaignVehicles.some(v => v.plate === vehicleFormData.plate)) {
      setError('Ya existe un vehículo con esta placa')
      return
    }

    setCampaignVehicles([...campaignVehicles, { ...vehicleFormData }])
    setVehicleFormData({ plate: '', driver_name: '', driver_phone: '' })
    setError('')
  }

  // Handle bulk vehicle data
  const handleBulkVehicleData = () => {
    if (!bulkVehicleData.trim()) {
      setError('Ingrese los datos de los vehículos')
      return
    }

    try {
      const lines = bulkVehicleData.trim().split('\n')
      const newVehicles: typeof campaignVehicles = []
      const errors: string[] = []

      lines.forEach((line, index) => {
        const parts = line.split('\t').map(p => p.trim())
        if (parts.length < 3) {
          errors.push(`Línea ${index + 1}: Faltan datos (necesita placa, nombre, celular)`)
          return
        }

        const [plate, driver_name, driver_phone] = parts

        // Validate plate format
        if (!/^[A-Z]{3}[0-9]{3}$/.test(plate)) {
          errors.push(`Línea ${index + 1}: Placa "${plate}" debe tener formato AAA123`)
          return
        }

        // Validate phone format
        if (!/^[0-9]{10}$/.test(driver_phone)) {
          errors.push(`Línea ${index + 1}: Celular "${driver_phone}" debe tener 10 dígitos`)
          return
        }

        // Check for duplicates
        if (campaignVehicles.some(v => v.plate === plate) || newVehicles.some(v => v.plate === plate)) {
          errors.push(`Línea ${index + 1}: Placa "${plate}" está duplicada`)
          return
        }

        newVehicles.push({ plate, driver_name, driver_phone, status: 'sin-gestion' })
      })

      if (errors.length > 0) {
        setError(errors.join('\n'))
        return
      }

      setCampaignVehicles([...campaignVehicles, ...newVehicles])
      setBulkVehicleData('')
      setError('')
      setSuccess(`${newVehicles.length} vehículos agregados exitosamente`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al procesar los datos. Verifique el formato.')
    }
  }

  // Handle edit operation
  const handleEdit = (operation: Operation) => {
    if (operation.status !== 'active') return
    
    setEditingOperation(operation)
    setFormData({
      name: operation.name,
      client_id: operation.client_id || '',
      vehicle_type_id: operation.vehicle_type_id || '',
      trailer_type_id: operation.trailer_type_id || '',
      product_type: operation.product_type || '',
      origin: operation.origin,
      destination: operation.destination
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  // Handle inactivate operation
  const handleInactivate = async (operationId: string) => {
    if (!confirm('¿Estás seguro de que deseas inactivar esta operación?')) return

    try {
      const updatedOperations = operations.map(op =>
        op.id === operationId
          ? {
              ...op,
              status: 'inactive' as const,
              deactivated_at: new Date().toISOString()
            }
          : op
      )
      
      setOperations(updatedOperations)
      localStorage.setItem('demo_operations', JSON.stringify(updatedOperations))
      setSuccess('Operación inactivada exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al inactivar la operación')
    }
  }

  // Handle campaign status change
  const handleCampaignStatusChange = async (campaignId: string, newStatus: 'completed' | 'closed') => {
    if (!confirm(`¿Estás seguro de que deseas cambiar el estado de la campaña a "${newStatus === 'completed' ? 'Completada' : 'Cerrada'}"?`)) return

    try {
      const updatedCampaigns = campaigns.map(camp =>
        camp.id === campaignId
          ? {
              ...camp,
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : camp.completed_at,
              closed_at: newStatus === 'closed' ? new Date().toISOString() : camp.closed_at
            }
          : camp
      )
      
      setCampaigns(updatedCampaigns)
      localStorage.setItem('demo_campaigns', JSON.stringify(updatedCampaigns))
      setSuccess(`Campaña ${newStatus === 'completed' ? 'completada' : 'cerrada'} exitosamente`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al cambiar el estado de la campaña')
    }
  }

  // Handle vehicle status change
  const handleVehicleStatusChange = async (campaignId: string, vehicleId: string, newStatus: string) => {
    try {
      const updatedCampaigns = campaigns.map(camp =>
        camp.id === campaignId
          ? {
              ...camp,
              vehicles: camp.vehicles.map(veh =>
                veh.id === vehicleId
                  ? {
                      ...veh,
                      status: newStatus as any,
                      updated_at: new Date().toISOString()
                    }
                  : veh
              )
            }
          : camp
      )
      
      setCampaigns(updatedCampaigns)
      localStorage.setItem('demo_campaigns', JSON.stringify(updatedCampaigns))
      setSuccess('Estado del vehículo actualizado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Error al actualizar el estado del vehículo')
    }
  }

  // Load configuration data
  useEffect(() => {
    console.log('🔧 Loading configuration data...')
    const loadConfigData = () => {
      const stored = localStorage.getItem('demo_config_data')
      if (stored) {
        const config = JSON.parse(stored)
        console.log('✅ Configuration data loaded:', Object.keys(config))
        setConfigData(config)
      } else {
        console.log('⚠️ No configuration data found')
      }
    }
    loadConfigData()
  }, [])

  // Load operations
  useEffect(() => {
    console.log('🏢 Loading operations...')
    const loadOperations = () => {
      const stored = localStorage.getItem('demo_operations')
      if (stored) {
        const ops = JSON.parse(stored)
        console.log('✅ Operations loaded:', ops.length)
        setOperations(ops)
      } else {
        console.log('📝 Creating default operations...')
        const defaultOperations: Operation[] = [
          {
            id: 'op-1',
            name: 'Transporte Bogotá - Medellín',
            client_id: '1',
            vehicle_type_id: '1',
            trailer_type_id: '1',
            product_type: 'Acerero',
            origin: 'Bogotá',
            destination: 'Medellín',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            deactivated_at: null,
            created_by: user?.id || 'demo-admin'
          },
          {
            id: 'op-2',
            name: 'Carga Cali - Barranquilla',
            client_id: '2',
            vehicle_type_id: '2',
            trailer_type_id: '2',
            product_type: 'Construcción',
            origin: 'Cali',
            destination: 'Barranquilla',
            status: 'active',
            created_at: '2024-01-02T00:00:00Z',
            deactivated_at: null,
            created_by: user?.id || 'demo-admin'
          }
        ]
        setOperations(defaultOperations)
        localStorage.setItem('demo_operations', JSON.stringify(defaultOperations))
        console.log('✅ Default operations created')
      }
    }
    loadOperations()
  }, [user])

  // Load campaigns
  useEffect(() => {
    console.log('📅 Loading campaigns...')
    const loadCampaigns = () => {
      const stored = localStorage.getItem('demo_campaigns')
      if (stored) {
        const camps = JSON.parse(stored)
        console.log('✅ Campaigns loaded:', camps.length)
        setCampaigns(camps)
      } else {
        console.log('📝 Creating default campaigns...')
        const defaultCampaigns: Campaign[] = [
          {
            id: 'camp-1',
            operation_id: 'op-1',
            campaign_date: '2024-01-15',
            status: 'pending',
            created_at: '2024-01-10T00:00:00Z',
            completed_at: null,
            closed_at: null,
            created_by: user?.id || 'demo-admin',
            vehicles: [
              {
                id: 'camp-1-veh-1',
                campaign_id: 'camp-1',
                plate: 'ABC123',
                driver_name: 'Juan Pérez',
                driver_phone: '3001234567',
                status: 'sin-gestion',
                created_at: '2024-01-10T00:00:00Z',
                updated_at: '2024-01-10T00:00:00Z',
                created_by: user?.id || 'demo-admin'
              },
              {
                id: 'camp-1-veh-2',
                campaign_id: 'camp-1',
                plate: 'DEF456',
                driver_name: 'María González',
                driver_phone: '3009876543',
                status: 'interesado',
                created_at: '2024-01-10T00:00:00Z',
                updated_at: '2024-01-12T00:00:00Z',
                created_by: user?.id || 'demo-admin'
              }
            ]
          }
        ]
        setCampaigns(defaultCampaigns)
        localStorage.setItem('demo_campaigns', JSON.stringify(defaultCampaigns))
        console.log('✅ Default campaigns created')
      }
    }
    loadCampaigns()
  }, [user])

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

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    console.log('🔍 Filtering and sorting data for view:', activeView)
    
    let data: any[] = []
    
    if (activeView === 'operations') {
      data = operations.filter(op => {
        const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             op.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             op.destination.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesStatus = operationStatusFilter === 'all' || op.status === operationStatusFilter
        const matchesClient = clientFilter === 'all' || op.client_id === clientFilter
        
        return matchesSearch && matchesStatus && matchesClient
      })
    } else {
      data = campaigns.filter(camp => {
        const operation = operations.find(op => op.id === camp.operation_id)
        const matchesSearch = operation ? 
          operation.name.toLowerCase().includes(searchTerm.toLowerCase()) : false
        
        const matchesStatus = campaignStatusFilter === 'all' || camp.status === campaignStatusFilter
        
        return matchesSearch && matchesStatus
      })
    }

    // Sort data
    data.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'created_at' || sortField === 'campaign_date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else {
        aValue = aValue?.toString().toLowerCase() || ''
        bValue = bValue?.toString().toLowerCase() || ''
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    console.log('✅ Filtered and sorted data:', data.length, 'items')
    return data
  }, [activeView, operations, campaigns, searchTerm, operationStatusFilter, campaignStatusFilter, clientFilter, sortField, sortDirection])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleExportToExcel = () => {
    console.log('📊 Exporting to Excel...')
    
    let exportData: any[] = []
    
    if (activeView === 'operations') {
      exportData = filteredAndSortedData.map((op: Operation) => ({
        'Nombre': op.name,
        'Cliente': resolveIdToDescription('clients', op.client_id),
        'Tipo Vehículo': resolveIdToDescription('vehicle-types', op.vehicle_type_id),
        'Tipo Tráiler': resolveIdToDescription('trailer-types', op.trailer_type_id),
        'Tipo Producto': op.product_type || 'N/A',
        'Origen': op.origin,
        'Destino': op.destination,
        'Estado': op.status === 'active' ? 'Activa' : 'Inactiva',
        'Fecha Creación': new Date(op.created_at).toLocaleDateString('es-CO')
      }))
    } else {
      exportData = filteredAndSortedData.map((camp: Campaign) => {
        const operation = operations.find(op => op.id === camp.operation_id)
        const stats = getCampaignStats(camp)
        return {
          'Operación': operation?.name || 'N/A',
          'Cliente': resolveIdToDescription('clients', operation?.client_id || null),
          'Fecha Campaña': new Date(camp.campaign_date).toLocaleDateString('es-CO'),
          'Estado': camp.status === 'pending' ? 'Pendiente' : 
                   camp.status === 'completed' ? 'Completada' : 'Cerrada',
          'Total Vehículos': stats.total,
          'Sin Gestión': stats.sinGestion,
          'Interesados': stats.interesado,
          'No Interesados': stats.noInteresado,
          'Progreso %': stats.progress,
          'Fecha Creación': new Date(camp.created_at).toLocaleDateString('es-CO')
        }
      })
    }

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeView === 'operations' ? 'Operaciones' : 'Campañas')
    
    const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }))
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `${activeView}_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    console.log('✅ Excel export completed')
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800'
  }

  const vehicleStatusColors = {
    'sin-gestion': 'bg-gray-100 text-gray-800',
    'gestionado': 'bg-blue-100 text-blue-800',
    'buzon': 'bg-yellow-100 text-yellow-800',
    'no-conductor': 'bg-orange-100 text-orange-800',
    'cambio-vehiculo': 'bg-purple-100 text-purple-800',
    'no-interesado-logicem': 'bg-red-100 text-red-800',
    'restriccion-cargue': 'bg-pink-100 text-pink-800',
    'no-interesado': 'bg-red-100 text-red-800',
    'interesado-despues': 'bg-indigo-100 text-indigo-800',
    'interesado': 'bg-green-100 text-green-800',
    'cancelada': 'bg-gray-100 text-gray-800'
  }

  const vehicleStatusLabels = {
    'sin-gestion': 'Sin Gestión',
    'gestionado': 'Gestionado',
    'buzon': 'Buzón',
    'no-conductor': 'No Conductor',
    'cambio-vehiculo': 'Cambio Vehículo',
    'no-interesado-logicem': 'No Interesado Logicem',
    'restriccion-cargue': 'Restricción Cargue',
    'no-interesado': 'No Interesado',
    'interesado-despues': 'Interesado Después',
    'interesado': 'Interesado',
    'cancelada': 'Cancelada'
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#4A4A4A]">Gestión de Campañas</h2>
            <p className="text-sm text-gray-500">
              Administra operaciones y campañas telefónicas ({filteredAndSortedData.length} elementos)
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportToExcel}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            {activeView === 'operations' && user?.role !== 'agent' && (
              <button
                onClick={() => {
                  setEditingOperation(null)
                  setFormData({
                    name: '',
                    client_id: '',
                    vehicle_type_id: '',
                    trailer_type_id: '',
                    product_type: '',
                    origin: '',
                    destination: ''
                  })
                  setShowModal(true)
                  setError('')
                  setSuccess('')
                }}
                className="flex items-center space-x-2 bg-[#D95F2A] text-white px-4 py-2 rounded-lg hover:bg-[#B8532A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Operación</span>
              </button>
            )}
            {activeView === 'campaigns' && user?.role !== 'agent' && (
              <button
                onClick={() => {
                  setCampaignFormData({ operation_id: '', campaign_date: '' })
                  setCampaignVehicles([])
                  setVehicleFormData({ plate: '', driver_name: '', driver_phone: '' })
                  setBulkVehicleData('')
                  setVehicleInputMode('form')
                  setShowCampaignModal(true)
                  setError('')
                  setSuccess('')
                }}
                className="flex items-center space-x-2 bg-[#D95F2A] text-white px-4 py-2 rounded-lg hover:bg-[#B8532A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Campaña</span>
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setActiveView('operations')
              setCurrentPage(1)
              setSearchTerm('')
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'operations'
                ? 'bg-white text-[#D95F2A] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Operaciones</span>
              {activeOperationsCount > 0 && (
                <span className="bg-[#D95F2A] text-white text-xs px-2 py-0.5 rounded-full">
                  {activeOperationsCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => {
              setActiveView('campaigns')
              setCurrentPage(1)
              setSearchTerm('')
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'campaigns'
                ? 'bg-white text-[#D95F2A] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Campañas</span>
              {pendingCampaignsCount > 0 && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCampaignsCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Buscar ${activeView === 'operations' ? 'operaciones' : 'campañas'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                />
              </div>
            </div>

            {activeView === 'operations' && (
              <>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={operationStatusFilter}
                    onChange={(e) => setOperationStatusFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activas</option>
                    <option value="inactive">Inactivas</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="all">Todos los clientes</option>
                    {getActiveItems('clients').map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.description}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {activeView === 'campaigns' && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={campaignStatusFilter}
                  onChange={(e) => setCampaignStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="closed">Cerradas</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div className="whitespace-pre-line">{error}</div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {activeView === 'operations' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nombre</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo/Tráiler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ruta
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Estado</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fecha Creación</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((operation: Operation) => (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{operation.name}</div>
                        {operation.product_type && (
                          <div className="text-sm text-gray-500">{operation.product_type}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resolveIdToDescription('clients', operation.client_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resolveIdToDescription('vehicle-types', operation.vehicle_type_id)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {resolveIdToDescription('trailer-types', operation.trailer_type_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {operation.origin} → {operation.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[operation.status]}`}>
                          {operation.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(operation.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {operation.status === 'active' && user?.role !== 'agent' && (
                            <>
                              <button
                                onClick={() => handleEdit(operation)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar operación"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleInactivate(operation.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Inactivar operación"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operación
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('campaign_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fecha Campaña</span>
                        {getSortIcon('campaign_date')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Estado</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Fecha Creación</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((campaign: Campaign) => {
                    const operation = operations.find(op => op.id === campaign.operation_id)
                    const stats = getCampaignStats(campaign)
                    
                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {operation?.name || 'Operación no encontrada'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resolveIdToDescription('clients', operation?.client_id || null)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {new Date(campaign.campaign_date).toLocaleDateString('es-CO')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {stats.total}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stats.sinGestion} sin gestión
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>{stats.progress}%</span>
                                <span>{stats.total - stats.sinGestion}/{stats.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${stats.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[campaign.status]}`}>
                            {campaign.status === 'pending' ? 'Pendiente' : 
                             campaign.status === 'completed' ? 'Completada' : 'Cerrada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(campaign.created_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign)
                                setShowCampaignDetailModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {campaign.status === 'pending' && user?.role !== 'agent' && (
                              <>
                                <button
                                  onClick={() => handleCampaignStatusChange(campaign.id, 'completed')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Marcar como completada"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCampaignStatusChange(campaign.id, 'closed')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cerrar campaña"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-[#D95F2A] text-white border-[#D95F2A]'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Operation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOperation ? 'Editar Operación' : 'Nueva Operación'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Operación *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  placeholder="Ej: Transporte Bogotá - Medellín"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="">Seleccionar cliente</option>
                    {getActiveItems('clients').map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={formData.vehicle_type_id}
                    onChange={(e) => setFormData({ ...formData, vehicle_type_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo de vehículo</option>
                    {getActiveItems('vehicle-types').map((type: any) => (
                      <option key={type.id} value={type.id}>
                        {type.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Tráiler
                  </label>
                  <select
                    value={formData.trailer_type_id}
                    onChange={(e) => setFormData({ ...formData, trailer_type_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo de tráiler</option>
                    {getActiveItems('trailer-types').map((type: any) => (
                      <option key={type.id} value={type.id}>
                        {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Producto
                  </label>
                  <input
                    type="text"
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                    placeholder="Ej: Acerero, Construcción"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                    placeholder="Ciudad de origen"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destino *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                    placeholder="Ciudad de destino"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#D95F2A] text-white rounded-lg hover:bg-[#B8532A] disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingOperation ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Campaña</h3>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCampaignSubmit} className="space-y-6">
              {/* Campaign Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operación *
                  </label>
                  <select
                    required
                    value={campaignFormData.operation_id}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, operation_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  >
                    <option value="">Seleccionar operación</option>
                    {operations.filter(op => op.status === 'active').map((operation) => (
                      <option key={operation.id} value={operation.id}>
                        {operation.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Campaña *
                  </label>
                  <input
                    type="date"
                    required
                    value={campaignFormData.campaign_date}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, campaign_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Vehicle Input Mode Toggle */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Vehículos de la Campaña</h4>
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setVehicleInputMode('form')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        vehicleInputMode === 'form'
                          ? 'bg-white text-[#D95F2A] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Formulario
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleInputMode('bulk')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        vehicleInputMode === 'bulk'
                          ? 'bg-white text-[#D95F2A] shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Carga Masiva
                    </button>
                  </div>
                </div>

                {vehicleInputMode === 'form' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placa
                        </label>
                        <input
                          type="text"
                          value={vehicleFormData.plate}
                          onChange={(e) => setVehicleFormData({ ...vehicleFormData, plate: e.target.value.toUpperCase() })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                          placeholder="ABC123"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre del Conductor
                        </label>
                        <input
                          type="text"
                          value={vehicleFormData.driver_name}
                          onChange={(e) => setVehicleFormData({ ...vehicleFormData, driver_name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Celular
                        </label>
                        <input
                          type="tel"
                          value={vehicleFormData.driver_phone}
                          onChange={(e) => setVehicleFormData({ ...vehicleFormData, driver_phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                          placeholder="3001234567"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVehicle}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Vehículo</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Datos de Vehículos (separados por tabulación)
                      </label>
                      <textarea
                        value={bulkVehicleData}
                        onChange={(e) => setBulkVehicleData(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                        rows={8}
                        placeholder="ABC123	Juan Pérez	3001234567
DEF456	María González	3009876543
GHI789	Carlos López	3005555555"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: Placa [TAB] Nombre [TAB] Celular (una línea por vehículo)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkVehicleData}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Procesar Datos</span>
                    </button>
                  </div>
                )}

                {/* Vehicle List */}
                {campaignVehicles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        Vehículos Agregados ({campaignVehicles.length})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setCampaignVehicles([])}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Limpiar todos
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Celular</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {campaignVehicles.map((vehicle, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 font-mono">{vehicle.plate}</td>
                              <td className="px-3 py-2">{vehicle.driver_name}</td>
                              <td className="px-3 py-2">{vehicle.driver_phone}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setCampaignVehicles(campaignVehicles.filter((_, i) => i !== index))}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || campaignVehicles.length === 0}
                  className="px-4 py-2 bg-[#D95F2A] text-white rounded-lg hover:bg-[#B8532A] disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showCampaignDetailModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalles de Campaña</h3>
                <p className="text-sm text-gray-500">
                  {operations.find(op => op.id === selectedCampaign.operation_id)?.name || 'Operación no encontrada'}
                </p>
              </div>
              <button
                onClick={() => setShowCampaignDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Campaign Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Vehículos</p>
                    <p className="text-2xl font-bold text-blue-900">{getCampaignStats(selectedCampaign).total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-gray-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Sin Gestión</p>
                    <p className="text-2xl font-bold text-gray-900">{getCampaignStats(selectedCampaign).sinGestion}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Check className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Interesados</p>
                    <p className="text-2xl font-bold text-green-900">{getCampaignStats(selectedCampaign).interesado}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <X className="w-8 h-8 text-red-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-600">No Interesados</p>
                    <p className="text-2xl font-bold text-red-900">{getCampaignStats(selectedCampaign).noInteresado}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Vehículos de la Campaña</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conductor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Celular
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Actualización
                      </th>
                      {user?.role !== 'agent' && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCampaign.vehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">{vehicle.plate}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.driver_name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.driver_phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vehicleStatusColors[vehicle.status]}`}>
                            {vehicleStatusLabels[vehicle.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(vehicle.updated_at).toLocaleDateString('es-CO')} {new Date(vehicle.updated_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        {user?.role !== 'agent' && (
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <select
                              value={vehicle.status}
                              onChange={(e) => handleVehicleStatusChange(selectedCampaign.id, vehicle.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#D95F2A] focus:border-transparent"
                            >
                              {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <button
                onClick={() => setShowCampaignDetailModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}