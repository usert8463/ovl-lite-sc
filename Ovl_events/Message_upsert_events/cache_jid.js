const { jidDecode } = require("@whiskeysockets/baileys");

const groupCache = new Map();

const decodeJid = (jid) => {
  if (!jid) return null;
  if (/^\d+@s\.whatsapp\.net$/.test(jid)) return jid;
  if (jid.includes(":")) {
    const d = jidDecode(jid);
    if (d?.user && d?.server) return `${d.user}@${d.server}`;
  }
  if (/^\d+$/.test(jid)) return `${jid}@s.whatsapp.net`;
  return null;
};

async function getJid(lid, ms_org, ovl) {
  try {
    if (!lid || typeof lid !== "string") return null;

    const baseJid = decodeJid(lid);
    if (baseJid?.endsWith("@s.whatsapp.net")) return baseJid;

    if (groupCache.has(lid)) return groupCache.get(lid);

    const metadata = await ovl.groupMetadata(ms_org);
    if (!metadata?.participants?.length) return null;

    const participant = metadata.participants.find(p => {
      const jid = decodeJid(p.id);
      return jid === lid || p.id === lid;
    });

    if (!participant) return null;

    const finalJid = decodeJid(participant.id);
    if (finalJid) groupCache.set(lid, finalJid);
    return finalJid;
  } catch (e) {
    return null;
  }
}

module.exports = getJid;
