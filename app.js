const express = require('express');
const sql = require('mssql');
const os = require('os');
const axios = require('axios');
const app = express();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: { encrypt: true }
};

// Obtener IP del nodo usando el Azure Instance Metadata Service
async function getNodeIP() {
  try {
    const response = await axios.get(
      'http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/privateIpAddress?api-version=2021-02-01',
      { headers: { Metadata: 'true' } }
    );
    return response.data;
  } catch (err) {
    return 'No se pudo obtener IP del nodo';
  }
}

// Obtener IP del pod local
function getPodIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'No se pudo obtener IP del pod';
}

app.get('/', async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT GETDATE() AS CurrentTime`;
    const nodeIP = await getNodeIP();
    const podIP = getPodIP();

    res.send(`
      ✅ Connected to SQL!<br>
      🕓 Current time: ${result.recordset[0].CurrentTime}<br>
      🐳 Pod IP: ${podIP}<br>
      🖥️ Node IP: ${nodeIP}<br>
      🔧 Hostname: ${os.hostname()}
    `);
  } catch (err) {
    res.status(500).send('DB Error: ' + err.message);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));