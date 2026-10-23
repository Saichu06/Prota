import React, { createContext, useContext, useState } from 'react'
import { AssistantDrawer } from '../components/AssistantDrawer'

interface AssistantContextType {
  isAssistantOpen: boolean
  openAssistant: () => void
  closeAssistant: () => void
  toggleAssistant: () => void
}

const defaultContext: AssistantContextType = {
  isAssistantOpen: false,
  openAssistant: () => {},
  closeAssistant: () => {},
  toggleAssistant: () => {},
}

const AssistantContext = createContext<AssistantContextType>(defaultContext)

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  const openAssistant = () => setIsAssistantOpen(true)
  const closeAssistant = () => setIsAssistantOpen(false)
  const toggleAssistant = () => setIsAssistantOpen((prev) => !prev)

  return (
    <AssistantContext.Provider
      value={{
        isAssistantOpen,
        openAssistant,
        closeAssistant,
        toggleAssistant,
      }}
    >
      {children}
      <AssistantDrawer isOpen={isAssistantOpen} onClose={closeAssistant} />
    </AssistantContext.Provider>
  )
}

export const useAssistant = (): AssistantContextType => {
  const context = useContext(AssistantContext)
  return context || defaultContext
}
