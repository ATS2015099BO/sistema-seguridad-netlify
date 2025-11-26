import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [eventosRecientes, setEventosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releEstado, setReleEstado] = useState('desconocido');
  const [controlandoRele, setControlandoRele] = useState(false);
  
  // NUEVOS ESTADOS PARA ACCESO REMOTO
  const [nombreAcceso, setNombreAcceso] = useState('');
  const [carnetAcceso, setCarnetAcceso] = useState('');

  useEffect(() => {
    cargarDashboard();
    const interval = setInterval(cargarDashboard, 5000);
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

  // Función para controlar el acceso remoto
  const controlarAccesoRemoto = async () => {
    if (!nombreAcceso.trim() || !carnetAcceso.trim()) {
      alert('Por favor ingrese nombre y carnet');
      return;
    }

    setControlandoRele(true);
    try {
      const response = await fetch('/.netlify/functions/acceso-remoto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comando: 'ACCESS_GRANTED',
          nombre: nombreAcceso,
          carnet: carnetAcceso
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setReleEstado('activado');
        
        // Limpiar campos
        setNombreAcceso('');
        setCarnetAcceso('');
        
        // Mostrar confirmación
        alert(`✅ Acceso remoto concedido para ${result.nombre}`);
        
        // Desactivar después de 3 segundos
        setTimeout(() => {
          setReleEstado('desactivado');
        }, 3000);
        
        // Recargar dashboard para mostrar el nuevo evento
        cargarDashboard();
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error controlando acceso remoto:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setControlandoRele(false);
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
      {/* Sección de Control de Acceso Remoto */}
      <div className="control-section">
        <div className="control-card">
          <div className="control-header">
            <h2>
              <i className="fas fa-door-open"></i>
              Control de Acceso Remoto
            </h2>
            <div className={`rele-status ${releEstado}`}>
              <i className={`fas ${releEstado === 'activado' ? 'fa-unlock' : 'fa-lock'}`}></i>
              Estado: {releEstado.charAt(0).toUpperCase() + releEstado.slice(1)}
            </div>
          </div>
          
          <div className="access-control">
            <div className="access-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ingrese su nombre"
                  value={nombreAcceso}
                  onChange={(e) => setNombreAcceso(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Carnet de Identidad</label>
                <input
                  type="text"
                  placeholder="Ingrese su carnet"
                  value={carnetAcceso}
                  onChange={(e) => setCarnetAcceso(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              className="btn-control success"
              onClick={controlarAccesoRemoto}
              disabled={controlandoRele || !nombreAcceso.trim() || !carnetAcceso.trim()}
            >
              {controlandoRele ? (
                <div className="spinner-small"></div>
              ) : (
                <i className="fas fa-key"></i>
              )}
              Conceder Acceso Remoto
              <small>Abrir puerta/activar acceso</small>
            </button>
          </div>
          
          <div className="control-info">
            <p>
              <i className="fas fa-info-circle"></i>
              El acceso remoto registra el evento con los datos ingresados.
            </p>
          </div>
        </div>
      </div>

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

// Componente para eventos - MEJORADO para mostrar diferentes tipos
const EventCard = ({ evento }) => {
  const fecha = new Date(evento.fecha_hora);
  
  // Determinar clase y icono basado en el tipo de evento
  let claseEvento = '';
  let icono = '';
  let estado = '';
  
  if (evento.tipo_evento === 'registro') {
    claseEvento = evento.exito ? 'success' : 'danger';
    icono = evento.exito ? '📝' : '❌';
    estado = evento.exito ? 'REGISTRO EXITOSO' : 'REGISTRO FALLIDO';
  } else if (evento.tipo_evento === 'acceso') {
    claseEvento = evento.exito ? 'success' : 'danger';
    icono = evento.exito ? '✅' : '🚫';
    estado = evento.exito ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO';
  } else {
    claseEvento = 'warning';
    icono = '⚠️';
    estado = evento.tipo_evento || 'EVENTO';
  }
  
  return (
    <div className={`event-card ${claseEvento}`}>
      <div className="event-header">
        <div className="event-user">
          <strong>{evento.usuario || 'Usuario'}</strong>
        </div>
        <div className={`event-status ${claseEvento}`}>
          {icono} {estado}
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
      
      {evento.rfid_code && evento.rfid_code !== 'ACCESO_REMOTO' && (
        <div className="event-rfid">
          <i className="fas fa-id-card"></i>
          RFID: {evento.rfid_code}
        </div>
      )}
      
      {evento.rfid_code === 'ACCESO_REMOTO' && (
        <div className="event-remoto">
          <i className="fas fa-desktop"></i>
          Acceso Remoto
        </div>
      )}
    </div>
  );
};

export default Dashboard;