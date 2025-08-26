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

async function getMessage(id) {
    try {
        const data = await fs.readFile(storeFilePath, 'utf8');
        const store = JSON.parse(data || "{}");
        return store[id] || null;
    } catch (err) {
        if (err.code === 'ENOENT') return null;
        console.error('Erreur getMessage :', err);
        return null;
    }
}

async function addMessage(id, messageDetails) {
    try {
        let store = {};
        try {
            const data = await fs.readFile(storeFilePath, 'utf8');
            store = JSON.parse(data || "{}");
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
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
