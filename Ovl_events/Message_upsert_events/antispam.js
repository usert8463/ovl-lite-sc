const { Antispam, AntispamWarnings } = require("../../DataBase/antispam");

const messageStore = {};
const advancedSurveillance = {};

async function antispam(ovl, ms_org, ms, auteur_Message, verif_Groupe) {
  try {
    if (!verif_Groupe || !auteur_Message) return;

    const now = Date.now();

    if (!messageStore[ms_org]) messageStore[ms_org] = {};
    if (!messageStore[ms_org][auteur_Message]) messageStore[ms_org][auteur_Message] = [];
    const userMsgs = messageStore[ms_org][auteur_Message];

    const inAdvanced = advancedSurveillance[ms_org]?.[auteur_Message];
    if (inAdvanced && now - inAdvanced < 5000) {
      try {
        await ovl.sendMessage(ms_org, { delete: { remoteJid: ms_org, fromMe: false, id: ms.key?.id, participant: auteur_Message } });
      } catch(e){ console.error(e); }
      return;
    }

    if (ms.key?.id) {
      userMsgs.push({ id: ms.key.id, timestamp: now });
      if (userMsgs.length > 5) userMsgs.shift();
    }

    const settings = await Antispam.findOne({ where: { id: ms_org } });
    if (!settings || settings.mode?.toLowerCase() !== "oui") return;

    if (userMsgs.length === 5) {
      const timeDiff = userMsgs[4].timestamp - userMsgs[0].timestamp;

      if (timeDiff < 25000) {
        advancedSurveillance[ms_org] ??= {};
        advancedSurveillance[ms_org][auteur_Message] = now;

        for (const msg of userMsgs) {
          try {
            await ovl.sendMessage(ms_org, { delete: { remoteJid: ms_org, fromMe: false, id: msg.id, participant: auteur_Message } });
          } catch(e){ console.error(e); }
        }

        const username = `@${auteur_Message.split("@")[0]}`;

        try {
          switch (settings.type) {
            case "supp":
              await ovl.sendMessage(ms_org, { text: `${username}, le spam est interdit ici.`, mentions: [auteur_Message] }, { quoted: ms });
              break;

            case "kick":
              await ovl.sendMessage(ms_org, { text: `${username} a été retiré pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
              await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
              break;

            case "warn":
              let warning = await AntispamWarnings.findOne({ where: { groupId: ms_org, userId: auteur_Message } });
              if (!warning) {
                await AntispamWarnings.create({ groupId: ms_org, userId: auteur_Message, count: 1 });
                await ovl.sendMessage(ms_org, { text: `${username}, avertissement 1/3 pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
              } else {
                warning.count += 1;
                await warning.save();
                if (warning.count >= 3) {
                  await ovl.sendMessage(ms_org, { text: `${username} retiré après 3 avertissements.`, mentions: [auteur_Message] }, { quoted: ms });
                  await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
                  await warning.destroy();
                } else {
                  await ovl.sendMessage(ms_org, { text: `${username}, avertissement ${warning.count}/3 pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
                }
              }
              break;
          }
        } catch(e){ console.error(e); }

        messageStore[ms_org][auteur_Message] = userMsgs.slice(-1);
      }
    }

  } catch (err) {
    console.error("Erreur dans Antispam:", err);
  }
}

module.exports = antispam;
