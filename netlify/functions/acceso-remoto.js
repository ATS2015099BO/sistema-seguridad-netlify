const mqtt = require('mqtt');
const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://sergioaapazati:SergioAapaza25121998@cluster0.qiqttvg.mongodb.net/?appName=Cluster0";
const MQTT_BROKER = 'broker.hivemq.com';
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
    const { comando, nombre, carnet } = data;

    // 1. Enviar comando MQTT al ESP32
    const mqttResult = await enviarComandoMQTT(comando);
    
    // 2. Registrar evento en MongoDB
    await client.connect();
    const db = client.db('sistema_seguridad');
    
    const evento = {
      usuario: nombre || 'Acceso Remoto',
      fecha_hora: new Date(),
      tipo_evento: "acceso",
      tipo_descripcion: "Acceso al sistema",
      exito: true,
      motivo: `Acceso remoto concedido - Carnet: ${carnet || 'No especificado'}`,
      rfid_code: "ACCESO_REMOTO",
      dispositivo: "Web Dashboard",
      timestamp: Date.now()
    };

    await db.collection('eventos_acceso').insertOne(evento);

    // 3. Actualizar estadísticas
    await db.collection('estadisticas').updateOne(
      { _id: "global" },
      { 
        $inc: { 
          total_accesos: 1,
          accesos_exitosos: 1
        },
        $set: {
          ultimo_acceso: new Date()
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Acceso remoto concedido para ${nombre}`,
        nombre: nombre,
        carnet: carnet
      })
    };

  } catch (error) {
    console.error('Error en acceso remoto:', error);
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

function enviarComandoMQTT(comando) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(`mqtt://${MQTT_BROKER}:1883`);
    
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error('Timeout de conexión MQTT'));
    }, 5000);

    client.on('connect', () => {
      client.publish("sistema_seguridad/control", comando, { qos: 1 }, (err) => {
        clearTimeout(timeout);
        client.end();
        
        if (err) {
          reject(err);
        } else {
          resolve({ enviado: true, comando: comando });
        }
      });
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.end();
      reject(err);
    });
  });
}