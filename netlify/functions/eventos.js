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
    
    const { limit = 50, page = 1 } = event.queryStringParameters || {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const eventos = await db.collection('eventos_acceso')
      .find()
      .sort({ fecha_hora: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('eventos_acceso').countDocuments();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: eventos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
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