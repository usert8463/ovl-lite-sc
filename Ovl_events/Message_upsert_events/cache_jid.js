const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db',
  logging: false,
});

const JidCache = sequelize.define(
  'jid_cache',
  {
    lid: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    jid: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'jid_cache',
    timestamps: false,
  }
);

(async () => {
  await JidCache.sync();
})();

async function getJid(lid, ms_org, ovl, attempt = 0) {
  try {
    if (!lid || typeof lid !== "string") return null;
    if (lid.endsWith("@s.whatsapp.net")) return lid;

    const record = await JidCache.findByPk(lid);
    if (record) return record.jid;

    const metadata = await ovl.groupMetadata(ms_org);
    if (!metadata || !Array.isArray(metadata.participants)) return null;

    const participant = metadata.participants.find(p => p.id === lid);
    if (!participant) return null;

    const jid = participant.jid;
    await JidCache.create({ lid, jid });
    return jid;

  } catch (e) {
    if (attempt < 2) {
      return getJid(lid, ms_org, ovl, attempt + 1);
    }
    console.error("❌ Erreur dans getJid après 3 tentatives:", e.message);
    return null;
  }
}

module.exports = getJid;
