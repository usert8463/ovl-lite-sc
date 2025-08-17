const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "cache_data.db"),
  logging: false,
});

const GroupCache = sequelize.define(
  "GroupCache",
  {
    jid: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "group_cache",
    timestamps: false,
  }
);

(async () => {
  await GroupCache.sync();
})();

async function setCache(jid, metadata) {
  await GroupCache.upsert({
    jid,
    metadata,
  });
}

async function getCache(jid, ovl) {
  const cacheEntry = await GroupCache.findOne({ where: { jid } });
  if (cacheEntry) return cacheEntry.metadata;

  const metadata = await ovl.groupMetadata(jid);
  await setCache(jid, metadata);
  return metadata;
}

module.exports = { setCache, getCache };
