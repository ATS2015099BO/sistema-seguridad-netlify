import React, { useState } from 'react';
import Dashboard from './components/Dashboard.js';
import Eventos from './components/Eventos.js';
import Usuarios from './components/Usuarios.js';
import './App.css';

function App() {
  const [vistaActiva, setVistaActiva] = useState('dashboard');

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