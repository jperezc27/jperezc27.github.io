import React from 'react'
import { Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { timeRemaining } = useAuth()
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600' // Last minute - red
    if (timeRemaining <= 120) return 'text-orange-600' // Last 2 minutes - orange
    return 'text-gray-600' // Normal - gray
  }
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#4A4A4A]">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tus campañas telefónicas de manera eficiente
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${getTimeColor()}`} />
            <span className={`text-sm font-medium ${getTimeColor()}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}