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

(async () => {
  await WAAuth.sync();
})();

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
  let keys = await getFromDb(`keys--${instanceId}`) || {};
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          for (const id of ids) {
            let data = keys?.[type]?.[id];
            if (type === 'app-state-sync-key' && data) {
              data = proto.Message.AppStateSyncKeyData.fromObject(data);
            }
            result[id] = data;
          }
          return result;
        },
        set: async (data) => {
          for (const category in data) {
            if (!keys[category]) keys[category] = {};
            for (const id in data[category]) {
              keys[category][id] = data[category][id];
            }
          }
          await setInDb(`keys--${instanceId}`, keys);
        },
      },
    },
    saveCreds: async () => {
      await setInDb(`creds--${instanceId}`, creds);
      await setInDb(`keys--${instanceId}`, keys);
    },
  };
}

module.exports = { useSQLiteAuthState, WAAuth };
