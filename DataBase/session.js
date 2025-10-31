const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function get_session(id) {
  try {
    const response = await axios.get('https://ovl-lite-free.koyeb.app/sessions');
    const sessions = response.data;

    if (!sessions[id]) {
      throw new Error(`❌ Session ${id} introuvable`);
    }

    const session = sessions[id];

    return {
      creds: JSON.parse(session.content),
      keys: JSON.parse(session.keys),
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la session :', error.message);
    return null;
  }
}

async function get_all_id() {
  try {
    const response = await axios.get('https://ovl-lite-free.koyeb.app/sessions');
    const sessions = response.data;

    return Object.keys(sessions || {});
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des IDs :', error.message);
    return [];
  }
}

async function del_id(id) {
  if (!id) throw new Error('❌ ID requis pour la suppression');

  try {
    const response = await axios.get(`https://ovl-lite-free.koyeb.app/dlt?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l’ID :', error.message);
    return null;
  }
}

async function restaureAuth(instanceId, creds, keys) {
  const authDir = path.join(__dirname, '../auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const sessionDir = path.join(authDir, instanceId);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  fs.writeFileSync(path.join(sessionDir, 'creds.json'), JSON.stringify(creds));

  if (keys && Object.keys(keys).length > 0) {
    for (const keyFile in keys) {
      fs.writeFileSync(
        path.join(sessionDir, `${keyFile}.json`),
        JSON.stringify(keys[keyFile])
      );
    }
  }
}

module.exports = {
  get_session,
  restaureAuth,
  get_all_id,
  del_id
};
