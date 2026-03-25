import { createContext, useContext } from 'react'

const DemoContext = createContext({ isDemoMode: false })
export const useDemoContext = () => useContext(DemoContext)
