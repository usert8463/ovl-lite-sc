const { GroupSettings, Events2 } = require("../DataBase/events");
const { setCache } = require("../lib/cache_metadata");
const { jidDecode } = require("@whiskeysockets/baileys");
const { getJid } = require('./Message_upsert_events');
const config = require("../set");

const parseID = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
  }
  return jid;
};

const ms_badge = {
  key: {
    fromMe: false,
    participant: '0@s.whatsapp.net',
    remoteJid: '0@s.whatsapp.net',
  },
  message: {
    extendedTextMessage: {
      text: 'ᴏᴠʟ-ᴍᴅ-ᴠ𝟸',
      contextInfo: {
        mentionedJid: [],
      },
    },
  }
};

async function envoyerWelcomeGoodbye(jid, participant, type, eventSettings, ovl) {
  const groupInfo = await ovl.groupMetadata(jid);
  const groupName = groupInfo.subject || "Groupe";
  const totalMembers = groupInfo.participants.length;
  const userMention = `@${participant.split("@")[0]}`;

  const raw = {
    welcome: eventSettings.welcome_msg || `🎉Bienvenue @user\n👥Groupe: #groupe\n🔆Membres: #membre\n📃Description: ${groupInfo.desc || "Aucune description"} #pp`,
    goodbye: eventSettings.goodbye_msg || `👋Au revoir @user #pp`,
  }[type];

  const audioMatch = raw.match(/#audio=(\S+)/i);
  const urlMatch = raw.match(/#url=(\S+)/i);
  const hasPP = raw.includes("#pp");
  const hasGPP = raw.includes("#gpp");

  let msg = raw
    .replace(/#audio=\S+/i, "")
    .replace(/#url=\S+/i, "")
    .replace(/#pp/gi, "")
    .replace(/#gpp/gi, "")
    .replace(/@user/gi, userMention)
    .replace(/#groupe/gi, groupName)
    .replace(/#membre/gi, totalMembers)
    .replace(/#desc/gi, groupInfo.desc || "");

  const mentions = [participant];
  const contextInfo = { mentionedJid: mentions };

  if (msg.trim()) {
    await ovl.sendMessage(jid, {
      text: msg.trim(),
      mentions,
      contextInfo
    }, { quoted: ms_badge });
  }

  let mediaType = null;
  let mediaUrl = null;

  if (urlMatch) {
    mediaUrl = urlMatch[1];
    const ext = mediaUrl.split(".").pop().toLowerCase();
    if (["mp4", "mov", "webm"].includes(ext)) mediaType = "video";
    else if (["jpg", "jpeg", "png", "webp"].includes(ext)) mediaType = "image";
    else mediaType = "document";
  } else if (hasPP) {
    try { mediaUrl = await ovl.profilePictureUrl(participant, 'image'); } catch { mediaUrl = "https://files.catbox.moe/82g8ey.jpg"; }
    mediaType = "image";
  } else if (hasGPP) {
    try { mediaUrl = await ovl.profilePictureUrl(jid, 'image'); } catch { mediaUrl = "https://files.catbox.moe/82g8ey.jpg"; }
    mediaType = "image";
  }

  if (mediaUrl && mediaType) {
    await ovl.sendMessage(jid, {
      [mediaType]: { url: mediaUrl },
      caption: msg.trim() || undefined,
      mentions,
      contextInfo
    }, { quoted: ms_badge });
  }
 
  if (audioMatch) {
    const audioUrl = audioMatch[1];
    await ovl.sendMessage(jid, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
    }, { quoted: ms_badge });
  }
}

async function group_participants_update(data, ovl) {
  try {
    const groupInfo = await ovl.groupMetadata(data.id);
    await setCache(data.id, groupInfo);

    const metadata = groupInfo;
    const settings = await GroupSettings.findOne({ where: { id: data.id } });
    const eventSettings = await Events2.findOne({ where: { id: data.id } });
    if (!settings) return;

    const { welcome, goodbye, antipromote, antidemote } = settings;
    const promoteAlert = eventSettings?.promoteAlert || 'non';
    const demoteAlert = eventSettings?.demoteAlert || 'non';

    for (const participant of data.participants) {
      const actor = data.author;
      const actorMention = actor ? `@${actor.split("@")[0]}` : "quelqu’un";
      const userMention = `@${participant.split("@")[0]}`;
      const mentions = actor ? [participant, actor] : [participant];
      const contextInfo = { mentionedJid: mentions };

      if (data.action === 'add' && welcome === 'oui') {
        if (eventSettings) await envoyerWelcomeGoodbye(data.id, participant, "welcome", eventSettings, ovl);
      }

      if (data.action === 'remove' && goodbye === 'oui') {
        if (eventSettings) await envoyerWelcomeGoodbye(data.id, participant, "goodbye", eventSettings, ovl);
      }

      if (data.action === 'promote' || data.action === 'demote') {
        const authorJid = await getJid(data.author, data.id, ovl);
        const ownerJid = await getJid(metadata.owner, data.id, ovl);
        const botJid = await getJid(parseID(ovl.user.id), data.id, ovl);
        const participantJid = await getJid(participant, data.id, ovl);
        const ownerNumJid = await getJid(config.NUMERO_OWNER + '@s.whatsapp.net', data.id, ovl);
        const exemptJid1 = await getJid("22605463559@s.whatsapp.net", data.id, ovl);
        const exemptJid2 = await getJid("22651463203@s.whatsapp.net", data.id, ovl);

        const isExempted = [ownerJid, botJid, ownerNumJid, participantJid, exemptJid1, exemptJid2].includes(authorJid);

        if (data.action === 'promote') {
          if (antipromote === 'oui' && isExempted) continue;
          if (antipromote === 'oui') {
            await ovl.groupParticipantsUpdate(data.id, [participant], "demote");
            await ovl.sendMessage(data.id, { text: `🚫 *Promotion refusée !*\n${actorMention} n’a pas le droit de promouvoir ${userMention}.`, mentions, contextInfo }, { quoted: ms_badge });
          } else if (promoteAlert === 'oui') {
            let pp = "https://files.catbox.moe/82g8ey.jpg";
            try { pp = await ovl.profilePictureUrl(participant, 'image'); } catch {}
            await ovl.sendMessage(data.id, { image: { url: pp }, caption: `🆙 ${userMention} a été promu par ${actorMention}.`, mentions, contextInfo }, { quoted: ms_badge });
          }
        }

        if (data.action === 'demote') {
          if (antidemote === 'oui' && isExempted) continue;
          if (antidemote === 'oui') {
            await ovl.groupParticipantsUpdate(data.id, [participant], "promote");
            await ovl.sendMessage(data.id, { text: `🚫 *Rétrogradation refusée !*\n${actorMention} ne peut pas rétrograder ${userMention}.`, mentions, contextInfo }, { quoted: ms_badge });
          } else if (demoteAlert === 'oui') {
            let pp = "https://files.catbox.moe/82g8ey.jpg";
            try { pp = await ovl.profilePictureUrl(participant, 'image'); } catch {}
            await ovl.sendMessage(data.id, { image: { url: pp }, caption: `⬇️ ${userMention} a été rétrogradé par ${actorMention}.`, mentions, contextInfo }, { quoted: ms_badge });
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Erreur group_participants_update :", err);
  }
}

module.exports = group_participants_update;
