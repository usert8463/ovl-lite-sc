const { Antispam, AntispamWarnings } = require("../../DataBase/antispam");

const messageStore = {};
const advancedSurveillance = {};

async function antispam(ovl, ms_org, ms, auteur_Message, verif_Groupe) {
  try {
    console.log("=== Début antispam ===");
    console.log({ ms_org, ms, auteur_Message, verif_Groupe });

    if (!verif_Groupe) {
      console.log("❌ verif_Groupe est faux, arrêt de la fonction");
      return;
    }
    if (!auteur_Message) {
      console.log("❌ auteur_Message non défini, arrêt de la fonction");
      return;
    }

    const now = Date.now();

    // Initialisation du stockage
    if (!messageStore[ms_org]) messageStore[ms_org] = {};
    if (!messageStore[ms_org][auteur_Message]) messageStore[ms_org][auteur_Message] = [];
    const userMsgs = messageStore[ms_org][auteur_Message];

    console.log("Messages précédents de l'utilisateur:", userMsgs.map(m => m.id));

    // Vérification advancedSurveillance
    const inAdvanced = advancedSurveillance[ms_org]?.[auteur_Message];
    if (inAdvanced && now - inAdvanced < 5000) {
      console.log("⚠️ Utilisateur en surveillance avancée, suppression du message");
      try {
        await ovl.sendMessage(ms_org, { delete: { remoteJid: ms_org, fromMe: false, id: ms.key?.id, participant: auteur_Message } });
        console.log("Message supprimé en mode advancedSurveillance:", ms.key?.id);
      } catch (e) {
        console.error("Erreur suppression advancedSurveillance:", e);
      }
      return;
    }

    // Ajout du message actuel
    if (!ms.key?.id) {
      console.log("❌ ms.key.id est undefined !");
    } else {
      console.log("Ajout du message à l'historique:", ms.key.id);
      userMsgs.push({ id: ms.key.id, timestamp: now });
      if (userMsgs.length > 5) userMsgs.shift();
    }

    // Récupération des paramètres antispam depuis la base
    const settings = await Antispam.findOne({ where: { id: ms_org } });
    console.log("Paramètres récupérés:", settings?.dataValues);

    if (!settings) {
      console.log("❌ Aucun paramètre antispam trouvé pour ce groupe, arrêt.");
      return;
    }

    if (settings.mode?.toLowerCase() !== "oui") {
      console.log("❌ Mode antispam non activé, arrêt.");
      return;
    }

    if (userMsgs.length === 5) {
      const timeDiff = userMsgs[4].timestamp - userMsgs[0].timestamp;
      console.log("Temps entre le premier et le dernier message:", timeDiff, "ms");

      if (timeDiff < 25000) {
        console.log("🚨 Spam détecté !");
        advancedSurveillance[ms_org] ??= {};
        advancedSurveillance[ms_org][auteur_Message] = now;

        for (const msg of userMsgs) {
          try {
            await ovl.sendMessage(ms_org, { delete: { remoteJid: ms_org, fromMe: false, id: msg.id, participant: auteur_Message } });
            console.log("Message supprimé pour spam:", msg.id);
          } catch (e) {
            console.error("Erreur suppression message spam:", e);
          }
        }

        const username = `@${auteur_Message.split("@")[0]}`;

        try {
          switch (settings.type) {
            case "supp":
              console.log("Type d'action: suppression seulement");
              await ovl.sendMessage(ms_org, { text: `${username}, le spam est interdit ici.`, mentions: [auteur_Message] }, { quoted: ms });
              break;

            case "kick":
              console.log("Type d'action: kick");
              await ovl.sendMessage(ms_org, { text: `${username} a été retiré pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
              await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
              break;

            case "warn":
              console.log("Type d'action: avertissement");
              let warning = await AntispamWarnings.findOne({ where: { groupId: ms_org, userId: auteur_Message } });
              if (!warning) {
                console.log("Aucun avertissement existant, création 1er avertissement");
                await AntispamWarnings.create({ groupId: ms_org, userId: auteur_Message, count: 1 });
                await ovl.sendMessage(ms_org, { text: `${username}, avertissement 1/3 pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
              } else {
                warning.count += 1;
                await warning.save();
                console.log("Avertissement existant, count =", warning.count);

                if (warning.count >= 3) {
                  await ovl.sendMessage(ms_org, { text: `${username} retiré après 3 avertissements.`, mentions: [auteur_Message] }, { quoted: ms });
                  await ovl.groupParticipantsUpdate(ms_org, [auteur_Message], "remove");
                  await warning.destroy();
                  console.log("Utilisateur retiré après 3 avertissements");
                } else {
                  await ovl.sendMessage(ms_org, { text: `${username}, avertissement ${warning.count}/3 pour spam.`, mentions: [auteur_Message] }, { quoted: ms });
                }
              }
              break;

            default:
              console.log("❌ Type d'action inconnu:", settings.type);
          }
        } catch (e) {
          console.error("Erreur lors de l'action sur spam:", e);
        }

        messageStore[ms_org][auteur_Message] = userMsgs.slice(-1);
        console.log("Historique messages après traitement:", messageStore[ms_org][auteur_Message].map(m => m.id));
      }
    }

    console.log("=== Fin antispam ===");
  } catch (err) {
    console.error("Erreur dans Antispam:", err);
  }
}

module.exports = antispam;
