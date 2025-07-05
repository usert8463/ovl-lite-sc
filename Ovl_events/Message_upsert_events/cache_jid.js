const { jidDecode } = require("@whiskeysockets/baileys");

const groupCache = new Map();

const decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const d = jidDecode(jid) || {};
    return (d.user && d.server && `${d.user}@${d.server}`) || jid;
  }
  return jid;
};

async function getJid(lid, ms_org, ovl) {
  try {
    if (!lid || typeof lid !== "string") return null;
    if (lid.endsWith("@s.whatsapp.net")) return decodeJid(lid);

    if (groupCache.has(lid)) return groupCache.get(lid);

    const metadata = await ovl.groupMetadata(ms_org);
    if (!metadata || !Array.isArray(metadata.participants)) return null;

    const participant = metadata.participants.find(p => p.id === lid);
    if (!participant) return null;

    const jid = decodeJid(participant.jid);
    groupCache.set(lid, jid);
    return jid;
  } catch (e) {
    console.error("❌ Erreur dans getJid:", e.message);
    return null;
  }
}

module.exports = getJid;
