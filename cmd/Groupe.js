const { ovlcmd } = require("../lib/ovlcmd");
const fs = require("fs");

ovlcmd(
    {
        nom_cmd: "tagall",
        classe: "Groupe",
        react: "💬",
        desc: "Commande pour taguer tous les membres d'un groupe"
    },
    async (ms_org, ovl, cmd_options) => {
        try {
            const { ms, repondre, arg, mbre_membre, verif_Groupe, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

            if (!verif_Groupe) {
                return repondre("Cette commande ne fonctionne que dans les groupes");
            }

            const messageTexte = arg && arg.length > 0 ? arg.join(' ') : '';
            let tagMessage = `╭───〔  TAG ALL 〕───⬣\n`;
            tagMessage += `│👤 Auteur : *${nom_Auteur_Message}*\n`;
            tagMessage += `│💬 Message : *${messageTexte}*\n│\n`;

            mbre_membre.forEach(membre => {
                tagMessage += `│◦❒ @${membre.id.split("@")[0]}\n`;
            });
            tagMessage += `╰═══════════════⬣\n`;

            if (verif_Admin) {
                await ovl.sendMessage(ms_org, { text: tagMessage, mentions: mbre_membre.map(m => m.id) }, { quoted: ms });
            } else {
                repondre('Seuls les administrateurs peuvent utiliser cette commande');
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi du message avec tagall :", error);
        }
    });

ovlcmd(
    {
        nom_cmd: "tag",
        classe: "Groupe",
        react: "💬",
        desc: "partager un message à tous les membres d'un groupe"

    },
    async (dest, ovl, cmd_options) => {
        const { repondre, msg_Repondu, verif_Groupe, infos_Groupe, arg, verif_Admin, ms } = cmd_options;

        if (!verif_Groupe) {
            repondre("Cette commande ne fonctionne que dans les groupes");
            return;
        }

        if (verif_Admin) {
            let metadata_groupe = infos_Groupe;
            let membres_Groupe = metadata_groupe.participants.map(participant => participant.id);
            let contenu_msg;

            if (msg_Repondu) {
                if (msg_Repondu.imageMessage) {
                    let media_image = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
                    contenu_msg = {
                        image: { url: media_image },
                        caption: msg_Repondu.imageMessage.caption,
                        mentions: membres_Groupe
                    };
                } else if (msg_Repondu.videoMessage) {
                    let media_video = await ovl.dl_save_media_ms(msg_Repondu.videoMessage);
                    contenu_msg = {
                        video: { url: media_video },
                        caption: msg_Repondu.videoMessage.caption,
                        mentions: membres_Groupe
                    };
                } else if (msg_Repondu.audioMessage) {
                    let media_audio = await ovl.dl_save_media_ms(msg_Repondu.audioMessage);
                    contenu_msg = {
                        audio: { url: media_audio },
                        mimetype: 'audio/mp4',
                        mentions: membres_Groupe
                    };
                } else if (msg_Repondu.stickerMessage) {
                    let media_sticker = await ovl.dl_save_media_ms(msg_Repondu.stickerMessage);
                    let sticker_msg = new Sticker(media_sticker, {
                        pack: 'OVL-MD Hidtag',
                        type: StickerTypes.FULL,
                        quality: 80,
                        background: "transparent",
                    });
                    const sticker_buffer = await sticker_msg.toBuffer();
                    contenu_msg = { sticker: sticker_buffer, mentions: membres_Groupe };
                } else {
                    contenu_msg = {
                        text: msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text,
                        mentions: membres_Groupe
                    };
                }

                ovl.sendMessage(dest, contenu_msg, { quoted: ms });
            } else {
                if (!arg || !arg[0]) {
                    repondre("Veuillez inclure ou mentionner un message à partager.");
                    return;
                }

                ovl.sendMessage(dest, {
                    text: arg.join(' '),
                    mentions: membres_Groupe
                }, { quoted: ms });
            }
        } else {
            repondre("Cette commande est réservée aux administrateurs du groupe");
        }
    }
);

ovlcmd(
  {
    nom_cmd: "poll",
    classe: "Groupe",
    react: "📊",
    desc: "Crée un sondage dans le groupe(plusieurs votés autorisé).",
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { ms, repondre, arg, verif_Groupe, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

      if (!verif_Groupe) {
        return repondre("Cette commande ne fonctionne que dans les groupes.");
      }

      let [pollName, pollOptions] = arg.join(' ').split(';');

      if (!pollOptions) {
        return repondre("Veuillez fournir une question suivie des options, séparées par des virgules. Exemple : poll question;option1,option2,option3");
      }

      let options = pollOptions.split(',').map(option => option.trim()).filter(option => option.length > 0);

      if (options.length < 2) {
        return repondre("Le sondage doit contenir au moins deux options.");
      }
      
      if (verif_Admin) {
        await ovl.sendMessage(ms_org, {
          poll: {
            name: pollName,
            values: options,
          },
        }, { quoted: ms });
      } else {
        repondre('Seuls les administrateurs peuvent utiliser cette commande.');
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du sondage :", error);
      repondre("Une erreur est survenue lors de la création du sondage.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "poll2",
    classe: "Groupe",
    react: "📊",
    desc: "Crée un sondage dans le groupe(un seul vote autorisé).",
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { ms, repondre, arg, verif_Groupe, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

      if (!verif_Groupe) {
        return repondre("Cette commande ne fonctionne que dans les groupes.");
      }

      let [pollName, pollOptions] = arg.join(' ').split(';');

      if (!pollOptions) {
        return repondre("Veuillez fournir une question suivie des options, séparées par des virgules. Exemple : poll question;option1,option2,option3");
      }

      let options = pollOptions.split(',').map(option => option.trim()).filter(option => option.length > 0);

      if (options.length < 2) {
        return repondre("Le sondage doit contenir au moins deux options.");
      }
      
      if (verif_Admin) {
        await ovl.sendMessage(ms_org, {
          poll: {
            name: pollName,
            values: options,
            selectableCount: 1,
          },
        }, { quoted: ms });
      } else {
        repondre('Seuls les administrateurs peuvent utiliser cette commande.');
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du sondage :", error);
      repondre("Une erreur est survenue lors de la création du sondage.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "kick",
    classe: "Groupe",
    react: "🛑",
    desc: "Supprime un membre du groupe.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, getJid, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, verif_Ovl_Admin, prenium_id, dev_num, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (prenium_id || verif_Admin) {
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.jid);
    const cbl = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    const membre = await getJid(cbl, ms_org, ovl);
        if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

     if (!membre || !membres.find((m) => m.jid === membre))
      return ovl.sendMessage(ms_org, { text: "Membre introuvable dans ce groupe." }, { quoted: ms });
    if (admins.includes(membre))
      return ovl.sendMessage(ms_org, { text: "Impossible d'exclure un administrateur du groupe." }, { quoted: ms });
    if (dev_num.includes(membre)) {
      return ovl.sendMessage(ms_org, { text: "Vous ne pouvez pas exclure un développeur." }, { quoted: ms });
    }
    try {
      await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
      ovl.sendMessage(ms_org, { text: `@${membre.split("@")[0]} a été exclu.`, mentions: [membre] }, { quoted: ms });
    } catch (err) {
      console.error("Erreur :", err);
      ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de l'exclusion." }, { quoted: ms });
    }
    } else { return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'utiliser cette commande." }, { quoted: ms });
           };
  }
);

ovlcmd(
  {
    nom_cmd: "promote",
    classe: "Groupe",
    react: "⬆️",
    desc: "Promouvoir un membre comme administrateur.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, auteur_Msg_Repondu, arg, getJid, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin || prenium_id) {
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.jid);
    const cbl = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    const membre = await getJid(cbl, ms_org, ovl);
    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    if (!membre) return ovl.sendMessage(ms_org, { text: "Veuillez mentionner un membre à promouvoir." }, { quoted: ms });
    if (!membres.find((m) => m.jid === membre))
      return ovl.sendMessage(ms_org, { text: "Membre introuvable dans ce groupe." }, { quoted: ms });
    if (admins.includes(membre))
      return ovl.sendMessage(ms_org, { text: "ce membre est déjà un administrateur du groupe." }, { quoted: ms });

    try {
      await ovl.groupParticipantsUpdate(ms_org, [membre], "promote");
      ovl.sendMessage(ms_org, { text: `@${membre.split("@")[0]} a été promu administrateur.`, mentions: [membre] }, { quoted: ms });
    } catch (err) {
      console.error("Erreur :", err);
      ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de la promotion." }, { quoted: ms });
    }
    } else { return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'utiliser cette commande." }, { quoted: ms });
           }
  }
);

ovlcmd(
  {
    nom_cmd: "demote",
    classe: "Groupe",
    react: "⬇️",
    desc: "Retirer le rôle d'administrateur à un membre.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, getJid, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, dev_num, dev_id, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin || prenium_id) { 
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.jid);
    const cbl = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    const membre = await getJid(cbl, ms_org, ovl);
    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    if (!membre) return ovl.sendMessage(ms_org, { text: "Veuillez mentionner un membre à rétrograder." }, { quoted: ms });
    if (!membres.find((m) => m.jid === membre))
      return ovl.sendMessage(ms_org, { text: "Membre introuvable dans ce groupe." });
    if (!admins.includes(membre))
      return ovl.sendMessage(ms_org, { text: "ce membre n'est pas un administrateur du groupe." }, { quoted: ms });
    
      if (dev_num.includes(membre)) {
      return ovl.sendMessage(ms_org, { text: "Vous ne pouvez pas rétrograder un développeur." }, { quoted: ms });
    }

    try {
      await ovl.groupParticipantsUpdate(ms_org, [membre], "demote");
      ovl.sendMessage(ms_org, { text: `@${membre.split("@")[0]} a été rétrogradé.`, mentions: [membre] }, { quoted: ms });
    } catch (err) {
      console.error("Erreur :", err);
      ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de la rétrogradation." }, { quoted: ms });
    }
    } else { return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'utiliser cette commande." }, { quoted: ms });
           }
  }
);

ovlcmd(
  {
    nom_cmd: "close",
    classe: "Groupe",
    react: "✅",
    desc: "Seuls les admins peuvent envoyer des messages",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) 
      return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je n'ai pas les droits requis pour exécuter cette commande." }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "announcement");
    return ovl.sendMessage(jid, { text: "Mode défini : seuls les admins peuvent envoyer des messages." }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "open",
    classe: "Groupe",
    react: "✅",
    desc: "Tout le monde peut envoyer des messages",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) 
      return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je n'ai pas les droits requis pour exécuter cette commande." }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "not_announcement");
    return ovl.sendMessage(jid, { text: "Mode défini : tout le monde peut envoyer des messages." }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "leave",
    classe: "Groupe",
    react: "😐",
    desc: "Commande pour quitter un groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { prenium_id } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: "Vous n'avez pas les permissions requises pour quitter ce groupe." }, { quoted: cmd_options.ms });
    }
    await ovl.sendMessage(jid, { text: "Sayonara" }, { quoted: cmd_options.ms });
    await ovl.groupLeave(jid);
  }
);

ovlcmd(
  {
    nom_cmd: "link",
    classe: "Groupe",
    react: "🔗",
    desc: "Permet d'obtenir le lien d'invitation d'un groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin && verif_Ovl_Admin) {
      const code = await ovl.groupInviteCode(jid);
      await ovl.sendMessage(jid, { text: `Lien d'invitation: https://chat.whatsapp.com/${code}` }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "revoke",
    classe: "Groupe",
    react: "🔗",
    desc: "Réinitialise le lien d'invitation d'un groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin && verif_Ovl_Admin) {
      await ovl.groupRevokeInvite(jid);
      await ovl.sendMessage(jid, { text: 'Le lien d\'invitation a été Réinitialisé.' }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "join",
    classe: "Groupe",
    react: "😶‍🌫",
    desc: "Permet de rejoindre un groupe via un lien d'invitation",
  },
  async (jid, ovl, cmd_options) => {
    const { prenium_id, arg, ms } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: `Vous n'avez pas les permissions requises pour rejoindre un groupe.` }, { quoted: ms });
    }
    if (!arg) return ovl.sendMessage(jid, { text: 'Veuillez fournir le lien d\'invitation du groupe.' }, { quoted: ms });
    const invite = arg.join("");
    const code = invite.split('/')[3];
    await ovl.groupAcceptInvite(code);
    await ovl.sendMessage(jid, { text: 'Vous avez rejoint le groupe avec succès.' }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "getpp",
    classe: "Groupe",
    react: "🔎",
    desc: "Affiche la pp d'un groupe",
    alias: ["gpp"]
  },
  async (jid, ovl, cmd_options) => {
    try {
      const ppgroup = await ovl.profilePictureUrl(jid, 'image');
      await ovl.sendMessage(jid, { image: { url: ppgroup } }, { quoted: cmd_options.ms });
    } catch (error) {
      console.error("Erreur lors de l'obtention de la photo de profil :", error);
      await ovl.sendMessage(jid, "Désolé, je n'ai pas pu obtenir la photo de profil du groupe.", { quoted: cmd_options.ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "updatepp",
    classe: "Groupe",
    react: "🎨",
    desc: "Commande pour changer la photo de profil d'un groupe",
    alias: ["upp"]
  },
  async (jid, ovl, cmd_options) => {
    const { arg, verif_Groupe, msg_Repondu, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;

    if (!(verif_Admin || prenium_id)) {
      return ovl.sendMessage(jid, { text: `Vous n'avez pas les permissions requises pour modifier la photo du groupe.` }, { quoted: ms });
    }

    if (!verif_Ovl_Admin) {
      return ovl.sendMessage(jid, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    }

    if (!msg_Repondu || !msg_Repondu.imageMessage) {
      return ovl.sendMessage(jid, { text: `Mentionnez une image.` }, { quoted: ms });
    }

    try {
      if (msg_Repondu?.imageMessage) {
        const img = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
        await ovl.updateProfilePicture(jid, { url: img });
        ovl.sendMessage(jid, { text: "✅ La photo de profil du groupe a été mise à jour avec succès." }, { quoted: ms });
    } }catch (error) {
      console.error("Erreur lors du changement de PP :", error);
      ovl.sendMessage(jid, { text: "❌ Une erreur est survenue lors de la modification de la photo du groupe." }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "removepp",
    classe: "Groupe",
    react: "🗑️",
    desc: "Commande pour supprimer la photo de profil d'un groupe",
    alias: ["rpp"]
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;

    if (!(verif_Admin || prenium_id)) {
      return ovl.sendMessage(jid, { text: `Vous n'avez pas les permissions requises pour supprimer la photo du groupe.` }, { quoted: ms });
    }

    if (!verif_Ovl_Admin) {
      return ovl.sendMessage(jid, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    }

    try {
      await ovl.removeProfilePicture(jid);
      ovl.sendMessage(jid, { text: "✅ La photo de profil du groupe a été supprimée avec succès." }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de la suppression de la PP :", error);
      ovl.sendMessage(jid, { text: "❌ Une erreur est survenue lors de la suppression de la photo du groupe." }, { quoted: ms });
    }
  }
);
