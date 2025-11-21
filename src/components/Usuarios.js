import React, { useState, useEffect } from 'react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    carnet: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await fetch('/.netlify/functions/usuarios');
      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/.netlify/functions/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingUser._id,
          nombre: formData.nombre,
          carnet: formData.carnet,
          usuario: editingUser.usuario // Mantener el mismo usuario
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', carnet: '' });
        cargarUsuarios(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre_completo || '',
      carnet: usuario.carnet_identidad || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (usuario) => {
    if (window.confirm(`¿Estás seguro de eliminar al usuario ${usuario.usuario}? Se borrarán TODOS sus datos incluyendo rostro, RFID y eventos.`)) {
      try {
        const response = await fetch('/.netlify/functions/usuarios', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: usuario._id,
            usuario: usuario.usuario 
          })
        });

        const result = await response.json();
        if (result.success) {
          cargarUsuarios();
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-users"></i>
          Gestión de Usuarios Registrados
        </h1>
        <div className="header-info">
          <span className="info-badge">
            <i className="fas fa-info-circle"></i>
            Los usuarios se registran desde el sistema físico
          </span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Carnet</th>
              <th>RFID</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario._id}>
                <td>
                  <strong>{usuario.usuario}</strong>
                </td>
                <td>{usuario.nombre_completo}</td>
                <td>{usuario.carnet_identidad}</td>
                <td>
                  <code className="rfid-code">{usuario.rfid_code || 'No asignado'}</code>
                </td>
                <td>
                  {new Date(usuario.fecha_registro).toLocaleDateString()}
                </td>
                <td>
                  <span className={`status-badge ${usuario.activo ? 'active' : 'inactive'}`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(usuario)}
                      title="Editar nombre y carnet"
                    >
                      <i className="fas fa-edit"></i>
                      Editar
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(usuario)}
                      title="Eliminar usuario completamente"
                    >
                      <i className="fas fa-trash"></i>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {usuarios.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-users-slash"></i>
            <h3>No hay usuarios registrados en el sistema</h3>
            <p>Los usuarios aparecerán aquí después de registrarse en el sistema físico.</p>
          </div>
        )}
      </div>

      {/* Modal para editar usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Usuario: {editingUser?.usuario}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Usuario (No editable)</label>
                <input
                  type="text"
                  value={editingUser?.usuario || ''}
                  readOnly
                  className="readonly-input"
                />
                <small>El usuario no se puede modificar</small>
              </div>
              
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                  placeholder="Ej: Juan Carlos Perez Lopez"
                />
              </div>
              
              <div className="form-group">
                <label>Carnet de Identidad</label>
                <input
                  type="text"
                  value={formData.carnet}
                  onChange={(e) => setFormData(prev => ({ ...prev, carnet: e.target.value }))}
                  required
                  placeholder="Ej: 1234567LP"
                />
              </div>

              <div className="form-group">
                <label>RFID (No editable)</label>
                <input
                  type="text"
                  value={editingUser?.rfid_code || 'No asignado'}
                  readOnly
                  className="readonly-input"
                />
                <small>El RFID se asigna al registrar la tarjeta física</small>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  <i className="fas fa-save"></i>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;