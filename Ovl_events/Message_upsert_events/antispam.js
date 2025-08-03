const { Antispam, AntispamWarnings } = require("../../DataBase/antispam");

const antispamStore = {};
const surveillance = {};

async function antispam(ovl, ms_org, ms, auteur_Message, verif_Groupe) {
  try {
    const now = Date.now();

    if (!antispamStore[ms_org]) antispamStore[ms_org] = {};
    if (!antispamStore[ms_org][auteur_Message]) antispamStore[ms_org][auteur_Message] = [];

    if (ms.key?.id) {
      antispamStore[ms_org][auteur_Message].push({ id: ms.key.id, timestamp: now });
    }

    const recentMsgs = antispamStore[ms_org][auteur_Message];
    while (recentMsgs.length > 20) recentMsgs.shift();

    const settings = await Antispam.findOne({ where: { id: ms_org } });
    if (!settings || settings.mode !== "oui") return;

    const key = {
      remoteJid: ms_org,
      fromMe: false,
      id: ms.key.id,
      ...(verif_Groupe && { participant: auteur_Message })
    };

    const isInSurveillance = surveillance[ms_org]?.[auteur_Message];
    if (isInSurveillance && now - isInSurveillance < 10000) {
      await ovl.sendMessage(ms_org, { delete: key });
      return;
    }

    if (recentMsgs.length >= 5) {
      const lastFive = recentMsgs.slice(-5);
      if (!lastFive[0] || !lastFive[4]) return;

      const first = lastFive[0].timestamp;
      const last = lastFive[4].timestamp;

      if (last - first < 25000) {
        for (const msg of recentMsgs) {
          const delKey = {
            remoteJid: ms_org,
            fromMe: false,
            id: msg.id,
            ...(verif_Groupe && { participant: auteur_Message })
          };

          try {
            await ovl.sendMessage(ms_org, { delete: delKey });
          } catch (err) {
            console.error("Erreur suppression message :", delKey, err.message);
          }
        }

        const username = `@${auteur_Message.split('@')[0]}`;

        switch (settings.type) {
          case 'supp':
            await ovl.sendMessage(ms_org, {
              text: `${username}, le spam est interdit ici.`,
              mentions: [auteur_Message]
            }, { quoted: ms });
            break;

          case 'kick':
            if (verif_Groupe) {
              await ovl.sendMessage(ms_org, {
                text: `${username} a été retiré pour spam.`,
                mentions: [auteur_Message]
              }, { quoted: ms });
              await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
            } else {
              await ovl.sendMessage(ms_org, {
                text: `${username} a été bloqué pour spam.`,
                mentions: [auteur_Message]
              }, { quoted: ms });
              await ovl.updateBlockStatus(auteur_Message, "block");
            }
            break;

          case 'warn':
            let warning = await AntispamWarnings.findOne({
              where: { groupId: ms_org, userId: auteur_Message }
            });

            if (!warning) {
              await AntispamWarnings.create({
                groupId: ms_org,
                userId: auteur_Message,
                count: 1
              });
              await ovl.sendMessage(ms_org, {
                text: `${username}, avertissement 1/3 pour spam.`,
                mentions: [auteur_Message]
              }, { quoted: ms });
            } else {
              warning.count += 1;
              await warning.save();

              if (warning.count >= 3) {
                if (verif_Groupe) {
                  await ovl.sendMessage(ms_org, {
                    text: `${username} retiré après 3 avertissements.`,
                    mentions: [auteur_Message]
                  }, { quoted: ms });
                  await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
                } else {
                  await ovl.sendMessage(ms_org, {
                    text: `${username} bloqué après 3 avertissements.`,
                    mentions: [auteur_Message]
                  }, { quoted: ms });
                  await ovl.updateBlockStatus(auteur_Message, "block");
                }
                await warning.destroy();
              } else {
                await ovl.sendMessage(ms_org, {
                  text: `${username}, avertissement ${warning.count}/3 pour spam.`,
                  mentions: [auteur_Message]
                }, { quoted: ms });
              }
            }
            break;
        }

        surveillance[ms_org] ??= {};
        surveillance[ms_org][auteur_Message] = now;
        antispamStore[ms_org][auteur_Message] = [];
      }
    }

  } catch (err) {
    console.error("Erreur dans le système antispam :", err);
  }
}

module.exports = antispam;
