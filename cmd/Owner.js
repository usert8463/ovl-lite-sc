const { ovlcmd } = require("../lib/ovlcmd");
const config = require('../set');
const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

ovlcmd(
  {
    nom_cmd: "delete",
    classe: "Owner",
    react: "🗑️",
    desc: "Supprimer un message.",
    alias: ["del", "dlt"]
  },
  async (ms_org, ovl, cmd_options) => {
    const { msg_Repondu, ms, auteur_Msg_Repondu, mtype, verif_Admin, verif_Ovl_Admin, verif_Groupe, dev_num, dev_id, repondre, id_Bot, prenium_id } = cmd_options;

    if (!msg_Repondu) return repondre("Veuillez répondre à un message pour le supprimer.");

    if (dev_num.includes(auteur_Msg_Repondu) && !dev_id)
      return repondre("Vous ne pouvez pas supprimer le message d'un développeur.");

    if (verif_Groupe) {
      if (!verif_Admin) return repondre("Vous devez être administrateur pour supprimer un message dans le groupe.");
      if (!verif_Ovl_Admin) return repondre("Je dois être administrateur pour effectuer cette action.");
    } else {
      if (!prenium_id) return repondre("Seuls les utilisateurs premium peuvent utiliser cette commande en privé.");
    }

    try {
      const key = {
        remoteJid: ms_org,
        fromMe: auteur_Msg_Repondu == id_Bot,
        id: ms.message?.[mtype]?.contextInfo?.stanzaId,
        ...(verif_Groupe && { participant: auteur_Msg_Repondu })
      };

      if (!key.id) return repondre("Impossible de trouver l'ID du message à supprimer.");

      await ovl.sendMessage(ms_org, { delete: key });
    } catch (error) {
      repondre(`Erreur : ${error.message}`);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "clear",
    classe: "Owner",
    react: "🧹",
    desc: "Supprime tous les messages dans cette discussion",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, prenium_id } = cmd_options;

    try {
      if (!prenium_id) {
        return repondre("🔒 Vous n'avez pas le droit d'exécuter cette commande.");
      }

      await ovl.chatModify(
        {
          delete: true,
          lastMessages: [
            {
              key: ms.key,
              messageTimestamp: ms.messageTimestamp,
            },
          ],
        },
        ms_org
      );

      await repondre("🧹 Tous les messages ont été supprimés avec succès.");
    } catch (e) {
      console.error("Erreur lors de la suppression :", e);
      repondre("❌ Erreur lors de la suppression des messages.");
    }
  }
);

ovlcmd(
    {
        nom_cmd: "tgs",
        classe: "Owner",
        react: "🔍",
        desc: "Importe des stickers Telegram sur WhatsApp",
    },
    async (ms_org, ovl, cmd_options) => {
        const { repondre, arg, prenium_id, ms } = cmd_options;

        if (!prenium_id) {
            return ovl.sendMessage(ms_org, { text: "❌ Vous n'avez pas le droit d'exécuter cette commande." });
        }

        if (!arg[0]) {
            return repondre("Merci de fournir un lien de stickers Telegram valide.");
        }

        const lien = arg[0];
        const nomStickers = lien.split("/addstickers/")[1];

        if (!nomStickers) {
            return repondre("❌ Lien incorrect.");
        }

        const TELEGRAM_TOKEN = "8408302436:AAFAKAtwCOywhSW0vqm9VNK71huTi8pUp1k";
        const urlAPI = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getStickerSet?name=${nomStickers}`;

        try {
            const { data } = await axios.get(urlAPI);
            const stickers = data.result.stickers;

            if (!stickers || stickers.length === 0) {
                return repondre("Aucun sticker trouvé dans cet ensemble.");
            }

            repondre(`✅ Nom du pack: ${data.result.name}\nType : ${data.result.is_animated ? "animés" : "statiques"}\nTotal : ${stickers.length} stickers\n`);

            for (const stickerData of stickers) {
                const fileInfo = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${stickerData.file_id}`);
                const stickerBuffer = await axios({
                    method: "get",
                    url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.data.result.file_path}`,
                    responseType: "arraybuffer",
                });

                const sticker = new Sticker(stickerBuffer.data, {
                    pack: config.STICKER_PACK_NAME,
                    author: config.STICKER_AUTHOR_NAME,
                    type: StickerTypes.FULL,
                    quality: 40
                });

                await ovl.sendMessage(ms_org, {
                    sticker: await sticker.toBuffer(),
                }, { quoted: ms });
            }

            repondre("✅ Tous les stickers ont été envoyés.");
        } catch (error) {
            console.error(error);
            repondre("❌ Une erreur s'est produite lors du téléchargement des stickers.");
        }
    }
);


ovlcmd(
  {
    nom_cmd: "jid",
    classe: "Owner",
    react: "🆔",
    desc: "Fournit le JID d'une personne ou d'un groupe",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, auteur_Msg_Repondu, prenium_id, msg_Repondu, arg, getJid } = cmd_options;

    if (!prenium_id) {
      return repondre("Seuls les utilisateurs prenium peuvent utiliser cette commande");
    }

    let cbl =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

    let jid;
    if (cbl) {
      jid = await getJid(cbl, ms_org, ovl);
    } else {
      jid = ms_org;
    }

    repondre(jid);
  }
);
