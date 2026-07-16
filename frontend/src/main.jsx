import React from 'react'
import ReactDOM from 'react-dom/client'
// HashRouter: GitHub Pages sirve archivos estáticos y no resuelve rutas del
// lado del servidor, por lo que la navegación se maneja después del '#'.
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <DataProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </DataProvider>
    </HashRouter>
  </React.StrictMode>
)
