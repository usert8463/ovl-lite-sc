const { Antispam, AntispamWarnings } = require("../../DataBase/antispam");

const antispamStore = {};
const surveillance = {};

async function antispam(ovl, ms_org, ms, auteur_Message) {
  try {
    if (!ms.message) return;

    const now = Date.now();

    if (!antispamStore[ms_org]) antispamStore[ms_org] = {};
    if (!antispamStore[ms_org][auteur_Message]) antispamStore[ms_org][auteur_Message] = [];

    antispamStore[ms_org][auteur_Message].push({ id: ms.key.id, timestamp: now });
    if (antispamStore[ms_org][auteur_Message].length > 5) {
      antispamStore[ms_org][auteur_Message].shift();
    }

    const recentMsgs = antispamStore[ms_org][auteur_Message];
    const settings = await Antispam.findOne({ where: { id: ms_org } });
    if (!settings || settings.mode !== "oui") return;

    const key = {
      remoteJid: ms_org,
      fromMe: false,
      id: ms.key.id,
      participant: auteur_Message
    };

    if (recentMsgs.length === 5) {
      const first = recentMsgs[0].timestamp;
      const last = recentMsgs[4].timestamp;

      if (last - first < 10000) {
        const idsToDelete = recentMsgs.map(msg => ({
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
            await ovl.sendMessage(ms_org, {
              text: `@${auteur_Message.split('@')[0]} a été retiré pour avoir spammé.`,
              mentions: [auteur_Message]
            }, { quoted: ms });
            await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
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
                await ovl.sendMessage(ms_org, {
                  text: `@${auteur_Message.split('@')[0]} a été retiré après 3 avertissements de spam.`,
                  mentions: [auteur_Message]
                }, { quoted: ms });
                await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
                await warning.destroy();
              } else {
                await ovl.sendMessage(ms_org, {
                  text: `@${auteur_Message.split('@')[0]}, avertissement ${warning.count}/3 pour spam.`,
                  mentions: [auteur_Message]
                }, { quoted: ms });
              }
            }
            break;

          default:
            console.error(`Type d'action inconnu pour antispam: ${settings.type}`);
        }

        surveillance[ms_org] ??= {};
        surveillance[ms_org][auteur_Message] = true;
        antispamStore[ms_org][auteur_Message] = [recentMsgs[4]];
        return;
      }
    }

    if (surveillance[ms_org]?.[auteur_Message]) {
      const prevMsg = antispamStore[ms_org][auteur_Message][antispamStore[ms_org][auteur_Message].length - 2];
      if (prevMsg && now - prevMsg.timestamp < 3000) {
        await ovl.sendMessage(ms_org, { delete: key });
      } else {
        surveillance[ms_org][auteur_Message] = false;
        antispamStore[ms_org][auteur_Message] = [{ id: ms.key.id, timestamp: now }];
      }
    }

  } catch (err) {
    console.error("Erreur dans le système antispam :", err);
  }
}

module.exports = antispam;
