import React, { useState, useEffect } from 'react';

const Eventos = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    cargarEventos();
  }, [pagination.page]);

  const cargarEventos = async () => {
    try {
      const response = await fetch(`/.netlify/functions/eventos?page=${pagination.page}&limit=${pagination.limit}`);
      const data = await response.json();
      
      if (data.success) {
        setEventos(data.data);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      setLoading(false);
    }
  };

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
        <div className="pagination-info">
          Página {pagination.page} de {pagination.pages} 
          ({pagination.total} eventos totales)
        </div>
      </div>

      <div className="eventos-list">
        {eventos.map(evento => (
          <div key={evento._id} className={`evento-item ${evento.acceso_concedido ? 'success' : 'danger'}`}>
            <div className="evento-header">
              <div className="evento-user">
                <strong>{evento.usuario || 'Usuario'}</strong>
                <span className="evento-rfid">{evento.rfid_code}</span>
              </div>
              <div className={`evento-status ${evento.acceso_concedido ? 'success' : 'danger'}`}>
                {evento.acceso_concedido ? '✅ CONCEDIDO' : '❌ DENEGADO'}
              </div>
            </div>
            
            <div className="evento-time">
              <i className="fas fa-clock"></i>
              {new Date(evento.fecha_hora).toLocaleString()}
            </div>
            
            <div className="evento-motive">
              {evento.motivo || 'Sin motivo especificado'}
            </div>
            
            <div className="evento-dispositivo">
              <i className="fas fa-microchip"></i>
              {evento.dispositivo}
            </div>
          </div>
        ))}
      </div>

      <div className="pagination-controls">
        <button 
          disabled={pagination.page <= 1}
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
        >
          <i className="fas fa-chevron-left"></i> Anterior
        </button>
        
        <span>Página {pagination.page}</span>
        
        <button 
          disabled={pagination.page >= pagination.pages}
          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
        >
          Siguiente <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Eventos;