const { Sequelize, DataTypes } = require('sequelize');
const db = process.env.DATABASE;

const sequelize = new Sequelize(
    'postgresql://postgres.mkvywsrvpbngcaabihlb:database@passWord1@aws-0-eu-north-1.pooler.supabase.com:6543/postgres', {
    dialect: 'postgres',
    ssl: true,
    protocol: 'postgres',
    dialectOptions: {
      native: true,
      ssl: { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });
  
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  keys: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'sessions',
  timestamps: false,
});

(async () => {
  await Session.sync();
})();

async function get_session(id) {
  const session = await Session.findByPk(id);
  if (!session) return null;

  session.createdAt = new Date();
  await session.save();

  return {
    creds: session.content,
    keys: JSON.parse(session.keys),
  };
}

module.exports = get_session;
