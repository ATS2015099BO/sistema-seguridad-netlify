const mqtt = require('mqtt');

const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const MQTT_TOPIC_COMMAND = 'sistema_seguridad/web_commands';
const MQTT_TOPIC_RESPONSE = 'sistema_seguridad/web_responses';

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
    const { username } = data;

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Se requiere el nombre de usuario' 
        })
      };
    }

    console.log(`🗑️ Solicitando eliminación de archivos para: ${username}`);

    // Enviar comando MQTT al sistema Python
    const resultado = await enviarComandoEliminacion(username);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Comando de eliminación enviado para: ${username}`,
        resultado: resultado
      })
    };

  } catch (error) {
    console.error('💥 Error eliminando archivos:', error);
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

// Función para enviar comando de eliminación via MQTT
function enviarComandoEliminacion(username) {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);
    const command = `DELETE_USER:${username}`;
    
    let responseReceived = false;
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        client.end();
        reject(new Error('Timeout: No se recibió respuesta del sistema Python'));
      }
    }, 10000); // 10 segundos timeout

    client.on('connect', () => {
      console.log(`✅ Conectado a MQTT, enviando comando: ${command}`);
      
      // Suscribirse a respuestas
      client.subscribe(MQTT_TOPIC_RESPONSE, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.end();
          reject(err);
          return;
        }
        
        // Enviar comando de eliminación
        client.publish(MQTT_TOPIC_COMMAND, command, { qos: 1 }, (err) => {
          if (err) {
            clearTimeout(timeout);
            client.end();
            reject(err);
          } else {
            console.log(`✅ Comando de eliminación enviado: ${command}`);
          }
        });
      });
    });

    // Escuchar respuestas
    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC_RESPONSE) {
        const response = message.toString();
        console.log(`📨 Respuesta recibida: ${response}`);
        
        if (response.startsWith(`DELETE_SUCCESS:${username}`)) {
          responseReceived = true;
          clearTimeout(timeout);
          client.end();
          resolve({ 
            status: 'success', 
            message: response,
            archivosEliminados: response.split(':')[2]?.split(',') || []
          });
        } 
        else if (response.startsWith(`DELETE_NO_FILES:${username}`)) {
          responseReceived = true;
          clearTimeout(timeout);
          client.end();
          resolve({ 
            status: 'no_files', 
            message: 'No se encontraron archivos para eliminar' 
          });
        }
        else if (response.startsWith(`DELETE_ERROR:${username}`)) {
          responseReceived = true;
          clearTimeout(timeout);
          client.end();
          reject(new Error(response.split(':')[2] || 'Error desconocido'));
        }
      }
    });

    client.on('error', (err) => {
      clearTimeout(timeout);
      client.end();
      reject(err);
    });
  });
}