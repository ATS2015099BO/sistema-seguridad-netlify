import React, { useState } from 'react';
import Dashboard from './components/Dashboard.js';
import Eventos from './components/Eventos.js';
import Estadisticas from './components/Estadisticas.js';
import './App.css';

function App() {
  const [vistaActiva, setVistaActiva] = useState('dashboard');

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <i className="fas fa-shield-alt"></i>
            Sistema de Seguridad
          </h1>
          <p className="subtitle">Monitor en tiempo real - RFID + Reconocimiento Facial</p>
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
            className={vistaActiva === 'estadisticas' ? 'active' : ''}
            onClick={() => setVistaActiva('estadisticas')}
          >
            <i className="fas fa-chart-bar"></i>
            Estadísticas
          </button>
        </nav>
      </header>

      <main className="app-main">
        {vistaActiva === 'dashboard' && <Dashboard />}
        {vistaActiva === 'eventos' && <Eventos />}
        {vistaActiva === 'estadisticas' && <Estadisticas />}
      </main>

      <footer className="app-footer">
        <p>
          <i className="fas fa-database"></i>
          Conectado a MongoDB Atlas • 
          <i className="fas fa-bolt"></i>
          Actualización en tiempo real
        </p>
      </footer>
    </div>
  );
}

export default App;