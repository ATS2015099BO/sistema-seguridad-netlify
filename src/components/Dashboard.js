import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [eventosRecientes, setEventosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboard();
    const interval = setInterval(cargarDashboard, 5000); // Actualizar cada 5s
    return () => clearInterval(interval);
  }, []);

  const cargarDashboard = async () => {
    try {
      const [statsRes, eventosRes] = await Promise.all([
        fetch('/.netlify/functions/estadisticas'),
        fetch('/.netlify/functions/eventos?limit=8')
      ]);

      const statsData = await statsRes.json();
      const eventosData = await eventosRes.json();

      if (statsData.success) setEstadisticas(statsData.data);
      if (eventosData.success) setEventosRecientes(eventosData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Conectando con el sistema...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <StatCard 
          title="Accesos Exitosos"
          value={estadisticas?.accesosExitosos || 0}
          icon="check-circle"
          color="success"
        />
        <StatCard 
          title="Accesos Fallidos"
          value={estadisticas?.accesosFallidos || 0}
          icon="times-circle"
          color="danger"
        />
        <StatCard 
          title="Usuarios Registrados"
          value={estadisticas?.totalUsuarios || 0}
          icon="users"
          color="info"
        />
        <StatCard 
          title="Eventos Hoy"
          value={estadisticas?.eventosHoy || 0}
          icon="history"
          color="warning"
        />
      </div>

      {/* Eventos Recientes */}
      <div className="recent-section">
        <div className="section-header">
          <h2>
            <i className="fas fa-clock"></i>
            Eventos Recientes
          </h2>
          <button onClick={cargarDashboard} className="refresh-btn">
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>

        <div className="events-grid">
          {eventosRecientes.map(evento => (
            <EventCard key={evento._id} evento={evento} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente para tarjetas de estadísticas
const StatCard = ({ title, value, icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-content">
      <div className="stat-info">
        <h3>{title}</h3>
        <div className="stat-value">{value.toLocaleString()}</div>
      </div>
      <div className="stat-icon">
        <i className={`fas fa-${icon}`}></i>
      </div>
    </div>
  </div>
);

// Componente para eventos
const EventCard = ({ evento }) => {
  const fecha = new Date(evento.fecha_hora);
  const acceso = evento.acceso_concedido;
  
  return (
    <div className={`event-card ${acceso ? 'success' : 'danger'}`}>
      <div className="event-header">
        <div className="event-user">
          <strong>{evento.usuario || 'Usuario'}</strong>
        </div>
        <div className={`event-status ${acceso ? 'success' : 'danger'}`}>
          {acceso ? '✅ CONCEDIDO' : '❌ DENEGADO'}
        </div>
      </div>
      
      <div className="event-time">
        <i className="fas fa-clock"></i>
        {fecha.toLocaleString()}
      </div>
      
      {evento.motivo && (
        <div className="event-motive">
          {evento.motivo}
        </div>
      )}
      
      {evento.rfid_code && (
        <div className="event-rfid">
          <i className="fas fa-id-card"></i>
          RFID: {evento.rfid_code}
        </div>
      )}
    </div>
  );
};

export default Dashboard;