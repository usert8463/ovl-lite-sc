const { GroupSettings, Events2 } = require("../DataBase/events");
const { jidDecode } = require("@whiskeysockets/baileys");
const { getJid } = require('./Message_upsert_events');

const parseID = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return (decode.user && decode.server && `${decode.user}@${decode.server}`) || jid;
  }
  return jid;
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

  let msg = raw;
  const urlMatch = raw.match(/#url=(\S+)/i);
  const hasPP = raw.includes("#pp");
  const hasGPP = raw.includes("#gpp");

  msg = msg
    .replace(/#url=\S+/i, "")
    .replace(/#pp/gi, "")
    .replace(/#gpp/gi, "")
    .replace(/@user/gi, userMention)
    .replace(/#groupe/gi, groupName)
    .replace(/#membre/gi, totalMembers)
    .replace(/#desc/gi, groupInfo.desc || "");

  const mentions = [participant];
  let mediaType = null;
  let mediaUrl = null;

  if (urlMatch) {
    mediaUrl = urlMatch[1];
    const ext = mediaUrl.split(".").pop().toLowerCase();
    mediaType = ["mp4", "mov", "webm"].includes(ext)
      ? "video"
      : ["jpg", "jpeg", "png", "webp"].includes(ext)
      ? "image"
      : "document";
  } else if (hasPP) {
    try {
      mediaUrl = await ovl.profilePictureUrl(participant, 'image');
    } catch {
      mediaUrl = "https://wallpapercave.com/uwp/uwp4820694.jpeg";
    }
    mediaType = "image";
  } else if (hasGPP) {
    try {
      mediaUrl = await ovl.profilePictureUrl(jid, 'image');
    } catch {
      mediaUrl = "https://wallpapercave.com/uwp/uwp4820694.jpeg";
    }
    mediaType = "image";
  }

  if (mediaUrl && mediaType) {
    await ovl.sendMessage(jid, {
      [mediaType]: { url: mediaUrl },
      caption: msg.trim(),
      mentions,
    });
  } else {
    await ovl.sendMessage(jid, { text: msg.trim(), mentions });
  }
}

async function group_participants_update(data, ovl) {
  try {
    const groupInfo = await ovl.groupMetadata(data.id);
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
      const mentions = [participant, actor];

      if (data.action === 'add' && welcome === 'oui') {
        if (eventSettings) {
          await envoyerWelcomeGoodbye(data.id, participant, "welcome", eventSettings, ovl);
        }
      }

      if (data.action === 'remove' && goodbye === 'oui') {
        if (eventSettings) {
          await envoyerWelcomeGoodbye(data.id, participant, "goodbye", eventSettings, ovl);
        }
      }

      if (data.action === 'promote') {
        const authorJid = await getJid(data.author, data.id, ovl);
        const ownerJid = await getJid(metadata.owner, data.id, ovl);
        const botJid = await getJid(parseID(ovl.user.id), data.id, ovl);
        const participantJid = await getJid(participant, data.id, ovl);
        const ownerNumJid = await getJid(process.env.NUMERO_OWNER + '@s.whatsapp.net', data.id, ovl);

        if ([ownerJid, botJid, ownerNumJid, participantJid].includes(authorJid)) return;

        if (antipromote === 'oui') {
          await ovl.groupParticipantsUpdate(data.id, [participant], "demote");
          await ovl.sendMessage(data.id, {
            text: `🚫 *Promotion refusée !*\n${actorMention} n’a pas le droit de promouvoir ${userMention}.`,
            mentions,
          });
        } else if (promoteAlert === 'oui') {
          let pp = "https://wallpapercave.com/uwp/uwp4820694.jpeg";
          try {
            pp = await ovl.profilePictureUrl(participant, 'image');
          } catch {}
          await ovl.sendMessage(data.id, {
            image: { url: pp },
            caption: `🆙 ${userMention} a été promu par ${actorMention}.`,
            mentions,
          });
        }
      }

      if (data.action === 'demote') {
        const authorJid = await getJid(data.author, data.id, ovl);
        const ownerJid = await getJid(metadata.owner, data.id, ovl);
        const botJid = await getJid(parseID(ovl.user.id), data.id, ovl);
        const participantJid = await getJid(participant, data.id, ovl);
        const ownerNumJid = await getJid(process.env.NUMERO_OWNER + '@s.whatsapp.net', data.id, ovl);

        if ([ownerJid, botJid, ownerNumJid, participantJid].includes(authorJid)) return;

        if (antidemote === 'oui') {
          await ovl.groupParticipantsUpdate(data.id, [participant], "promote");
          await ovl.sendMessage(data.id, {
            text: `🚫 *Rétrogradation refusée !*\n${actorMention} ne peut pas rétrograder ${userMention}.`,
            mentions,
          });
        } else if (demoteAlert === 'oui') {
          let pp = "https://wallpapercave.com/uwp/uwp4820694.jpeg";
          try {
            pp = await ovl.profilePictureUrl(participant, 'image');
          } catch {}
          await ovl.sendMessage(data.id, {
            image: { url: pp },
            caption: `⬇️ ${userMention} a été rétrogradé par ${actorMention}.`,
            mentions,
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ Erreur group_participants_update :", err);
  }
}

module.exports = group_participants_update;
