const mqtt = require('mqtt');

// Configuración MQTT (usando el mismo broker que tu sistema Python)
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const MQTT_TOPIC = 'sistema_seguridad/control';

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
    const { comando } = data;

    console.log(`🔧 Enviando comando al ESP32: ${comando}`);

    // Conectar a MQTT y enviar comando
    const resultado = await enviarComandoMQTT(comando);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Comando ${comando} enviado al ESP32`,
        resultado: resultado
      })
    };

  } catch (error) {
    console.error('💥 Error controlando relé:', error);
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

// Función para enviar comando via MQTT
function enviarComandoMQTT(comando) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);

    const timeout = setTimeout(() => {
      client.end();
      reject(new Error('Timeout de conexión MQTT'));
    }, 5000);

    client.on('connect', () => {
      console.log(`✅ Conectado a MQTT, enviando: ${comando}`);
      client.publish(MQTT_TOPIC, comando, { qos: 1 }, (err) => {
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