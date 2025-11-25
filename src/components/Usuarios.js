import React, { useState, useEffect } from 'react';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    carnet: '',
    usuario: ''
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

  // Función para generar usuario automáticamente
  const generarUsuario = (nombre, carnet) => {
    const palabras = nombre.split(' ').filter(p => p.length > 0);
    const iniciales = palabras.slice(0, 3).map(p => p[0] || '').join('').toUpperCase();
    const digitos = carnet.replace(/\D/g, '').slice(-3);
    
    return iniciales && digitos ? iniciales + digitos : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Regenerar usuario con los nuevos datos
      const usuarioActualizado = generarUsuario(formData.nombre, formData.carnet);
      
      const response = await fetch('/.netlify/functions/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingUser._id,
          nombre: formData.nombre,
          carnet: formData.carnet,
          usuario: usuarioActualizado,
          usuario_original: editingUser.usuario // Para buscar y actualizar en otras colecciones
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nombre: '', carnet: '', usuario: '' });
        cargarUsuarios(); // Recargar la lista
      } else {
        alert('Error: ' + (result.error || 'No se pudo actualizar el usuario'));
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert('Error de conexión: ' + error.message);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      nombre: usuario.nombre_completo || '',
      carnet: usuario.carnet_identidad || '',
      usuario: usuario.usuario || ''
    });
    setShowModal(true);
  };

  // Actualizar usuario automáticamente cuando cambie nombre o carnet
  const handleInputChange = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    
    setFormData(newFormData);
    
    // Regenerar usuario si cambia nombre o carnet
    if (field === 'nombre' || field === 'carnet') {
      const nuevoUsuario = generarUsuario(
        field === 'nombre' ? value : newFormData.nombre,
        field === 'carnet' ? value : newFormData.carnet
      );
      
      setFormData(prev => ({
        ...prev,
        usuario: nuevoUsuario
      }));
    }
  };

  const handleDelete = async (usuario) => {
    if (window.confirm(
      `¿Estás seguro de eliminar completamente al usuario ${usuario.usuario}?\n\n` +
      `Se eliminará:\n` +
      `• De la base de datos MongoDB\n` +
      `• Su foto de rostro del sistema local\n` +
      `• Su archivo de usuario (.txt)\n` +
      `• Su encoding facial\n` +
      `• Todos sus eventos de acceso\n\n` +
      `Esta acción NO se puede deshacer.`
    )) {
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
          alert(`✅ Usuario ${usuario.usuario} eliminado completamente\n\n` +
                `Operaciones realizadas:\n` +
                result.eliminaciones.map(e => `• ${e}`).join('\n'));
          cargarUsuarios();
        } else {
          alert('❌ Error: ' + (result.error || 'No se pudo eliminar el usuario'));
        }
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('❌ Error de conexión: ' + error.message);
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
      {showModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Usuario: {editingUser.usuario}</h2>
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
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                  placeholder="Ej: Juan Carlos Perez Lopez"
                />
                <small>El usuario se regenerará automáticamente</small>
              </div>
              
              <div className="form-group">
                <label>Carnet de Identidad</label>
                <input
                  type="text"
                  value={formData.carnet}
                  onChange={(e) => handleInputChange('carnet', e.target.value)}
                  required
                  placeholder="Ej: 1234567LP"
                />
                <small>Los últimos 3 dígitos se usarán para el usuario</small>
              </div>
              
              <div className="form-group">
                <label>Nuevo Usuario (Generado automáticamente)</label>
                <input
                  type="text"
                  value={formData.usuario}
                  readOnly
                  className="readonly-input generated-user"
                />
                <small>Se genera con iniciales del nombre + últimos 3 dígitos del carnet</small>
              </div>

              <div className="form-group">
                <label>RFID (No editable)</label>
                <input
                  type="text"
                  value={editingUser.rfid_code || 'No asignado'}
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