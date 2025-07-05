const { jidDecode } = require("@whiskeysockets/baileys");

const groupCache = new Map();

const decodeJid = (jid) => {
  if (!jid) return null;
  if (/^\d+@s\.whatsapp\.net$/.test(jid)) return jid;
  if (/:/g.test(jid)) {
    const decoded = jidDecode(jid);
    if (decoded?.user && decoded?.server) {
      return `${decoded.user}@${decoded.server}`;
    }
  }
  return jid;
};

async function getJid(lid, ms_org, ovl) {
  try {
    if (!lid || typeof lid !== "string") return null;

    const cleanLid = decodeJid(lid);
    if (cleanLid.endsWith("@s.whatsapp.net")) return cleanLid;

    if (groupCache.has(lid)) return groupCache.get(lid);

    const metadata = await ovl.groupMetadata(ms_org);
    if (!metadata?.participants?.length) return null;

    const participant = metadata.participants.find(p => decodeJid(p.id) === cleanLid);
    if (!participant) return null;

    const jid = decodeJid(participant.id);
    groupCache.set(lid, jid);
    return jid;
  } catch (e) {
    return null;
  }
}

module.exports = getJid;
