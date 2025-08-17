const { initAuthCreds, proto } = require('@whiskeysockets/baileys');
const { Sequelize, DataTypes } = require('sequelize');

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

async function getFromDb(key) {
  const entry = await WAAuth.findByPk(key);
  return entry ? JSON.parse(entry.value, BufferJSON.reviver) : null;
}

async function setInDb(key, data) {
  if (data == null) {
    await WAAuth.destroy({ where: { key } });
  } else {
    await WAAuth.upsert({ key, value: JSON.stringify(data, BufferJSON.replacer) });
  }
}

async function useSQLiteAuthState(instanceId = 'default') {
  await sequelize.sync();

  // Load creds
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
          const data = {};
          for (const id of ids) {
            const keyData = await getFromDb(`key--${instanceId}--${type}--${id}`);
            if (type === 'app-state-sync-key' && keyData) {
              data[id] = proto.Message.AppStateSyncKeyData.fromObject(keyData);
            } else {
              data[id] = keyData;
            }
          }
          return data;
        },
        set: async (data) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const keyName = `key--${instanceId}--${category}--${id}`;
              if (value) {
                await setInDb(keyName, value);
              } else {
                await WAAuth.destroy({ where: { key: keyName } });
              }
            }
          }
        },
      },
    },
    saveCreds: async () => {
      await setInDb(`creds--${instanceId}`, creds);
    },
  };
}

module.exports = { useSQLiteAuthState, WAAuth };
