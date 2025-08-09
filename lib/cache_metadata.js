const groupCache = {};
const TTL = 5 * 60 * 1000;

function setCache(key, value) {
  groupCache[key] = { value, expireAt: Date.now() + TTL };
}

function getCache(key) {
  const item = groupCache[key];
  if (!item || Date.now() > item.expireAt) {
    delete groupCache[key];
    return null;
  }
  return item.value;
}

module.exports = { setCache, getCache };
