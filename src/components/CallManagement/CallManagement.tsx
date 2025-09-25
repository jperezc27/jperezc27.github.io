import React, { useState, useEffect } from 'react'
import { Phone, Calendar, Truck, ArrowLeft, User, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Operation {
  id: string
  name: string
  client_id: string
  vehicle_type_id: string
  trailer_type_id: string
  product_type_id: string
  origin: string
  destination: string
  status: 'active' | 'inactive'
  created_at: string
}

interface Campaign {
  id: string
  operation_id: string
  campaign_date: string
  status: 'pending' | 'completed' | 'closed'
  created_at: string
}

interface CampaignVehicle {
  id: string
  campaign_id: string
  plate: string
  score: number
  driver_name: string
  driver_phone: string
  status: string
  created_at: string
}

interface CallResult {
  vehicle_id: string
  result_type: 'buzon' | 'no-contesta' | 'contesta'
  phone_number: string
  created_at: string
  created_by: string
}

export default function CallManagement() {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<'operations' | 'campaigns' | 'vehicles' | 'call-form'>('operations')
  const [operations, setOperations] = useState<Operation[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [vehicles, setVehicles] = useState<CampaignVehicle[]>([])
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<CampaignVehicle | null>(null)
  const [callResult, setCallResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  // Load operations on component mount
  useEffect(() => {
    const loadOperations = async () => {
      try {
        const storedOperations = localStorage.getItem('demo_operations')
        const storedCampaigns = localStorage.getItem('demo_campaigns')
        
        if (storedOperations) {
          const allOperations = JSON.parse(storedOperations)
          const activeOperations = allOperations.filter((op: Operation) => op.status === 'active')
          
          // Filter operations that have pending campaigns
          if (storedCampaigns) {
            const allCampaigns = JSON.parse(storedCampaigns)
            const operationsWithPendingCampaigns = activeOperations.filter((operation: Operation) => {
              return allCampaigns.some((campaign: Campaign) => 
                String(campaign.operation_id) === String(operation.id) && 
                campaign.status === 'pending'
              )
            })
            setOperations(operationsWithPendingCampaigns)
          } else {
            setOperations([])
          }
        } else {
          // Initialize with demo data if no operations exist
          const demoOperations: Operation[] = [
            {
              id: 'op-1',
              name: 'Operación Bogotá - Medellín',
              client_id: 'client-1',
              vehicle_type_id: 'vt-1',
              trailer_type_id: 'tt-1',
              product_type_id: 'pt-1',
              origin: 'Bogotá',
              destination: 'Medellín',
              status: 'active',
              created_at: new Date().toISOString()
            },
            {
              id: 'op-2',
              name: 'Operación Medellín - Cartagena',
              client_id: 'client-2',
              vehicle_type_id: 'vt-2',
              trailer_type_id: 'tt-2',
              product_type_id: 'pt-2',
              origin: 'Medellín',
              destination: 'Cartagena',
              status: 'active',
              created_at: new Date().toISOString()
            }
          ]
          localStorage.setItem('demo_operations', JSON.stringify(demoOperations))
          setOperations(demoOperations)
        }
      } catch (error) {
        // If there's an error, initialize with empty array
        setOperations([])
      }
    }
    
    loadOperations()
  }, [])

  const loadCampaigns = (operationId: string) => {
    try {
      const storedCampaigns = localStorage.getItem('demo_campaigns')
      if (storedCampaigns) {
        const allCampaigns = JSON.parse(storedCampaigns)
        const operationCampaigns = allCampaigns
          .filter((campaign: Campaign) => 
            String(campaign.operation_id) === String(operationId) && 
            campaign.status === 'pending'
          )
          .sort((a: Campaign, b: Campaign) => {
            // First sort by campaign_date (oldest first)
            const dateA = new Date(a.campaign_date).getTime()
            const dateB = new Date(b.campaign_date).getTime()
            
            if (dateA !== dateB) {
              return dateA - dateB
            }
            
            // If campaign_date is the same, sort by created_at (oldest first)
            const createdA = new Date(a.created_at).getTime()
            const createdB = new Date(b.created_at).getTime()
            return createdA - createdB
          })
        setCampaigns(operationCampaigns)
      } else {
        // Initialize with demo campaigns if none exist
        const demoCampaigns: Campaign[] = [
          {
            id: 'camp-1',
            operation_id: 'op-1',
            campaign_date: '2024-12-24',
            status: 'pending',
            created_at: new Date().toISOString()
          },
          {
            id: 'camp-2',
            operation_id: 'op-1',
            campaign_date: '2024-12-25',
            status: 'pending',
            created_at: new Date().toISOString()
          },
          {
            id: 'camp-3',
            operation_id: 'op-2',
            campaign_date: '2024-12-24',
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]
        localStorage.setItem('demo_campaigns', JSON.stringify(demoCampaigns))
        
        // Filter for the selected operation and only pending campaigns, then sort
        const operationCampaigns = demoCampaigns
          .filter((campaign: Campaign) => 
            String(campaign.operation_id) === String(operationId) && 
            campaign.status === 'pending'
          )
          .sort((a: Campaign, b: Campaign) => {
            // First sort by campaign_date (oldest first)
            const dateA = new Date(a.campaign_date).getTime()
            const dateB = new Date(b.campaign_date).getTime()
            
            if (dateA !== dateB) {
              return dateA - dateB
            }
            
            // If campaign_date is the same, sort by created_at (oldest first)
            const createdA = new Date(a.created_at).getTime()
            const createdB = new Date(b.created_at).getTime()
            return createdA - createdB
          })
        setCampaigns(operationCampaigns)
      }
    } catch (error) {
      setCampaigns([])
    }
  }

  const loadVehicles = (campaignId: string) => {
    try {
      console.log('🔍 Loading vehicles for campaign:', campaignId)
      const storedVehicles = localStorage.getItem('demo_campaign_vehicles')
      console.log('📦 Stored vehicles data:', storedVehicles)
      
      if (storedVehicles) {
        const allVehicles = JSON.parse(storedVehicles)
        console.log('🚛 All vehicles parsed:', allVehicles)
        
        // Show all unique campaign IDs in the data
        const uniqueCampaignIds = [...new Set(allVehicles.map((v: any) => v.campaign_id))]
        console.log('🆔 All campaign IDs in storage:', uniqueCampaignIds)
        
        // Check if the target campaign has any vehicles at all
        const vehiclesForCampaign = allVehicles.filter((vehicle: any) => 
          String(vehicle.campaign_id) === String(campaignId)
        )
        console.log('🎯 Vehicles found for target campaign:', vehiclesForCampaign)
        
        // Find vehicles with exact campaign ID match only
        const campaignVehicles = allVehicles.filter((vehicle: any) => {
          console.log('🔎 Checking vehicle:', vehicle.id, 'campaign_id:', vehicle.campaign_id, 'vs target:', campaignId)
          return String(vehicle.campaign_id) === String(campaignId)
        })
        
        console.log('🎯 Campaign vehicles found:', campaignVehicles)
        
        const availableVehicles = campaignVehicles.filter((vehicle: any) => {
          const status = String(vehicle.status || '').toLowerCase().trim().replace(/\s+/g, '-')
          console.log('🚦 Vehicle status check:', vehicle.plate, 'status:', vehicle.status, 'normalized:', status)
          return status === 'sin-gestión' ||
                 status === 'sin-gestion' ||
                 status === 'sin-gestión' ||
                 status === 'sin-gestion' ||
                 status === 'pending'
        })
        console.log('✅ Available vehicles after filtering:', availableVehicles)
        
        setVehicles(availableVehicles)
      } else {
        // Initialize with demo vehicles if none exist
        const demoVehicles: CampaignVehicle[] = [
          {
            id: 'veh-1',
            campaign_id: 'camp-1',
            plate: 'ABC123',
            score: 8.5,
            driver_name: 'Juan Pérez',
            driver_phone: '3001234567',
            status: 'sin-gestion',
            created_at: new Date().toISOString()
          },
          {
            id: 'veh-2',
            campaign_id: 'camp-1',
            plate: 'DEF456',
            score: 7.2,
            driver_name: 'María González',
            driver_phone: '3009876543',
            status: 'sin-gestion',
            created_at: new Date().toISOString()
          },
          {
            id: 'veh-3',
            campaign_id: 'camp-2',
            plate: 'GHI789',
            score: 9.1,
            driver_name: 'Carlos Rodríguez',
            driver_phone: '3005555555',
            status: 'sin-gestion',
            created_at: new Date().toISOString()
          }
        ]
        localStorage.setItem('demo_campaign_vehicles', JSON.stringify(demoVehicles))
        
        // Filter for the selected campaign
        const campaignVehicles = demoVehicles.filter((vehicle: any) => {
          return String(vehicle.campaign_id) === String(campaignId)
        })
        
        const availableVehicles = campaignVehicles.filter((vehicle: any) => {
          const status = String(vehicle.status || '').toLowerCase().trim()
          return status === 'sin gestión' || 
                 status === 'sin gestion' || 
                 status === 'sin-gestion' ||
                 status === 'pending'
        })
        
        setVehicles(availableVehicles)
      }
    } catch (error) {
      setVehicles([])
    }
  }

  const handleOperationSelect = (operation: Operation) => {
    setSelectedOperation(operation)
    loadCampaigns(operation.id)
    setCurrentView('campaigns')
  }

  const handleCampaignSelect = (campaign: Campaign) => {
    console.log('🎯 Campaign selected:', campaign.id, campaign)
    setSelectedCampaign(campaign)
    loadVehicles(campaign.id)
    setCurrentView('vehicles')
  }

  const handleVehicleSelect = (vehicle: CampaignVehicle) => {
    setSelectedVehicle(vehicle)
    setCallResult('')
    setCurrentView('call-form')
  }

  const handleCallResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callResult || !selectedVehicle) return

    setLoading(true)
    setSuccess('')

    try {
      const storedVehicles = localStorage.getItem('demo_campaign_vehicles')
      if (storedVehicles) {
        const allVehicles = JSON.parse(storedVehicles)
        const updatedVehicles = allVehicles.map((vehicle: CampaignVehicle) =>
          vehicle.id === selectedVehicle.id
            ? { ...vehicle, status: callResult === 'buzon' ? 'buzon' : callResult === 'no-contesta' ? 'no-conductor' : 'gestionado' }
            : vehicle
        )
        localStorage.setItem('demo_campaign_vehicles', JSON.stringify(updatedVehicles))
      }

      const callLog: CallResult = {
        vehicle_id: selectedVehicle.id,
        result_type: callResult as 'buzon' | 'no-contesta' | 'contesta',
        phone_number: selectedVehicle.driver_phone,
        created_at: new Date().toISOString(),
        created_by: user?.id || 'unknown'
      }

      const storedCallLogs = localStorage.getItem('demo_call_logs')
      const allCallLogs = storedCallLogs ? JSON.parse(storedCallLogs) : []
      allCallLogs.push(callLog)
      localStorage.setItem('demo_call_logs', JSON.stringify(allCallLogs))

      setSuccess(`✅ Llamada registrada exitosamente. Vehículo ${selectedVehicle.plate} actualizado a estado "${callResult}".`)
      
      setTimeout(() => {
        if (selectedCampaign) {
          loadVehicles(selectedCampaign.id)
        }
        setCurrentView('vehicles')
        setSelectedVehicle(null)
        setCallResult('')
        setSuccess('')
      }, 2000)

    } catch (error) {
      console.error('Error saving call result:', error)
    }

    setLoading(false)
  }

  const goBack = () => {
    if (currentView === 'call-form') {
      setCurrentView('vehicles')
      setSelectedVehicle(null)
      setCallResult('')
    } else if (currentView === 'vehicles') {
      setCurrentView('campaigns')
      setSelectedCampaign(null)
      setVehicles([])
    } else if (currentView === 'campaigns') {
      setCurrentView('operations')
      setSelectedOperation(null)
      setCampaigns([])
    }
  }

  const renderBreadcrumb = () => {
    const items = []
    
    if (currentView !== 'operations') {
      items.push('Operaciones')
    }
    
    if (selectedOperation && currentView !== 'campaigns') {
      items.push(selectedOperation.name)
    }
    
    if (selectedCampaign && currentView !== 'vehicles') {
      items.push(`Campaña ${new Date(selectedCampaign.campaign_date).toLocaleDateString('es-CO')}`)
    }
    
    if (selectedVehicle) {
      items.push(`Vehículo ${selectedVehicle.plate}`)
    }

    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Operations View
  if (currentView === 'operations') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Gestión de Llamadas</h2>
          <p className="text-sm text-gray-500">Selecciona una operación activa para comenzar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operations.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">No hay operaciones activas</h3>
              <p className="text-gray-500">No se encontraron operaciones activas para gestionar llamadas.</p>
            </div>
          ) : (
            operations.map((operation) => (
              <button
                key={operation.id}
                onClick={() => handleOperationSelect(operation)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[#D95F2A] transition-all group text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-[#D95F2A] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#4A4A4A] group-hover:text-[#D95F2A] transition-colors">
                      {operation.name}
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">Origen:</span>
                    <span className="ml-2">{operation.origin}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Destino:</span>
                    <span className="ml-2">{operation.destination}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Campaigns View
  if (currentView === 'campaigns') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={goBack}
            className="text-[#D95F2A] hover:text-[#B8532A] font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {renderBreadcrumb()}

        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Campañas Pendientes</h2>
          <p className="text-sm text-gray-500">
            Operación: {selectedOperation?.name} - Selecciona una campaña para gestionar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">No hay campañas pendientes</h3>
              <p className="text-gray-500">No se encontraron campañas pendientes para esta operación.</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => handleCampaignSelect(campaign)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[#D95F2A] transition-all group text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#4A4A4A] group-hover:text-[#D95F2A] transition-colors">
                      Campaña {new Date(campaign.campaign_date).toLocaleDateString('es-CO')}
                    </h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2 capitalize">{campaign.status}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">Fecha:</span>
                    <span className="ml-2">{new Date(campaign.campaign_date).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Vehicles View
  if (currentView === 'vehicles') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={goBack}
            className="text-[#D95F2A] hover:text-[#B8532A] font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {renderBreadcrumb()}

        <div>
          <h2 className="text-xl font-semibold text-[#4A4A4A]">Vehículos Sin Gestión</h2>
          <p className="text-sm text-gray-500">
            Campaña: {selectedCampaign && new Date(selectedCampaign.campaign_date).toLocaleDateString('es-CO')} - Selecciona un vehículo para llamar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">No hay vehículos sin gestión</h3>
              <p className="text-gray-500">Todos los vehículos de esta campaña ya han sido gestionados.</p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[#D95F2A] transition-all group text-left"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#4A4A4A] group-hover:text-[#D95F2A] transition-colors">
                      {vehicle.plate}
                    </h3>
                    <p className="text-sm text-gray-500">Score: {vehicle.score}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span>{vehicle.driver_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{vehicle.driver_phone}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Call Form View
  if (currentView === 'call-form' && selectedVehicle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={goBack}
            className="text-[#D95F2A] hover:text-[#B8532A] font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {renderBreadcrumb()}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-[#D95F2A] rounded-lg flex items-center justify-center">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#4A4A4A]">Gestión de Llamada</h2>
              <p className="text-sm text-gray-500">Vehículo: {selectedVehicle.plate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-medium text-[#4A4A4A]">Información del Conductor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Nombre:</span>
                  <span className="ml-2">{selectedVehicle.driver_name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Teléfono:</span>
                  <span className="ml-2">{selectedVehicle.driver_phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#4A4A4A]">Información del Vehículo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Truck className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Placa:</span>
                  <span className="ml-2">{selectedVehicle.plate}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium">Score:</span>
                  <span className="ml-2">{selectedVehicle.score}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleCallResultSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-3">
                Resultado de la Llamada *
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="callResult"
                    value="buzon"
                    checked={callResult === 'buzon'}
                    onChange={(e) => setCallResult(e.target.value)}
                    className="w-4 h-4 text-[#D95F2A] border-gray-300 focus:ring-[#D95F2A] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#4A4A4A]">Buzón</div>
                    <div className="text-sm text-gray-500">La llamada fue a buzón de voz</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="callResult"
                    value="no-contesta"
                    checked={callResult === 'no-contesta'}
                    onChange={(e) => setCallResult(e.target.value)}
                    className="w-4 h-4 text-[#D95F2A] border-gray-300 focus:ring-[#D95F2A] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#4A4A4A]">No Contesta</div>
                    <div className="text-sm text-gray-500">El conductor no contestó la llamada</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="callResult"
                    value="contesta"
                    checked={callResult === 'contesta'}
                    onChange={(e) => setCallResult(e.target.value)}
                    className="w-4 h-4 text-[#D95F2A] border-gray-300 focus:ring-[#D95F2A] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[#4A4A4A]">Contesta</div>
                    <div className="text-sm text-gray-500">El conductor contestó la llamada</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 bg-gray-200 text-[#4A4A4A] py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !callResult}
                className="flex-1 bg-[#D95F2A] text-white py-3 px-4 rounded-md hover:bg-[#B8532A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar Resultado'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return null
}