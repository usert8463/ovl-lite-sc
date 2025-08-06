const fs = require('fs');
const path = require('path');

const storeFilePath = path.resolve(__dirname, 'store_msg.json');
const MAX_STORE_SIZE_MB = 5;

function checkAndResetStore() {
    try {
        const stats = fs.statSync(storeFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > MAX_STORE_SIZE_MB) {
            fs.writeFileSync(storeFilePath, JSON.stringify({ messages: {}, contacts: {} }, null, 2));
        }
    } catch (err) {
        console.error('Erreur lors de la vérification ou de la réinitialisation du fichier :', err);
    }
}

function readStore() {
    try {
        const rawData = fs.readFileSync(storeFilePath, 'utf8');
        const parsed = JSON.parse(rawData);
        return {
            messages: parsed.messages || {},
            contacts: parsed.contacts || {}
        };
    } catch {
        return { messages: {}, contacts: {} };
    }
}

function writeStore(store) {
    try {
        fs.writeFileSync(storeFilePath, JSON.stringify(store, null, 2));
    } catch (err) {
        console.error('Erreur lors de l\'écriture dans le fichier de stockage :', err);
    }
}

function getMessage(id) {
    const store = readStore();
    return store.messages[id] || null;
}

function addMessage(id, messageDetails) {
    const store = readStore();
    if (!store.messages) store.messages = {};
    store.messages[id] = messageDetails;
    writeStore(store);
    checkAndResetStore();
}

function getContact(jid) {
    const store = readStore();
    return store.contacts[jid] || null;
}

function addContact(jid, contactDetails) {
  const store = readStore();
  if (!store.contacts) store.contacts = {};

  if (!jid) return;

  if (store.contacts[jid]) {
    store.contacts[jid] = {
      ...store.contacts[jid],
      ...contactDetails
    };
  } else {
    store.contacts[jid] = contactDetails;
  }

  writeStore(store);
  checkAndResetStore();
}

module.exports = {
    getMessage,
    addMessage,
    getContact,
    addContact,
};
