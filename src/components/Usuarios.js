import React, { useState, useEffect } from 'react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    carnet: '',
    usuario: '',
    rfid_code: ''
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      // Esta función la crearemos después en Netlify Functions
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
      const url = '/.netlify/functions/usuarios';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...formData, id: editingUser._id } : formData)
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', carnet: '', usuario: '', rfid_code: '' });
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre_completo || '',
      carnet: usuario.carnet_identidad || '',
      usuario: usuario.usuario || '',
      rfid_code: usuario.rfid_code || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (usuarioId) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario? Se borrarán TODOS sus datos incluyendo rostro y eventos.')) {
      try {
        const response = await fetch('/.netlify/functions/usuarios', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: usuarioId })
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

  const generarUsuario = () => {
    const nombre = formData.nombre || '';
    const carnet = formData.carnet || '';
    
    const iniciales = nombre.split(' ').slice(0, 3).map(p => p[0] || '').join('').toUpperCase();
    const digitos = carnet.replace(/\D/g, '').slice(-3);
    
    if (iniciales && digitos) {
      setFormData(prev => ({ ...prev, usuario: iniciales + digitos }));
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
          Gestión de Usuarios
        </h1>
        <button 
          className="btn-primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({ nombre: '', carnet: '', usuario: '', rfid_code: '' });
            setShowModal(true);
          }}
        >
          <i className="fas fa-plus"></i>
          Nuevo Usuario
        </button>
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
                  <code className="rfid-code">{usuario.rfid_code}</code>
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
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(usuario._id)}
                      title="Eliminar usuario completamente"
                    >
                      <i className="fas fa-trash"></i>
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
            <h3>No hay usuarios registrados</h3>
            <p>Comienza agregando el primer usuario al sistema.</p>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar usuario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre Completo (3 palabras mínimo)</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nombre: e.target.value }));
                    if (!editingUser) generarUsuario();
                  }}
                  required
                  placeholder="Ej: Juan Carlos Perez Lopez"
                />
              </div>
              
              <div className="form-group">
                <label>Carnet de Identidad</label>
                <input
                  type="text"
                  value={formData.carnet}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, carnet: e.target.value }));
                    if (!editingUser) generarUsuario();
                  }}
                  required
                  placeholder="Ej: 1234567LP"
                />
              </div>
              
              <div className="form-group">
                <label>Usuario (Generado automáticamente)</label>
                <input
                  type="text"
                  value={formData.usuario}
                  readOnly
                  className="readonly-input"
                />
                <small>Se genera automáticamente con iniciales y últimos dígitos del carnet</small>
              </div>
              
              {!editingUser && (
                <div className="form-group">
                  <label>Código RFID</label>
                  <input
                    type="text"
                    value={formData.rfid_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, rfid_code: e.target.value }))}
                    placeholder="Se asignará al registrar tarjeta"
                  />
                  <small>Este campo se completará automáticamente al registrar la tarjeta física</small>
                </div>
              )}

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
                  {editingUser ? 'Actualizar' : 'Crear'} Usuario
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