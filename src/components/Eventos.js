import React, { useState, useEffect } from 'react';

const Eventos = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const response = await fetch('/.netlify/functions/eventos?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setEventos(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setLoading(false);
    }
  };

  const eventosFiltrados = eventos.filter(evento => {
    const coincideBusqueda = evento.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
                           evento.rfid_code?.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideFiltro = filtro === 'todos' || 
                        (filtro === 'exitosos' && evento.exito) ||
                        (filtro === 'fallidos' && !evento.exito);
  
  return coincideBusqueda && coincideFiltro;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div className="eventos-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-list"></i>
          Historial de Eventos
        </h1>
        <div className="header-actions">
          <button onClick={cargarEventos} className="btn-secondary">
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar por usuario o RFID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={filtro === 'todos' ? 'active' : ''}
            onClick={() => setFiltro('todos')}
          >
            Todos ({eventos.length})
          </button>
          <button 
            className={filtro === 'exitosos' ? 'active' : ''}
            onClick={() => setFiltro('exitosos')}
          >
            Exitosos ({eventos.filter(e => e.acceso_concedido).length})
          </button>
          <button 
            className={filtro === 'fallidos' ? 'active' : ''}
            onClick={() => setFiltro('fallidos')}
          >
            Fallidos ({eventos.filter(e => !e.acceso_concedido).length})
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Usuario</th>
              <th>RFID</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {eventosFiltrados.map(evento => (
              <tr key={evento._id} className={evento.acceso_concedido ? 'row-success' : 'row-danger'}>
                <td>
                  <div className="datetime-cell">
                    <div className="date">{new Date(evento.fecha_hora).toLocaleDateString()}</div>
                    <div className="time">{new Date(evento.fecha_hora).toLocaleTimeString()}</div>
                  </div>
                </td>
                <td>
                  <strong>{evento.usuario || 'N/A'}</strong>
                </td>
                <td>
                  <code className="rfid-code">{evento.rfid_code || 'N/A'}</code>
                </td>
                <td>
                  <span className={`status-badge ${evento.acceso_concedido ? 'success' : 'danger'}`}>
                    {evento.acceso_concedido ? (
                      <>✅ Concedido</>
                    ) : (
                      <>❌ Denegado</>
                    )}
                  </span>
                </td>
                <td className="motivo-cell">
                  {evento.motivo || '—'}
                </td>
                <td>
                  <span className="device-badge">
                    {evento.dispositivo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {eventosFiltrados.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No se encontraron eventos</h3>
            <p>No hay eventos que coincidan con los filtros aplicados.</p>
          </div>
        )}
      </div>

      <div className="table-footer">
        <div className="table-info">
          Mostrando {eventosFiltrados.length} de {eventos.length} eventos totales
        </div>
      </div>
    </div>
  );
};

export default Eventos;