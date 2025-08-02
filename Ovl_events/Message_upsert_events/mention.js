const { getMention } = require("../../DataBase/mention");

async function mention(ovl, jid, ms, mtype, verif_Groupe, id_Bot, repondre) {
  try {
    const mentionedJid = getJid(ms.message?.[mtype]?.contextInfo?.mentionedJid, jid, ovl);
    if (mentionedJid && mentionedJid.includes(id_Bot)) {
      if (verif_Groupe) {
        const data = await getMention();

        if (data && data.mode === "oui") {
          const { url, text } = data;

          if (!url || url === "" || url === "url") {
            if (text && text !== "text") {
              repondre(text);
            } else {
              repondre("mention activé mais aucun contenu défini.");
            }
          } else {
            const lowerUrl = url.toLowerCase();
            const isAudio = lowerUrl.endsWith(".opus") || lowerUrl.endsWith(".ogg") || lowerUrl.endsWith(".mp3") || lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".aac") || lowerUrl.endsWith(".wav");
            const isImage = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png");
            const isVideo = lowerUrl.endsWith(".mp4");

            if (isAudio) {
              ovl.sendMessage(jid, {
                audio: { url },
                mimetype: "audio/mp4",
                ptt: true,
              }, { quoted: ms });
            } else {
              if (isImage) {
                ovl.sendMessage(jid, {
                  image: { url },
                  caption: (text && text !== "text") ? text : undefined,
                }, { quoted: ms });
              } else {
                if (isVideo) {
                  ovl.sendMessage(jid, {
                    video: { url },
                    caption: (text && text !== "text") ? text : undefined,
                  }, { quoted: ms });
                } else {
                  repondre("Le type de média est inconnu ou non pris en charge.");
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Erreur dans mention:", e);
    if (repondre) repondre("Ipossible d'exécuter la commande d'antimention.");
  }
}

module.exports = mention;
