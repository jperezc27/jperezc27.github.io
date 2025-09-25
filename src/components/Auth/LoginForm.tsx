import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Truck, Eye, EyeOff } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAEAEA] to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#D95F2A] rounded-xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-[#4A4A4A]">
            Logicem Call Center
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#4A4A4A]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#D95F2A] focus:border-[#D95F2A] focus:z-10 sm:text-sm"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#4A4A4A]">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#D95F2A] focus:border-[#D95F2A] focus:z-10 sm:text-sm pr-10"
                    placeholder="Contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#D95F2A] hover:bg-[#B8532A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D95F2A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            ¿Problemas para acceder? Contacta al administrador del sistema
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-600 font-medium mb-2">Credenciales de prueba disponibles:</p>
            <div className="space-y-1 text-xs text-blue-600">
              <div>
                <strong>Administrador:</strong> admin@logicem.com / LogicemAdmin2024!
              </div>
              <div>
                <strong>Gestor:</strong> manager@logicem.com / LogicemManager2024!
              </div>
              <div>
                <strong>Agente:</strong> agent@logicem.com / LogicemAgent2024!
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-2 italic">
              Estos usuarios funcionan sin necesidad de configurar Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}