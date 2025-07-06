const { ovlcmd } = require("../lib/ovlcmd");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { Antilink } = require("../DataBase/antilink");
const { Antitag } = require("../DataBase/antitag");
const { Antibot } = require("../DataBase/antibot");
const { GroupSettings, Events2 } = require("../DataBase/events");
const fs = require("fs");
const { Antimention } = require('../DataBase/antimention');

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
        nom_cmd: "tagadmin",
        classe: "Groupe",
        react: "💬",
        desc: "Commande pour taguer tous les administrateurs d'un groupe"
    },
    async (ms_org, ovl, cmd_options) => {
        try {
            const { ms, repondre, arg, verif_Groupe, mbre_membre, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

            if (!verif_Groupe) {
                return repondre("Cette commande ne fonctionne que dans les groupes");
            }

            const messageTexte = arg && arg.length > 0 ? arg.join(' ') : '';
            const adminsGroupe = mbre_membre.filter(membre => membre.admin).map(membre => membre.id);

            if (adminsGroupe.length === 0) {
                return repondre("Aucun administrateur trouvé dans ce groupe.");
            }

            let tagMessage = `╭───〔  TAG ADMINS 〕───⬣\n`;
            tagMessage += `│👤 Auteur : *${nom_Auteur_Message}*\n`;
            tagMessage += `│💬 Message : *${messageTexte}*\n│\n`;

            mbre_membre.forEach(membre => {
                if (membre.admin) {
                    tagMessage += `│◦❒ @${membre.id.split("@")[0]}\n`;
                }
            });
            tagMessage += `╰═══════════════⬣\n`;

            if (verif_Admin) {
                await ovl.sendMessage(ms_org, { text: tagMessage, mentions: adminsGroupe }, { quoted: ms });
            } else {
                repondre('Seuls les administrateurs peuvent utiliser cette commande');
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi du message avec tagadmins :", error);
        }
    });

ovlcmd(
  {
    nom_cmd: "tag",
    classe: "Groupe",
    react: "💬",
    desc: "partager un message à tous les membres d'un groupe"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, mbre_membre, msg_Repondu, verif_Groupe, arg, verif_Admin, ms } = cmd_options;

    if (!verif_Groupe) {
      return repondre("❌ Cette commande ne fonctionne que dans les groupes.");
    }

    if (!verif_Admin) {
      return repondre("❌ Cette commande est réservée aux administrateurs du groupe.");
    }

    try {
      let contenu_msg;

      if (msg_Repondu) {
        if (msg_Repondu.imageMessage) {
          let media_image = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
          contenu_msg = {
            image: { url: media_image },
            caption: msg_Repondu.imageMessage.caption,
            mentions: mbre_membre
          };
        } else if (msg_Repondu.videoMessage) {
          let media_video = await ovl.dl_save_media_ms(msg_Repondu.videoMessage);
          contenu_msg = {
            video: { url: media_video },
            caption: msg_Repondu.videoMessage.caption,
            mentions: mbre_membre
          };
        } else if (msg_Repondu.audioMessage) {
          let media_audio = await ovl.dl_save_media_ms(msg_Repondu.audioMessage);
          contenu_msg = {
            audio: { url: media_audio },
            mimetype: 'audio/mp4',
            mentions: mbre_membre
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
          contenu_msg = { sticker: sticker_buffer, mentions: mbre_membre };
        } else if (msg_Repondu.pollCreationMessageV3) {
          const poll = msg_Repondu.pollCreationMessageV3;
          const options = poll.options.map(opt => opt.text);
          const titre = poll.name || "Sondage";

          contenu_msg = {
            poll: {
              name: titre,
              values: options,
              selectableCount: poll.selectableOptionsCount || 1,
            },
            mentions: mbre_membre,
          };
        } else {
          contenu_msg = {
            text: msg_Repondu.conversation || "*[message vide]*",
            mentions: mbre_membre
          };
        }

        await ovl.sendMessage(ms_org, contenu_msg, { quoted: ms });

      } else {
        if (!arg || !arg[0]) {
          return repondre("❗ Veuillez inclure un message à partager ou répondre à un message.");
        }

        await ovl.sendMessage(ms_org, {
          text: arg.join(' '),
          mentions: mbre_membre
        }, { quoted: ms });
      }

    } catch (err) {
      console.error("❌ Erreur dans la commande tag :", err);
      repondre("❌ Une erreur est survenue lors de l'envoi du message.");
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
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, verif_Ovl_Admin, prenium_id, dev_num, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (prenium_id || verif_Admin) {
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.id);
    const membre = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    
        if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

     if (!membre || !membres.find((m) => m.id === membre))
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
    nom_cmd: "kickall",
    classe: "Groupe",
    react: "🛑",
    desc: "Supprime tous les membres non administrateurs du groupe.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, infos_Groupe, prenium_id, dev_num, ms, auteur_Message } = cmd_options;
    
    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    const membres = infos_Groupe.participants;
    const createur = membres[0]?.id;

    if (!(prenium_id || auteur_Message === createur))
      return ovl.sendMessage(ms_org, { text: "Seuls le créateur du groupe ou un utilisateur premium peuvent utiliser cette commande." }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

    const settings = await GroupSettings.findOne({ where: { id: ms_org } });
    if (settings?.goodbye === "oui")
      return ovl.sendMessage(ms_org, { text: "Désactivez le goodbye message (goodbye off) avant de continuer." }, { quoted: ms });

    const nonAdmins = membres.filter(m => !m.admin && !dev_num.includes(m.id)).map(m => m.id);

    if (nonAdmins.length === 0)
      return ovl.sendMessage(ms_org, { text: "Aucun membre non administrateur à exclure." }, { quoted: ms });

    for (const membre of nonAdmins) {
      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Erreur exclusion ${membre} :`, err);
      }
    }

    ovl.sendMessage(ms_org, { text: `✅ ${nonAdmins.length} membre(s) ont été exclus.` }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "ckick",
    classe: "Groupe",
    react: "🛑",
    desc: "Supprime tous les membres non administrateurs dont le JID commence par un indicatif spécifique.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, verif_Ovl_Admin, infos_Groupe, arg, dev_num, prenium_id, ms, auteur_Message } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    const membres = infos_Groupe.participants;
    const createur = membres[0]?.jid;

    if (!(prenium_id || auteur_Message === createur))
      return ovl.sendMessage(ms_org, { text: "Seuls le créateur du groupe ou un utilisateur premium peuvent utiliser cette commande." }, { quoted: ms });

    if (!arg[0])
      return ovl.sendMessage(ms_org, { text: "Veuillez spécifier l'indicatif." }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

    const settings = await GroupSettings.findOne({ where: { id: ms_org } });
    if (settings?.goodbye === "oui")
      return ovl.sendMessage(ms_org, { text: "Désactivez le goodbye message (goodbye off) avant de continuer." }, { quoted: ms });

    const indicatif = arg[0];
    const membresToKick = membres
      .filter(m => m.jid.startsWith(indicatif) && !m.admin && !dev_num.includes(m.jid))
      .map(m => m.jid);

    if (membresToKick.length === 0)
      return ovl.sendMessage(ms_org, { text: `Aucun membre non admin avec l'indicatif ${indicatif}.` }, { quoted: ms });

    for (const membre of membresToKick) {
      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (err) {
        console.error(`Erreur exclusion ${membre} :`, err);
      }
    }

    ovl.sendMessage(ms_org, { text: `✅ ${membresToKick.length} membre(s) avec l'indicatif ${indicatif} ont été exclus.` }, { quoted: ms });
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
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin || prenium_id) {
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.id);
    const membre = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    
    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    if (!membre) return ovl.sendMessage(ms_org, { text: "Veuillez mentionner un membre à promouvoir." }, { quoted: ms });
    if (!membres.find((m) => m.id === membre))
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
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, dev_num, dev_id, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });
    if (verif_Admin || prenium_id) { 
    const membres = await infos_Groupe.participants;
    const admins = membres.filter((m) => m.admin).map((m) => m.id);
    const membre = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
     
    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });
    if (!membre) return ovl.sendMessage(ms_org, { text: "Veuillez mentionner un membre à rétrograder." }, { quoted: ms });
    if (!membres.find((m) => m.id === membre))
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
    nom_cmd: "del",
    classe: "Groupe",
    react: "🗑️",
    desc: "Supprimer un message.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { msg_Repondu, ms, auteur_Msg_Repondu, verif_Admin, verif_Ovl_Admin, verif_Groupe, dev_num, dev_id, repondre, id_Bot, prenium_id } = cmd_options;

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
        fromMe: auteur_Msg_Repondu === id_Bot,
        id: ms.message.extendedTextMessage?.contextInfo?.stanzaId,
        participant: auteur_Msg_Repondu,
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
    classe: "Groupe",
    react: "🧹",
    desc: "Efface un message dans un groupe (uniquement premium)"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, verif_Groupe, auteur_Message, prenium_id, id_Bot } = cmd_options;

    if (!verif_Groupe) return repondre("Cette commande fonctionne uniquement en groupe.");

    if (!prenium_id) {
      return repondre("Cette commande est réservée aux utilisateurs premium.");
    }
 
    try {
      await ovl.chatModify(
        {
          clear: {
            messages: [
              {
                id: ms.key.id,
                fromMe: true,
                timestamp: ms.messageTimestamp.low
              }
            ]
          }
        },
        ms_org
      );
      repondre("✅ Tous les Messages ont été effacés avec succès.");
    } catch {
      repondre("❌ Erreur lors de la suppression des messages.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gcreate",
    classe: "Groupe",
    react: "✅",
    desc: "Crée un groupe avec juste toi comme membre.",
  },
  async (jid, ovl, { arg, prenium_id, ms }) => {
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: `❌ Vous n'avez pas les permissions pour créer un groupe.` }, { quoted: ms });
    }

    if (arg.length === 0) {
      return ovl.sendMessage(jid, {
        text: `⚠️ Veuillez fournir un nom pour le groupe. Exemple : *gcreate MonGroupe*`,
      }, { quoted: ms });
    }

    const name = arg.join(" ");

    try {
      const group = await ovl.groupCreate(name, []);
      await ovl.sendMessage(group.id, {
        text: `🎉 Groupe *"${name}"* créé avec succès !`,
      }, { quoted: ms });
    } catch (err) {
      console.error("❌ Erreur lors de la création du groupe :", err);
      await ovl.sendMessage(jid, {
        text: `❌ Une erreur est survenue lors de la création du groupe.`,
      }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gdesc",
    classe: "Groupe",
    react: "🔤",
    desc: "Permet de changer la description d'un groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, msg_Repondu, arg, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (verif_Admin && verif_Ovl_Admin) {
      let desc;
      if (msg_Repondu) {
        desc = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
      } else if (arg) {
        desc = arg.join(' ');
      } else {
        return ovl.sendMessage(jid, { text: "Entrez la nouvelle description." }, { quoted: ms });
      }

      await ovl.groupUpdateDescription(jid, desc);
    } else { ovl.sendMessage(jid, { text: 'je n\'ai pas les droits requis pour exécuter cette commande' }, { quoted: ms }) }
  }
);

ovlcmd(
  {
    nom_cmd: "gname",
    classe: "Groupe",
    react: "🔤",
    desc: "Permet de changer le nom d'un groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, msg_Repondu, arg, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (verif_Admin && verif_Ovl_Admin) {
      let name;
      if (msg_Repondu) {
        name = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
      } else if (arg) {
        name = arg.join(' ');
      } else {
        return ovl.sendMessage(jid, { text: "Entrez un nouveau nom" }, { quoted: ms });
      }

      await ovl.groupUpdateSubject(jid, name);
    } else { ovl.sendMessage(jid, { text: 'je n\'ai pas les droits requis pour exécuter cette commande' }, { quoted: ms }) }
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
    nom_cmd: "lock",
    classe: "Groupe",
    react: "✅",
    desc: "Tout le monde peut modifier les paramètres du groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) 
      return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je n'ai pas les droits requis pour exécuter cette commande." }, { quoted: ms });
      
    await ovl.groupSettingUpdate(jid, "unlocked");
    return ovl.sendMessage(jid, { text: "Mode défini : tout le monde peut modifier les paramètres du groupe." }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "unlock",
    classe: "Groupe",
    react: "✅",
    desc: "Seuls les admins peuvent modifier les paramètres du groupe",
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) 
      return ovl.sendMessage(jid, { text: "Commande utilisable uniquement dans les groupes." }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je n'ai pas les droits requis pour exécuter cette commande." }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "locked");
    return ovl.sendMessage(jid, { text: "Mode défini : seuls les admins peuvent modifier les paramètres du groupe." }, { quoted: ms });
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
    nom_cmd: "ginfo",
    classe: "Groupe",
    react: "🔎",
    desc: "Affiche les informations du groupe",
  },
  async (jid, ovl, cmd_options) => {
    const metadata = await ovl.groupMetadata(jid);
    await ovl.sendMessage(jid, { text: `ID: ${metadata.id}\nNom: ${metadata.subject}\nDescription: ${metadata.desc}` }, { quoted: cmd_options.ms });
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
    nom_cmd: "acceptall",
    classe: "Groupe",
    react: "✅",
    desc: "Accepter toutes les demandes en attente d'un groupe",
  },
  async (jid, ovl, { verif_Admin, prenium_id, verif_Ovl_Admin, verif_Groupe, ms }) => {
    if (!verif_Groupe)
      return ovl.sendMessage(jid, { text: "Commande réservée aux groupes uniquement." }, { quoted: ms });

    if (!verif_Admin && !prenium_id)
      return ovl.sendMessage(jid, { text: "Vous n'avez pas les permissions pour utiliser cette commande." }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

    try {
      const demandes = await ovl.groupRequestParticipantsList(jid);
      if (!demandes || demandes.length === 0)
        return ovl.sendMessage(jid, { text: "Aucune demande en attente." }, { quoted: ms });

      const numeros = demandes.map(d => d.phone_number);
      await ovl.groupRequestParticipantsUpdate(jid, numeros, "approve");

      ovl.sendMessage(jid, { text: `✅ ${numeros.length} demande(s) acceptée(s).` }, { quoted: ms });
    } catch (err) {
      console.error(err);
      ovl.sendMessage(jid, { text: "❌ Erreur lors de l'acceptation des demandes." }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "rejectall",
    classe: "Groupe",
    react: "❌",
    desc: "Rejeter toutes les demandes en attente d'un groupe",
  },
  async (jid, ovl, { verif_Admin, prenium_id, verif_Ovl_Admin, verif_Groupe, ms }) => {
    if (!verif_Groupe)
      return ovl.sendMessage(jid, { text: "Commande réservée aux groupes uniquement." }, { quoted: ms });

    if (!verif_Admin && !prenium_id)
      return ovl.sendMessage(jid, { text: "Vous n'avez pas les permissions pour utiliser cette commande." }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: "Je dois être administrateur pour effectuer cette action." }, { quoted: ms });

    try {
      const demandes = await ovl.groupRequestParticipantsList(jid);
      if (!demandes || demandes.length === 0)
        return ovl.sendMessage(jid, { text: "Aucune demande en attente." }, { quoted: ms });

      const numeros = demandes.map(d => d.phone_number);
      await ovl.groupRequestParticipantsUpdate(jid, numeros, "reject");

      ovl.sendMessage(jid, { text: `❌ ${numeros.length} demande(s) rejetée(s).` }, { quoted: ms });
    } catch (err) {
      console.error(err);
      ovl.sendMessage(jid, { text: "❌ Erreur lors du rejet des demandes." }, { quoted: ms }); 
    }
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


ovlcmd(
  {
    nom_cmd: "vcf",
    classe: "Groupe",
    react: "📇",
    desc: "Enregistre les contacts de tous les membres du groupe dans un fichier VCF",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, ms } = cmd_options;

    try {
      if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: "Cette commande doit être utilisée dans un groupe." }, { quoted: ms });
        
      const groupMetadata = await ovl.groupMetadata(ms_org).catch((e) => null);

      if (!groupMetadata || !groupMetadata.participants) {
        return ovl.sendMessage(ms_org, { text: 'Échec de la récupération des métadonnées du groupe ou de la liste des participants.' }, { quoted: ms });
      }

      const participants = groupMetadata.participants;
      const vcfData = [];

      for (const participant of participants) {
        const number = participant.jid.split('@')[0];
        vcfData.push(`BEGIN:VCARD\nVERSION:3.0\nFN:${number}\nTEL;TYPE=CELL:${number}\nEND:VCARD`);
      }

      const groupName = groupMetadata.subject || `Groupe ${ms_org.key.remoteJid}`;
      const vcfFileName = `contacts_groupe_${groupName}.vcf`;
      const vcfFilePath = `./${vcfFileName}`;
      
      fs.writeFileSync(vcfFilePath, vcfData.join('\n'));

      const message = `*TOUS LES CONTACTS DES MEMBRES ENREGISTRÉS*\nGroupe : *${groupName}*\nContacts : *${participants.length}*`;

      const vcfFile = fs.readFileSync(vcfFilePath);
      await ovl.sendMessage(ms_org, { document: vcfFile, mimetype: 'text/vcard', filename: vcfFileName, caption: message }, { quoted: ms });

      fs.unlinkSync(vcfFilePath); 
    } catch (error) {
      console.error('Erreur lors du traitement de la commande vcf:', error);
      return ovl.sendMessage(ms_org, { text: 'Une erreur est survenue lors du traitement de la commande vcf.' }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antilink",
    classe: "Groupe",
    react: "🔗",
    desc: "Active ou configure l'antilink pour les groupes",
  },
  async (jid, ovl, cmd_options) => {
      const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      
      if (!verif_Groupe) {
        return repondre("Cette commande ne fonctionne que dans les groupes");
      }

      if (!verif_Admin) {
        return repondre("Seuls les administrateurs peuvent utiliser cette commande");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antilink.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode) {
          return repondre(`L'Antilink est déjà ${sousCommande}`);
        }
        settings.mode = newMode;
        await settings.save();
        return repondre(`L'Antilink ${sousCommande === 'on' ? 'activé' : 'désactivé'} avec succès !`);
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui') {
          return repondre("Veuillez activer l'antilink d'abord en utilisant `antilink on`");
        }
        if (settings.type === sousCommande) {
          return repondre(`L'action antilink est déjà définie sur ${sousCommande}`);
        }
        settings.type = sousCommande;
        await settings.save();
        return repondre(`L'Action de l'antilink définie sur ${sousCommande} avec succès !`);
      }

      return repondre(
        "Utilisation :\n" +
        "antilink on/off: Activer ou désactiver l'antilink\n" +
        "antilink supp/warn/kick: Configurer l'action antilink"
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antilink :", error);
      repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antitag",
    classe: "Groupe",
    react: "🔗",
    desc: "Active ou configure l'antitag pour les groupes",
  },
  async (jid, ovl, cmd_options) => {
      const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      
      if (!verif_Groupe) {
        return repondre("Cette commande ne fonctionne que dans les groupes");
      }

      if (!verif_Admin) {
        return repondre("Seuls les administrateurs peuvent utiliser cette commande");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antitag.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode) {
          return repondre(`L'Antitag est déjà ${sousCommande}`);
        }
        settings.mode = newMode;
        await settings.save();
        return repondre(`L'Antitag ${sousCommande === 'on' ? 'activé' : 'désactivé'} avec succès !`);
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui') {
          return repondre("Veuillez activer l'antitag d'abord en utilisant `antitag on`");
        }
        if (settings.type === sousCommande) {
          return repondre(`L'action antitag est déjà définie sur ${sousCommande}`);
        }
        settings.type = sousCommande;
        await settings.save();
        return repondre(`L'Action de l'antitag définie sur ${sousCommande} avec succès !`);
      }

      return repondre(
        "Utilisation :\n" +
        "antitag on/off: Activer ou désactiver l'antitag\n" +
        "antitag supp/warn/kick: Configurer l'action antitag"
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antitag :", error);
      repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antibot",
    classe: "Groupe",
    react: "🔗",
    desc: "Active ou configure l'antibot pour les groupes",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, verif_Admin } = cmd_options;

    try {
      if (!verif_Groupe) {
        return repondre("❌ Cette commande fonctionne uniquement dans les groupes.");
      }

      if (!verif_Admin) {
        return repondre("❌ Seuls les administrateurs peuvent utiliser cette commande.");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ["on", "off"];
      const validTypes = ["supp", "warn", "kick"];

      const [settings] = await Antibot.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: "non", type: "supp" },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === "on" ? "oui" : "non";
        if (settings.mode === newMode) {
          return repondre(`L'Antibot est déjà ${sousCommande}.`);
        }
        settings.mode = newMode;
        await settings.save();
        return repondre(`L'Antibot a été ${sousCommande === "on" ? "activé" : "désactivé"} avec succès !`);
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== "oui") {
          return repondre("❌ Veuillez activer l'antibot d'abord avec `antibot on`.");
        }
        if (settings.type === sousCommande) {
          return repondre(`⚠️ L'action antibot est déjà définie sur ${sousCommande}.`);
        }
        settings.type = sousCommande;
        await settings.save();
        return repondre(`✅ L'action antibot est maintenant définie sur ${sousCommande}.`);
      }

      return repondre(
        "Utilisation :\n" +
          "antibot on/off : Activer ou désactiver l'antibot.\n" +
          "antibot supp/warn/kick : Configurer l'action antibot."
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antibot :", error);
      return repondre("❌ Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antimentiongc",
    classe: "Groupe",
    react: "📢",
    desc: "Active ou configure l'antimention pour les groupes",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;

    try {
      if (!verif_Groupe) {
        return repondre("Cette commande ne fonctionne que dans les groupes.");
      }

      if (!verif_Admin) {
        return repondre("Seuls les administrateurs peuvent utiliser cette commande.");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antimention.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode) {
          return repondre(`L'antimention est déjà ${sousCommande}.`);
        }
        settings.mode = newMode;
        await settings.save();
        return repondre(`L'antimention a été ${sousCommande === 'on' ? 'activé' : 'désactivé'} avec succès.`);
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui') {
          return repondre("Veuillez d'abord activer l'antimention avec `antimention on`.");
        }
        if (settings.type === sousCommande) {
          return repondre(`L'action antimention est déjà définie sur ${sousCommande}.`);
        }
        settings.type = sousCommande;
        await settings.save();
        return repondre(`Action antimention définie sur ${sousCommande} avec succès.`);
      }

      return repondre(
        "Utilisation :\n" +
        "- antimention on/off : Activer ou désactiver l'antimention\n" +
        "- antimention supp/warn/kick : Définir l'action à appliquer"
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antimention :", error);
      return repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

const welcomeGoodbyeCmd = (type) => {
  const nom_cmd = type;
  const isWelcome = type === "welcome";
  const desc = isWelcome ? "Configurer ou activer les messages de bienvenue" : "Configurer ou activer les messages d’adieu";

  return {
    nom_cmd,
    classe: "Groupe",
    react: "👋",
    desc,
    async execute(jid, ovl, { repondre, arg, verif_Admin, verif_Groupe, auteurMessage }) {
      try {
        if (!verif_Groupe) return repondre("❌ Commande utilisable uniquement dans les groupes.");
        if (!verif_Admin) return repondre("❌ Seuls les administrateurs peuvent utiliser cette commande.");

        const sub = arg[0]?.toLowerCase();

        const [settings] = await GroupSettings.findOrCreate({
          where: { id: jid },
          defaults: { id: jid, [type]: "non" },
        });

        const [eventData] = await Events2.findOrCreate({
          where: { id: jid },
          defaults: { id: jid },
        });

        const fieldName = isWelcome ? "welcome_msg" : "goodbye_msg";
        const msgValue = eventData[fieldName];

        if (!arg.length) {
          return repondre(`🛠️ *Utilisation de la commande ${type}* :

1️⃣ *${type} on/off* – Active ou désactive les messages de ${isWelcome ? "bienvenue" : "d’adieu"}.
2️⃣ *${type} get* – Affiche le message ${isWelcome ? "de bienvenue" : "d’adieu"} personnalisé.
3️⃣ *${type} Votre message...* – Définir un message personnalisé.

📌 Variables disponibles :
@user → Mention du membre
#groupe → Nom du groupe
#membre → Nombre de membres
#desc → Description du groupe
#url=lien → Utilise un média (image, vidéo)
#pp → Utilise la photo de profil du membre
#gpp → Utilise la photo de profil du groupe`);
        }

        if (["on", "off"].includes(sub)) {
          const mode = sub === "on" ? "oui" : "non";
          if (settings[type] === mode) {
            return repondre(`ℹ️ Le message ${isWelcome ? "de bienvenue" : "d’adieu"} est déjà ${sub === "on" ? "activé" : "désactivé"}.`);
          }
          settings[type] = mode;
          await settings.save();
          return repondre(`✅ Message ${isWelcome ? "de bienvenue" : "d’adieu"} ${sub === "on" ? "activé" : "désactivé"} avec succès.`);
        }

        if (sub === "get") {
          if (!msgValue || !msgValue.trim()) {
            return repondre(`⚠️ Aucun message ${isWelcome ? "de bienvenue" : "d’adieu"} personnalisé configuré.`);
          }

          const groupInfo = await ovl.groupMetadata(jid);
          const groupName = groupInfo.subject || "Groupe";
          const totalMembers = groupInfo.participants.length;
          const groupDesc = groupInfo.desc || "Aucune description";
          const userMention = `@${auteurMessage.split("@")[0]}`;

          let msg = msgValue;

          const mediaMatch = msg.match(/#url=(\S+)/i);
          const usePP = msg.includes("#pp");
          const useGPP = msg.includes("#gpp");

          msg = msg
            .replace(/#url=\S+/i, "")
            .replace(/#pp/gi, "")
            .replace(/#gpp/gi, "")
            .replace(/@user/gi, userMention)
            .replace(/#groupe/gi, groupName)
            .replace(/#membre/gi, totalMembers)
            .replace(/#desc/gi, groupDesc)
            .replace(/#url/gi, "");

          let media = null;

          if (mediaMatch) {
            const url = mediaMatch[1];
            const ext = url.split(".").pop().toLowerCase();
            if (["mp4", "mov", "webm"].includes(ext)) {
              media = { video: { url }, caption: msg.trim(), mentions: [auteurMessage] };
            } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
              media = { image: { url }, caption: msg.trim(), mentions: [auteurMessage] };
            }
          } else if (usePP) {
            const profileUrl = await ovl.profilePictureUrl(auteurMessage, "image").catch(() => "https://wallpapercave.com/uwp/uwp4820694.jpeg");
            media = { image: { url: profileUrl }, caption: msg.trim(), mentions: [auteurMessage] };
          } else if (useGPP) {
            let gpp = null;
            try {
              gpp = await ovl.profilePictureUrl(jid, "image");
            } catch {
              gpp = await ovl.profilePictureUrl(auteurMessage, "image").catch(() => "https://wallpapercave.com/uwp/uwp4820694.jpeg");
            }
            media = { image: { url: gpp }, caption: msg.trim(), mentions: [auteurMessage] };
          }

          if (media) {
            await ovl.sendMessage(jid, media);
          } else {
            await ovl.sendMessage(jid, { text: msg.trim(), mentions: [auteurMessage] });
          }

          return;
        }

        let newMsg = arg.join(" ").trim();
        if (!newMsg) return repondre("❌ Le message ne peut pas être vide.");

        const hasUrl = /#url=/i.test(newMsg);
        const hasPP = /#pp/i.test(newMsg);
        const hasGPP = /#gpp/i.test(newMsg);

        if (hasUrl) {
          newMsg = newMsg.replace(/#pp/gi, "").replace(/#gpp/gi, "").trim();
        } else if (hasPP && hasGPP) {
          const ppIndex = newMsg.search(/#pp/i);
          const gppIndex = newMsg.search(/#gpp/i);
          if (ppIndex < gppIndex) {
            newMsg = newMsg.replace(/#gpp/gi, "").trim();
          } else {
            newMsg = newMsg.replace(/#pp/gi, "").trim();
          }
        }

        if (!newMsg) return repondre("❌ Le message ne peut pas être vide après nettoyage des variables.");

        eventData[fieldName] = newMsg;
        await eventData.save();
        return repondre(`✅ Nouveau message ${isWelcome ? "de bienvenue" : "d’adieu"} enregistré avec succès !`);
      } catch (e) {
        console.error(`❌ Erreur ${type} :`, e);
        repondre("❌ Une erreur s’est produite.");
      }
    },
  };
};

welcomeGoodbyeCmd("welcome");
welcomeGoodbyeCmd("goodbye");

const commands = [
  {
    nom_cmd: "antipromote",
    react: "🛑",
    desc: "Active ou désactive l'antipromotion",
    table: GroupSettings,
  },
  {
    nom_cmd: "antidemote",
    react: "🛑",
    desc: "Active ou désactive l'antidémotion",
    table: GroupSettings,
  },
  {
    nom_cmd: "promotealert",
    react: "⚠️",
    desc: "Active ou désactive l'alerte de promotion",
    table: Events2,
  },
  {
    nom_cmd: "demotealert",
    react: "⚠️",
    desc: "Active ou désactive l'alerte de rétrogradation",
    table: Events2,
  },
];

commands.forEach(({ nom_cmd, react, desc, table }) => {
  ovlcmd(
    {
      nom_cmd,
      classe: "Groupe",
      react,
      desc,
    },
    async (jid, ovl, { repondre, arg, verif_Groupe, verif_Admin }) => {
      try {
        if (!verif_Groupe) return repondre("❌ Cette commande fonctionne uniquement dans les groupes.");
        if (!verif_Admin) return repondre("❌ Seuls les administrateurs peuvent utiliser cette commande.");

        const sousCommande = arg[0]?.toLowerCase();
        const validModes = ["on", "off"];

        const [settings] = await table.findOrCreate({
          where: { id: jid },
          defaults: { id: jid, [nom_cmd]: "non" },
        });

        if (validModes.includes(sousCommande)) {
          const newMode = sousCommande === "on" ? "oui" : "non";
          if (settings[nom_cmd] === newMode) {
            return repondre(`ℹ️ ${nom_cmd} est déjà ${sousCommande}.`);
          }
          settings[nom_cmd] = newMode;
          await settings.save();
          return repondre(`✅ ${nom_cmd} ${sousCommande === "on" ? "activé" : "désactivé"} avec succès.`);
        }

        return repondre(`🛠️ Utilisation :\n> ${nom_cmd} on/off – ${desc.toLowerCase()}`);
      } catch (error) {
        console.error(`Erreur lors de la configuration de ${nom_cmd} :`, error);
        return repondre("❌ Une erreur s'est produite lors de l'exécution de la commande.");
      }
    }
  );
});
