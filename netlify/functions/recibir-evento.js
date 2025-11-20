const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://sergioaapazati:SergioAapaza25121998@cluster0.qiqttvg.mongodb.net/?appName=Cluster0";
const client = new MongoClient(MONGODB_URI);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    await client.connect();
    const db = client.db('sistema_seguridad');

    // Insertar evento
    const evento = {
      usuario: data.usuario,
      fecha_hora: new Date(),
      acceso_concedido: data.acceso_concedido,
      motivo: data.motivo,
      rfid_code: data.rfid_code,
      dispositivo: 'ESP32_RFID_Facial',
      timestamp: Date.now()
    };

    const resultado = await db.collection('eventos_acceso').insertOne(evento);

    // Actualizar estadísticas
    await db.collection('estadisticas').updateOne(
      { _id: 'global' },
      {
        $inc: {
          total_accesos: 1,
          accesos_exitosos: data.acceso_concedido ? 1 : 0,
          accesos_fallidos: data.acceso_concedido ? 0 : 1
        },
        $set: {
          ultimo_acceso: new Date(),
          actualizado_el: new Date()
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Evento recibido y guardado',
        id: resultado.insertedId
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