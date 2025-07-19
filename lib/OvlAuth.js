const { initAuthCreds, proto } = require('@whiskeysockets/baileys');
const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './auth.db',
  logging: false,
});

const WAAuth = sequelize.define('WAAuth', {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: true },
});

const BufferJSON = {
  replacer: (_, v) => (Buffer.isBuffer(v) ? { type: 'Buffer', data: [...v] } : v),
  reviver: (_, v) => (v?.type === 'Buffer' ? Buffer.from(v.data) : v),
};

function fixKey(type, id = '') {
  return id ? `${type}--${id}` : type;
}

async function getFromDb(key) {
  const entry = await WAAuth.findByPk(key);
  return entry ? JSON.parse(entry.value, BufferJSON.reviver) : null;
}

async function setInDb(key, data) {
  if (data == null) await WAAuth.destroy({ where: { key } });
  else await WAAuth.upsert({ key, value: JSON.stringify(data, BufferJSON.replacer) });
}

async function useSQLiteAuthState(instanceId = 'default') {
  await sequelize.sync();
  let creds = await getFromDb(`creds--${instanceId}`);
  if (!creds) {
    creds = initAuthCreds();
    await setInDb(`creds--${instanceId}`, creds);
  }
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          if (typeof type === 'object' && type.type === 'all') {
            const allEntries = await WAAuth.findAll({ where: { key: { [Op.like]: `%--${instanceId}-%` } } });
            const result = {};
            for (const entry of allEntries) {
              const [category, fullId] = entry.key.split('--');
              if (category === 'creds') continue;
              const id = fullId.split(`${instanceId}-`)[1];
              if (!result[category]) result[category] = {};
              let value = JSON.parse(entry.value, BufferJSON.reviver);
              if (category === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value);
              result[category][id] = value;
            }
            return result;
          }
          const result = {};
          for (const id of ids) {
            let data = await getFromDb(fixKey(type, `${instanceId}-${id}`));
            if (type === 'app-state-sync-key' && data) data = proto.Message.AppStateSyncKeyData.fromObject(data);
            result[id] = data;
          }
          return result;
        },
        set: async (data) => {
          const ops = [];
          for (const category in data) {
            for (const id in data[category]) {
              const key = fixKey(category, `${instanceId}-${id}`);
              ops.push(setInDb(key, data[category][id]));
            }
          }
          await Promise.all(ops);
        },
      },
    },
    saveCreds: async () => setInDb(`creds--${instanceId}`, creds),
  };
}

module.exports = { useSQLiteAuthState, WAAuth };
