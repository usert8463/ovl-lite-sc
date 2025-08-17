const fs = require("fs").promises;
const path = require("path");

const storeFilePath = path.resolve(__dirname, "store_msg.json");
const MAX_STORE_SIZE_MB = 5;

async function initStore() {
  try {
    await fs.access(storeFilePath);
  } catch {
    await fs.writeFile(storeFilePath, JSON.stringify({}, null, 2));
  }
}

async function checkAndResetStore() {
  try {
    const stats = await fs.stat(storeFilePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > MAX_STORE_SIZE_MB) {
      console.warn(`⚠️ Le fichier store_msg.json dépasse ${MAX_STORE_SIZE_MB} Mo. Réinitialisation...`);
      await fs.writeFile(storeFilePath, JSON.stringify({}, null, 2));
    }
  } catch (err) {
    console.error("Erreur lors de la vérification ou réinitialisation du fichier :", err);
  }
}

async function getMessage(id) {
  try {
    const data = await fs.readFile(storeFilePath, "utf8");
    const store = JSON.parse(data);
    return store[id] || null;
  } catch (err) {
    console.error("Erreur lors de la lecture du fichier :", err);
    return null;
  }
}

async function addMessage(id, messageDetails) {
  try {
    const data = await fs.readFile(storeFilePath, "utf8");
    const store = JSON.parse(data);
    store[id] = messageDetails;
    await fs.writeFile(storeFilePath, JSON.stringify(store, null, 2));
    await checkAndResetStore();
  } catch (err) {
    console.error("Erreur lors de l’ajout du message :", err);
  }
}

initStore();

module.exports = { getMessage, addMessage };
