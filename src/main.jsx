import React from 'react'
import { createRoot } from 'react-dom/client'
import { initMonitoring } from './monitoring'
import App from './App'
import './styles.css'
initMonitoring()
createRoot(document.getElementById('root')).render(<App />)
