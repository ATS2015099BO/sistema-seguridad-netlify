const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    await client.connect();
    const db = client.db('sistema_seguridad');

    // Estadísticas en una sola consulta
    const [estadisticas, totalUsuarios, eventosHoy, tendencia7Dias] = await Promise.all([
      // Estadísticas globales
      db.collection('estadisticas').findOne({ _id: 'global' }),
      
      // Total usuarios activos
      db.collection('usuarios').countDocuments({ activo: true }),
      
      // Eventos de hoy
      (async () => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return db.collection('eventos_acceso').countDocuments({ 
          fecha_hora: { $gte: hoy } 
        });
      })(),
      
      // Tendencia últimos 7 días
      db.collection('eventos_acceso').aggregate([
        {
          $match: {
            fecha_hora: { 
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$fecha_hora" 
              }
            },
            accesos: { $sum: 1 },
            exitosos: {
              $sum: { $cond: ["$acceso_concedido", 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray()
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          totalEventos: estadisticas?.total_accesos || 0,
          totalUsuarios,
          accesosExitosos: estadisticas?.accesos_exitosos || 0,
          accesosFallidos: estadisticas?.accesos_fallidos || 0,
          eventosHoy,
          tendencia7Dias
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      })
    };
  }
};