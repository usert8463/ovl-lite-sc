const { Antispam, AntispamWarnings } = require("../../DataBase/antispam");

const antispamStore = {};
const surveillance = {};

async function antispam(ovl, ms_org, ms, auteur_Message, verif_Groupe) {
  try {
    const now = Date.now();

    if (!antispamStore[ms_org]) antispamStore[ms_org] = {};
    if (!antispamStore[ms_org][auteur_Message]) antispamStore[ms_org][auteur_Message] = [];

    const recentMsgs = antispamStore[ms_org][auteur_Message];
    recentMsgs.push({ id: ms.key.id, timestamp: now });

    const settings = await Antispam.findOne({ where: { id: ms_org } });
    if (!settings || settings.mode !== "oui") return;
    
    const key = {
      remoteJid: ms_org,
      fromMe: false,
      id: ms.key.id,
      participant: auteur_Message
    };

    if (recentMsgs.length >= 5) {
      const lastFive = recentMsgs.slice(-5);
      const first = lastFive[0].timestamp;
      const last = lastFive[4].timestamp;

      if (last - first < 25000) {
        const idsToDelete = lastFive.map(msg => ({
          remoteJid: ms_org,
          fromMe: false,
          id: msg.id,
          participant: auteur_Message
        }));

        for (const delKey of idsToDelete) {
          await ovl.sendMessage(ms_org, { delete: delKey });
        }

        switch (settings.type) {
          case 'supp':
            await ovl.sendMessage(ms_org, {
              text: `@${auteur_Message.split('@')[0]}, le spam est interdit ici.`,
              mentions: [auteur_Message]
            }, { quoted: ms });
            break;

          case 'kick':
            if (verif_Groupe) {
              await ovl.sendMessage(ms_org, {
                text: `@${auteur_Message.split('@')[0]} a été retiré pour spam.`,
                mentions: [auteur_Message]
              }, { quoted: ms });
              await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
            } else {
              await ovl.sendMessage(ms_org, {
                text: `@${auteur_Message.split('@')[0]} a été bloqué pour spam (groupe non vérifié).`,
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
              await AntispamWarnings.create({ groupId: ms_org, userId: auteur_Message, count: 1 });
              await ovl.sendMessage(ms_org, {
                text: `@${auteur_Message.split('@')[0]}, avertissement 1/3 pour spam.`,
                mentions: [auteur_Message]
              }, { quoted: ms });
            } else {
              warning.count += 1;
              await warning.save();

              if (warning.count >= 3) {
                if (isGroupVerified) {
                  await ovl.sendMessage(ms_org, {
                    text: `@${auteur_Message.split('@')[0]} retiré après 3 avertissements.`,
                    mentions: [auteur_Message]
                  }, { quoted: ms });
                  await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
                } else {
                  await ovl.sendMessage(ms_org, {
                    text: `@${auteur_Message.split('@')[0]} bloqué après 3 avertissements (non vérifié).`,
                    mentions: [auteur_Message]
                  }, { quoted: ms });
                  await ovl.updateBlockStatus(auteur_Message, "block");
                }
                await warning.destroy();
              } else {
                await ovl.sendMessage(ms_org, {
                  text: `@${auteur_Message.split('@')[0]}, avertissement ${warning.count}/3 pour spam.`,
                  mentions: [auteur_Message]
                }, { quoted: ms });
              }
            }
            break;
        }

        surveillance[ms_org] ??= {};
        surveillance[ms_org][auteur_Message] = now;
        antispamStore[ms_org][auteur_Message] = [];
        return;
      } else {
          while (recentMsgs.length > 4) {
          recentMsgs.shift();
        }
      }
    }

    const lastSurveillance = surveillance[ms_org]?.[auteur_Message];
    if (lastSurveillance) {
      const prev = recentMsgs[recentMsgs.length - 2];
      if (prev && now - prev.timestamp < 5000) {
        await ovl.sendMessage(ms_org, { delete: key });
        return;
      } else {
        surveillance[ms_org][auteur_Message] = null;
        antispamStore[ms_org][auteur_Message] = [{ id: ms.key.id, timestamp: now }];
      }
    }

  } catch (err) {
    console.error("Erreur dans le système antispam :", err);
  }
}

module.exports = antispam;
