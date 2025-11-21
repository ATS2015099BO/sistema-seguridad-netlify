import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Eventos from './components/Eventos';
import Usuarios from './components/Usuarios';
import Login from './components/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si ya está autenticado al cargar la aplicación
    const checkAuth = () => {
      const auth = localStorage.getItem('isAuthenticated');
      const loginTime = localStorage.getItem('loginTime');
      
      if (auth === 'true' && loginTime) {
        // Verificar si la sesión tiene menos de 8 horas
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 8) {
          setIsAuthenticated(true);
        } else {
          // Sesión expirada
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('loginTime');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (success) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    setIsAuthenticated(false);
    setVistaActiva('dashboard');
  };

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner"></div>
        <p>Cargando sistema...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-shield-alt"></i>
            Sistema de Seguridad - Admin Panel
          </h1>
          <p className="subtitle">Gestión de accesos RFID + Reconocimiento Facial</p>
        </div>
        
        <nav className="app-nav">
          <button 
            className={vistaActiva === 'dashboard' ? 'active' : ''}
            onClick={() => setVistaActiva('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i>
            Dashboard
          </button>
          <button 
            className={vistaActiva === 'eventos' ? 'active' : ''}
            onClick={() => setVistaActiva('eventos')}
          >
            <i className="fas fa-list"></i>
            Eventos
          </button>
          <button 
            className={vistaActiva === 'usuarios' ? 'active' : ''}
            onClick={() => setVistaActiva('usuarios')}
          >
            <i className="fas fa-users"></i>
            Usuarios
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <i className="fas fa-sign-out-alt"></i>
            Salir
          </button>
        </nav>
      </header>

      <main className="app-main">
        {vistaActiva === 'dashboard' && <Dashboard />}
        {vistaActiva === 'eventos' && <Eventos />}
        {vistaActiva === 'usuarios' && <Usuarios />}
      </main>
    </div>
  );
}

export default App;