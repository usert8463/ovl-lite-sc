const { Sequelize, DataTypes } = require('sequelize');
const config = require('../set');
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

const Warn = sequelize.define('Warn', {
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  tableName: 'warn',
  timestamps: false,
});

const WarnConfig = sequelize.define('WarnConfig', {
  limit: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false,
  }
}, {
  tableName: 'warn_config',
  timestamps: false,
});

(async () => {
  await Warn.sync();
  await WarnConfig.sync();

  console.log("Table Warn synchronisée.");
})();

async function delWarn(userId) {
  return await Warn.destroy({ where: { userId } });
}

async function setWarn(userId, count) {
  const [warn, created] = await Warn.findOrCreate({
    where: { userId },
    defaults: { count }
  });
  if (!created) {
    warn.count = count;
    await warn.save();
  }
  return warn;
}

async function getLimit() {
  const config = await WarnConfig.findOne();
  return config ? config.limit : 3;
}

async function setLimit(newLimit) {
  const config = await WarnConfig.findOne();
  if (config) {
    config.limit = newLimit;
    await config.save();
  } else {
    await WarnConfig.create({ limit: newLimit });
  }
}

module.exports = { WarnConfig, delWarn, setWarn, getLimit, setLimit };
