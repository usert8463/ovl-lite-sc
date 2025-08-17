const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "cache_meta_data.json");

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({}));
}

function readCache() {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

function writeCache(cache) {
  fs.writeFileSync(filePath, JSON.stringify(cache));
}

async function setCache(jid, metadata) {
  const cache = readCache();
  cache[jid] = metadata;
  writeCache(cache);
}

async function getCache(jid, ovl) {
  const cache = readCache();
  if (cache[jid]) return cache[jid];

  const metadata = await ovl.groupMetadata(jid);
  await setCache(jid, metadata);
  return metadata;
}

module.exports = { setCache, getCache };
