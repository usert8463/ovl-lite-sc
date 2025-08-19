const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const storeFilePath = path.join(__dirname, 'cache_meta_data.json');
const MAX_STORE_SIZE_MB = 15;

async function checkAndResetStore() {
    try {
        const stats = await fs.stat(storeFilePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > MAX_STORE_SIZE_MB) {
            await fs.writeFile(storeFilePath, "");
        }
    } catch (err) {
        if (err.code !== 'ENOENT') console.error("Erreur check store :", err);
    }
}

async function setCache(jid, metadata) {
    const entry = { jid, metadata };
    await fs.appendFile(storeFilePath, JSON.stringify(entry) + "\n", "utf8");
    await checkAndResetStore();
}

async function getCache(jid, ovl) {
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
                if (entry.jid === jid) {
                    await stream.close();
                    return entry.metadata;
                }
            } catch {}
        }
        await stream.close();

        const metadata = await ovl.groupMetadata(jid);
        await setCache(jid, metadata);
        return metadata;

    } catch (err) {
        if (err.code !== 'ENOENT') console.error("Erreur getCache :", err);
        const metadata = await ovl.groupMetadata(jid);
        await setCache(jid, metadata);
        return metadata;
    }
}

module.exports = { setCache, getCache };
