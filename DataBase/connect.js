const { Sequelize, DataTypes } = require("sequelize");
const config = require("../set");
const get_session = require("./session");

const db = config.DATABASE;

let sequelize;

if (!db) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db',
    logging: false,
  });
} else {
  sequelize = new Sequelize(db, {
    dialect: 'postgres',
    ssl: true,
    protocol: 'postgres',
    dialectOptions: {
      native: true,
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
}

const Connect = sequelize.define("Connect", {
  numero: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: "connect",
  timestamps: false,
});

(async () => {
  await Connect.sync();
  console.log("Table 'connect' synchronisée avec succès.");
})();

async function saveSecondSession(session_id) {
  let credsRaw = await get_session(session_id);

  if (!credsRaw) {
    console.error(`❌ Session invalide pour l’ID : ${session_id}`);
    return;
  }

  let creds;

  try {
    creds = typeof credsRaw === "string" ? JSON.parse(credsRaw) : credsRaw;
  } catch (e) {
    console.error("❌ Erreur de parsing JSON :", e.message);
    return;
  }

  if (!creds?.me?.id) {
    console.error("❌ Numéro introuvable dans les creds");
    return;
  }

  const numero = creds.me.id.split(":")[0];

  try {
    await Connect.upsert({ numero, session_id });
    console.log(`✅ Session enregistrée : ${numero} ➜ ${session_id}`);
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement :", err.message);
  }
}

async function getSecondSession(numero) {
  const session = await Connect.findByPk(numero);
  if (!session) return null;

  const creds = await get_session(session.session_id);
  return creds || null;
}

async function getSecondAllSessions() {
  const sessions = await Connect.findAll({ attributes: ['numero', 'session_id'] });
  return sessions.map(s => ({ numero: s.numero, session_id: s.session_id }));
}

async function deleteSecondSession(session_id) {
  return await Connect.destroy({ where: { session_id } });
}

module.exports = {
  saveSecondSession,
  getSecondSession,
  getSecondAllSessions,
  deleteSecondSession
};
