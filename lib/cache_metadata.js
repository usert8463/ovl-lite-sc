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
})();

async function setCache(jid, metadata) {
  const data = JSON.stringify(metadata);
  const existing = await Group.findByPk(jid);
  if (existing) {
    await Group.update({ data }, { where: { jid } });
  } else {
    await Group.create({ jid, data });
  }
}

async function getCache(jid, ovl) {
  let record = await Group.findByPk(jid);
  if (record) return JSON.parse(record.data);

  const metadata = await ovl.groupMetadata(jid);
  await setCache(jid, metadata);
  return metadata;
}

module.exports = { setCache, getCache };
