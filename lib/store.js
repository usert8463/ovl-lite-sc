const fs = require('fs').promises;
const path = require('path');

const storeFilePath = path.resolve(__dirname, 'store_msg.json');
const MAX_STORE_SIZE_MB = 5;

async function checkAndResetStore() {
    try {
        const stats = await fs.stat(storeFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > MAX_STORE_SIZE_MB) {
            await fs.writeFile(storeFilePath, JSON.stringify({}));
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(storeFilePath, JSON.stringify({}));
        } else {
            console.error('Erreur checkAndResetStore :', err);
        }
    }
}

async function readStoreSafe() {
    try {
        const data = await fs.readFile(storeFilePath, 'utf8');
        return JSON.parse(data || "{}");
    } catch (err) {
        if (err.code === 'ENOENT') return {};
        console.warn('Fichier store_msg.json corrompu ou illisible, réinitialisation...');
        await fs.writeFile(storeFilePath, JSON.stringify({}));
        return {};
    }
}

async function getMessage(id) {
    try {
        const store = await readStoreSafe();
        return store[id] || null;
    } catch (err) {
        console.error('Erreur getMessage :', err);
        return null;
    }
}

async function addMessage(id, messageDetails) {
    try {
        const store = await readStoreSafe();
        store[id] = messageDetails;
        await fs.writeFile(storeFilePath, JSON.stringify(store, null, 2));
        await checkAndResetStore();
    } catch (err) {
        console.error('Erreur addMessage :', err);
    }
}

module.exports = {
    getMessage,
    addMessage,
};
