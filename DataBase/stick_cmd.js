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

const StickCmd = sequelize.define('StickCmd', {
  no_cmd: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  stick_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'stickcmd',
  timestamps: false,
});

(async () => {
  await StickCmd.sync();
  console.log("Table 'StickCmd' synchronisée avec succès.");
})();

async function set_stick_cmd(no_cmd, stick_url) {
  if (!no_cmd || !stick_url) throw new Error("Commande ou URL manquante");
  await StickCmd.upsert({ no_cmd, stick_url });
  return true;
}

async function del_stick_cmd(no_cmd) {
  if (!no_cmd) throw new Error("Commande manquante");
  const deleted = await StickCmd.destroy({ where: { no_cmd } });
  return deleted > 0;
}

async function get_stick_cmd() {
  const all = await StickCmd.findAll();
  return all.map(({ no_cmd, stick_url }) => ({ no_cmd, stick_url }));
}

module.exports = {
  set_stick_cmd,
  del_stick_cmd,
  get_stick_cmd,
};


