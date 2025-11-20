import React, { useState, useEffect } from 'react';

const Estadisticas = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 10000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('/.netlify/functions/estadisticas');
      const data = await response.json();
      
      if (data.success) {
        setEstadisticas(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  const porcentajeExitos = estadisticas.totalEventos > 0 
    ? ((estadisticas.accesosExitosos / estadisticas.totalEventos) * 100).toFixed(1)
    : 0;

  return (
    <div className="estadisticas-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-chart-bar"></i>
          Estadísticas del Sistema
        </h1>
        <button onClick={cargarEstadisticas} className="refresh-btn">
          <i className="fas fa-sync-alt"></i>
          Actualizar
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card-large">
          <h3>Resumen General</h3>
          <div className="stat-large-value">{estadisticas.totalEventos.toLocaleString()}</div>
          <p>Total de Eventos Registrados</p>
        </div>

        <div className="stat-card-large success">
          <h3>Accesos Exitosos</h3>
          <div className="stat-large-value">{estadisticas.accesosExitosos.toLocaleString()}</div>
          <p>{porcentajeExitos}% del total</p>
        </div>

        <div className="stat-card-large danger">
          <h3>Accesos Fallidos</h3>
          <div className="stat-large-value">{estadisticas.accesosFallidos.toLocaleString()}</div>
          <p>{(100 - porcentajeExitos).toFixed(1)}% del total</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Usuarios Registrados</h3>
          <div className="chart-value">{estadisticas.totalUsuarios.toLocaleString()}</div>
          <div className="chart-label">Usuarios activos en el sistema</div>
        </div>

        <div className="chart-card">
          <h3>Actividad Hoy</h3>
          <div className="chart-value">{estadisticas.eventosHoy.toLocaleString()}</div>
          <div className="chart-label">Eventos registrados hoy</div>
        </div>
      </div>

      {estadisticas.tendencia7Dias && estadisticas.tendencia7Dias.length > 0 && (
        <div className="tendencia-section">
          <h3>Tendencia últimos 7 días</h3>
          <div className="tendencia-grid">
            {estadisticas.tendencia7Dias.map(dia => (
              <div key={dia._id} className="tendencia-item">
                <div className="tendencia-fecha">{dia._id}</div>
                <div className="tendencia-total">{dia.accesos} eventos</div>
                <div className="tendencia-exitosos">{dia.exitosos} exitosos</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Estadisticas;