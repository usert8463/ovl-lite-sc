const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.db',
  logging: false,
});

const Group = sequelize.define(
  'group_metadata',
  {
    jid: {
      type: DataTypes.TEXT,
      primaryKey: true,
      unique: true,
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'group_metadata',
    timestamps: false,
  }
);

(async () => {
  await Group.sync();
  console.log('Table group_metadata synchronisée.');
})();

async function setCache(jid, metadata, ajout = true) {
  const data = JSON.stringify(metadata);
  const existing = await Group.findByPk(jid);

  if (ajout) {
    if (existing) {
      await Group.update({ data }, { where: { jid } });
    } else {
      await Group.create({ jid, data });
    }
  } else {
    if (!existing) {
      await Group.create({ jid, data });
    }
  }
}

async function getCache(jid) {
  const record = await Group.findByPk(jid);
  if (!record) return null;
  return JSON.parse(record.get('data'));
}

module.exports = { setCache, getCache };
