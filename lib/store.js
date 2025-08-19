const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const storeFilePath = path.resolve(__dirname, 'store_msg.json');
const MAX_STORE_SIZE_MB = 5;

async function checkAndResetStore() {
    try {
        const stats = await fs.stat(storeFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > MAX_STORE_SIZE_MB) {
            await fs.writeFile(storeFilePath, "");
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("Erreur lors de la vérification :", err);
        }
    }
}

async function addMessage(id, messageDetails) {
    try {
        const entry = { id, messageDetails };
        await fs.appendFile(storeFilePath, JSON.stringify(entry) + "\n", "utf8");
        await checkAndResetStore();
    } catch (err) {
        console.error("Erreur lors de l'ajout du message :", err);
    }
}

async function getMessage(id) {
    try {
        const stream = await fs.open(storeFilePath, 'r');
        const rl = readline.createInterface({
            input: stream.createReadStream(),
            crlfDelay: Infinity
        });
        for await (const line of rl) {
            if (!line.trim()) continue;
            try {
                const entry = JSON.parse(line);
                if (entry.id === id) {
                    await stream.close();
                    return entry.messageDetails;
                }
            } catch {}
        }
        await stream.close();
        return null;
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("Erreur lors de la lecture :", err);
        }
        return null;
    }
}

module.exports = {
    getMessage,
    addMessage
};
