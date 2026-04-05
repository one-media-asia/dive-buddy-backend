const { Client } = require('pg');

const connectionString = process.env.NEON_DB_URL;

if (!connectionString) {
  throw new Error('NEON_DB_URL environment variable is not set.');
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM bookings ORDER BY created_at DESC');
    await client.end();
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    if (client) await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
