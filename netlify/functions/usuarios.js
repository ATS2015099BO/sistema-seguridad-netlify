const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = "mongodb+srv://sergioaapazati:SergioAapaza25121998@cluster0.qiqttvg.mongodb.net/?appName=Cluster0";
const client = new MongoClient(MONGODB_URI);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    await client.connect();
    const db = client.db('sistema_seguridad');
    
    console.log('🔍 INICIANDO BÚSQUEDA DE USUARIOS...');
    
    // DEBUG: Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📂 Colecciones disponibles:', collectionNames);

    // GET - Obtener todos los usuarios
    if (event.httpMethod === 'GET') {
      let usuarios = [];
      let coleccionUsada = '';
      
      console.log('🔍 BUSCANDO USUARIOS REALES EN MONGODB...');
      
      // Intentar diferentes nombres de colección para usuarios REALES
      const posiblesColecciones = ['usuarios', 'users', 'Usuarios', 'user'];
      
      for (const coleccionNombre of posiblesColecciones) {
        try {
          const collection = db.collection(coleccionNombre);
          const count = await collection.countDocuments();
          console.log(`🔎 Revisando colección "${coleccionNombre}": ${count} documentos`);
          
          if (count > 0) {
            usuarios = await collection.find({}).toArray();
            coleccionUsada = coleccionNombre;
            console.log(`✅ Usuarios REALES encontrados en "${coleccionNombre}":`, usuarios.length);
            break;
          }
        } catch (e) {
          console.log(`❌ Colección "${coleccionNombre}" no existe o error:`, e.message);
        }
      }
      
      // ✅ CORREGIDO: NO crear usuarios ficticios si no hay usuarios reales
      if (usuarios.length === 0) {
        console.log('ℹ️ No se encontraron usuarios registrados en MongoDB');
        console.log('💡 Los usuarios aparecerán aquí después de registrarse en el sistema físico');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: [], // ✅ DEVOLVER ARRAY VACÍO - NO USUARIOS FICTICIOS
            debug: {
              coleccionUsada: 'ninguna - sin usuarios registrados',
              totalUsuariosEncontrados: 0,
              mensaje: 'No hay usuarios registrados en el sistema. Regístrelos desde el sistema físico.'
            }
          })
        };
      }
      
      // Mapear campos a estructura esperada por el frontend (SOLO para usuarios reales)
      const usuariosMapeados = usuarios.map(user => {
        return {
          _id: user._id || user.id,
          usuario: user.usuario || user.username || 'Usuario Desconocido',
          nombre_completo: user.nombre_completo || user.nombre || 'Nombre No Registrado',
          carnet_identidad: user.carnet_identidad || user.carnet || 'No registrado',
          rfid_code: user.rfid_code || user.rfid || 'No asignado',
          fecha_registro: user.fecha_registro || user.createdAt || new Date(),
          activo: user.activo !== undefined ? user.activo : true
        };
      });
      
      console.log(`🎯 RESULTADO FINAL: ${usuariosMapeados.length} usuarios REALES`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: usuariosMapeados,
          debug: {
            coleccionUsada: coleccionUsada,
            totalUsuariosReales: usuariosMapeados.length
          }
        })
      };
    }

    // PUT - Actualizar nombre, carnet Y usuario
    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      console.log('✏️ SOLICITANDO ACTUALIZACIÓN DE USUARIO:', data);
      
      // Buscar en qué colección están los usuarios
      let coleccionEncontrada = null;
      const posiblesColecciones = ['usuarios', 'users', 'Usuarios'];
      
      for (const coleccionNombre of posiblesColecciones) {
        try {
          const collection = db.collection(coleccionNombre);
          const count = await collection.countDocuments();
          if (count > 0) {
            coleccionEncontrada = collection;
            console.log(`✅ Usando colección "${coleccionNombre}" para actualizar`);
            break;
          }
        } catch (e) {
          console.log(`❌ Colección "${coleccionNombre}" no disponible`);
        }
      }
      
      if (!coleccionEncontrada) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'No se encontró la colección de usuarios'
          })
        };
      }

      // 1. Actualizar el usuario en la colección principal
      const resultado = await coleccionEncontrada.updateOne(
        { _id: new ObjectId(data.id) },
        { 
          $set: { 
            nombre_completo: data.nombre,
            carnet_identidad: data.carnet,
            usuario: data.usuario, // ¡NUEVO: Actualizar el usuario también!
            ultima_actualizacion: new Date()
          } 
        }
      );

      console.log('✅ Resultado de actualización en usuarios:', resultado);

      // 2. Actualizar el usuario en eventos (si cambió)
      if (data.usuario_original && data.usuario_original !== data.usuario) {
        try {
          const eventosCollection = db.collection('eventos_acceso');
          const resultadoEventos = await eventosCollection.updateMany(
            { usuario: data.usuario_original },
            { $set: { usuario: data.usuario } }
          );
          console.log(`✅ Eventos actualizados: ${resultadoEventos.modifiedCount}`);
        } catch (e) {
          console.log('❌ Error actualizando eventos:', e.message);
        }
      }

      // 3. Actualizar el usuario en encodings faciales (si cambió)
      if (data.usuario_original && data.usuario_original !== data.usuario) {
        try {
          const encodingsCollection = db.collection('encodings_faciales');
          const resultadoEncodings = await encodingsCollection.updateOne(
            { usuario: data.usuario_original },
            { $set: { usuario: data.usuario } }
          );
          console.log(`✅ Encoding facial actualizado: ${resultadoEncodings.modifiedCount}`);
        } catch (e) {
          console.log('❌ Error actualizando encoding facial:', e.message);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Usuario actualizado correctamente en todas las colecciones',
          resultado: resultado
        })
      };
    }

    // DELETE - Eliminar usuario y todos sus datos
    if (event.httpMethod === 'DELETE') {
      const data = JSON.parse(event.body);
      console.log('🗑️ SOLICITANDO ELIMINACIÓN DE USUARIO:', data);
      
      let eliminaciones = [];
      
      // 1. Eliminar de MongoDB primero
      const posiblesColeccionesUsuarios = ['usuarios', 'users', 'Usuarios'];
      
      for (const coleccionNombre of posiblesColeccionesUsuarios) {
        try {
          const collection = db.collection(coleccionNombre);
          const resultado = await collection.deleteOne({ _id: new ObjectId(data.id) });
          if (resultado.deletedCount > 0) {
            eliminaciones.push(`Usuario eliminado de ${coleccionNombre}`);
          }
        } catch (e) {
          console.log(`No se pudo eliminar de ${coleccionNombre}:`, e.message);
        }
      }
      
      // 2. Eliminar eventos relacionados
      try {
        const eventosCollection = db.collection('eventos_acceso');
        const resultadoEventos = await eventosCollection.deleteMany({ usuario: data.usuario });
        eliminaciones.push(`Eventos eliminados: ${resultadoEventos.deletedCount}`);
      } catch (e) {
        console.log('Error eliminando eventos:', e.message);
      }

      // 3. Eliminar encoding facial si existe
      try {
        const encodingsCollection = db.collection('encodings_faciales');
        const resultadoEncodings = await encodingsCollection.deleteOne({ usuario: data.usuario });
        eliminaciones.push(`Encoding facial eliminado: ${resultadoEncodings.deletedCount}`);
      } catch (e) {
        console.log('Error eliminando encoding facial:', e.message);
      }

      // 4. ✅ NUEVO: Eliminar archivos locales via MQTT
      try {
        const eliminarResponse = await fetch(`${process.env.URL || ''}/.netlify/functions/eliminar-archivos-usuario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username: data.usuario 
          })
        });

        const eliminarResult = await eliminarResponse.json();
        
        if (eliminarResult.success) {
          eliminaciones.push(`Archivos locales: ${eliminarResult.resultado?.archivosEliminados?.join(', ') || 'eliminados'}`);
          console.log(`✅ Archivos locales eliminados para: ${data.usuario}`);
        } else {
          eliminaciones.push(`Archivos locales: Error - ${eliminarResult.error}`);
          console.log(`❌ Error eliminando archivos locales: ${eliminarResult.error}`);
        }
      } catch (pythonError) {
        eliminaciones.push('Archivos locales: Sistema offline - no eliminados');
        console.log(`🔶 Sistema Python offline para: ${data.usuario}`);
      }

      console.log('✅ ELIMINACIONES COMPLETADAS:', eliminaciones);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Usuario y datos relacionados eliminados',
          eliminaciones: eliminaciones,
          username: data.usuario
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Método no permitido' 
      })
    };

  } catch (error) {
    console.error('💥 ERROR COMPLETO:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};