const { exec } = require("child_process");
const { ovlcmd } = require("../lib/ovlcmd");
const { Bans } = require('../DataBase/ban');
const { Sudo } = require('../DataBase/sudo');
const config = require('../set');
const axios = require("axios");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const cheerio = require('cheerio');
const { WA_CONF } = require('../DataBase/wa_conf');
const { ChatbotConf } = require('../DataBase/chatbot');
const path = require('path');
const get_session = require('../DataBase/session');
const { saveSecondSession, getSecondAllSessions, deleteSecondSession } = require("../DataBase/connect");
const  { setMention, delMention, getMention } = require("../DataBase/mention");
const { set_stick_cmd, del_stick_cmd, get_stick_cmd } = require("../DataBase/stick_cmd");
const { set_cmd, del_cmd, list_cmd } = require("../DataBase/public_private_cmd");
const { Plugin } = require('../DataBase/plugin');
const { extractNpmModules, installModules } = require('../lib/plugin');

ovlcmd(
  {
    nom_cmd: "block",
    classe: "Owner",
    react: "⛔",
    desc: "Bloquer un utilisateur par son JID"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, verif_Groupe, prenium_id } = cmd_options;
    
    if (verif_Groupe) {
      return repondre("Veuillez vous diriger dans l'inbox de la personne à bloquer.");
    }
    if (!prenium_id) {
        return repondre("Vous n'avez pas le droit d'exécuter cette commande.");
    }
    try {
      await ovl.updateBlockStatus(ms_org, "block");
      repondre(`✅ Utilisateur bloqué avec succès.`);
    } catch (error) {
      console.error("Erreur block:", error);
      repondre(`Impossible de bloquer l'utilisateur.`);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "deblock",
    classe: "Owner",
    react: "✅",
    desc: "Débloquer un utilisateur par son JID"
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, repondre, prenium_id } = cmd_options;
    
    if (verif_Groupe) {
      return repondre("Veuillez vous diriger dans l'inbox de la personne à bloquer.");
    }
    if (!prenium_id) {
        return repondre("Vous n'avez pas le droit d'exécuter cette commande.");
    }
    try {
      await ovl.updateBlockStatus(ms_org, "unblock");
      repondre(`✅ Utilisateur débloqué avec succès.`);
    } catch (error) {
      console.error("Erreur deblock:", error);
      repondre(`Impossible de débloquer l'utilisateur.`);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ban",
    classe: "Owner",
    react: "🚫",
    desc: "Bannir un utilisateur des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, ms, arg, auteur_Msg_Repondu, prenium_id, dev_num } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
      }
      const cible =
        auteur_Msg_Repondu || 
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
 
      if (!cible) return repondre("Mentionnez un utilisateur valide à bannir.");

      if (dev_num.includes(cible)) {
      return ovl.sendMessage(jid, { text: "Vous ne pouvez pas bannir un développeur." }, { quoted: ms });
      }
      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "user" },
      });

      if (!ban._options.isNewRecord) return repondre("Cet utilisateur est déjà banni !");
      return ovl.sendMessage(jid, { 
        text: `Utilisateur @${cible.split('@')[0]} banni avec succès.`, 
        mentions: [cible]
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande ban :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "deban",
    classe: "Owner",
    react: "🚫",
    desc: "Débannir un utilisateur des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
      }
      const cible =
        auteur_Msg_Repondu || 
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
 
      if (!cible) return repondre("Mentionnez un utilisateur valide à débannir.");

      const suppression = await Bans.destroy({ where: { id: cible, type: "user" } });
      if (suppression === 0) return repondre("Cet utilisateur n'est pas banni.");
      return ovl.sendMessage(jid, { 
        text: `Utilisateur @${cible.split('@')[0]} débanni avec succès.`, 
        mentions: [cible]
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande debannir :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "bangroup",
    classe: "Owner",
    react: "🚫",
    desc: "Bannir un groupe des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, prenium_id, ms } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
      }
      if (!verif_Groupe) return repondre("Cette commande fonctionne uniquement dans les groupes.");

      const cible = jid;

      if (!cible) return repondre("Impossible de récupérer l'identifiant du groupe.");

      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "group" },
      });

      if (!ban._options.isNewRecord) return repondre("Ce groupe est déjà banni !");
      return repondre(`Groupe banni avec succès.`);
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande bangroup :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "debangroup",
    classe: "Owner",
    react: "🚫",
    desc: "Débannir un groupe des commandes du bot",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, prenium_id, ms } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
      }
      if (!verif_Groupe) return repondre("Cette commande fonctionne uniquement dans les groupes.");

      const cible = jid;

      if (!cible) return repondre("Impossible de récupérer l'identifiant du groupe.");

      const suppression = await Bans.destroy({ where: { id: cible, type: "group" } });
      if (suppression === 0) return repondre("Ce groupe n'est pas banni.");
      return repondre(`Groupe débanni avec succès.`);
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande debangroup :", error);
      return repondre("Une erreur s'est produite.");
    }
  }
);

 ovlcmd(
  {
    nom_cmd: "setsudo",
    classe: "Owner",
    react: "🔒",
    desc: "Ajoute un utilisateur dans la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
    }
    const cible =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
 
    if (!cible) {
      return repondre("Veuillez mentionner un utilisateur valide pour l'ajouter en premium.");
    }

    try {
      const [user] = await Sudo.findOrCreate({
        where: { id: cible },
        defaults: { id: cible },
      });

      if (!user._options.isNewRecord) {
        return ovl.sendMessage(ms_org, { 
        text: `L'utilisateur @${cible.split('@')[0]} est déjà un utilisateur premium.`, 
        mentions: [cible]
      }, { quoted: ms });
      }

      return ovl.sendMessage(ms_org, { 
        text: `Utilisateur @${cible.split('@')[0]} ajouté avec succès en tant qu'utilisateur premium.`, 
        mentions: [cible]
      }, { quoted: ms });
      } catch (error) {
      console.error("Erreur lors de l'exécution de la commande setsudo :", error);
      return repondre("Une erreur est survenue lors de l'ajout de l'utilisateur en premium.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "sudolist",
    classe: "Owner",
    react: "📋",
    desc: "Affiche la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, prenium_id, ms } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'exécuter cette commande." }, { quoted: ms });
    }

    try {
      const sudoUsers = await Sudo.findAll();

      if (!sudoUsers.length) {
        return repondre("Aucun utilisateur premium n'est actuellement enregistré.");
      }

      const userList = sudoUsers
        .map((user, index) => `🔹 *${index + 1}.* @${user.id.split('@')[0]}`)
        .join("\n");

      const message = `✨ *Liste des utilisateurs Premium* ✨\n\n*Total*: ${sudoUsers.length}\n\n${userList}`;

      return ovl.sendMessage(ms_org, { text: message, mentions: sudoUsers.map(user => user.id) }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande sudolist :", error);
      return repondre("Une erreur est survenue lors de l'affichage de la liste des utilisateurs premium.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "delsudo",
    classe: "Owner",
    react: "❌",
    desc: "Supprime un utilisateur de la liste des utilisateurs premium.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms } = cmd_options;
    
    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
    }
    const cible =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
     
    if (!cible) {
      return repondre("Veuillez mentionner un utilisateur");
    }

    try {
      const deletion = await Sudo.destroy({ where: { id: cible } });

      if (deletion === 0) {
        return ovl.sendMessage(ms_org, { 
        text: `L'utilisateur @${cible.split('@')[0]} n'est pas un utilisateur premium.`, 
        mentions: [cible]
      }, { quoted: ms });
      }

        return ovl.sendMessage(ms_org, { 
        text: `Utilisateur @${cible.split('@')[0]} supprimé avec succès de la liste premium.`, 
        mentions: [cible]
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande delsudo :", error);
      return repondre("Une erreur est survenue lors de la suppression de l'utilisateur de la liste premium.");
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
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." });
         }
        if (!arg[0]) {
            repondre("Merci de fournir un lien de stickers Telegram valide.");
            return;
        }

        const lien = arg[0];
        const nomStickers = lien.split("/addstickers/")[1];

        if (!nomStickers) {
            repondre("Lien incorrect");
            return;
        }

        const urlAPI = `https://api.telegram.org/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/getStickerSet?name=${nomStickers}`;

        try {
            const { data } = await axios.get(urlAPI);
            const stickers = data.result.stickers;

            if (!stickers || stickers.length === 0) {
                repondre("Aucun sticker trouvé dans cet ensemble.");
                return;
            }

            repondre(`Nom du pack: ${data.result.name}\nType : ${data.result.is_animated ? "animés" : "statiques"}\nTotal : ${stickers.length} stickers\n`);

            for (const stickerData of stickers) {
                const fileInfo = await axios.get(`https://api.telegram.org/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/getFile?file_id=${stickerData.file_id}`);
                const stickerBuffer = await axios({
                    method: "get",
                    url: `https://api.telegram.org/file/bot7644701915:AAGP8fIx_wv1pC7BNMpgncL4i-rRSDLlvqI/${fileInfo.data.result.file_path}`,
                    responseType: "arraybuffer",
                });

                const sticker = new Sticker(stickerBuffer.data, {
                    pack: config.STICKER_PACK_NAME,
                    author: config.STICKER_AUTHOR_NAME,
                    type: StickerTypes.FULL,
                });

                await ovl.sendMessage(ms_org, {
                    sticker: await sticker.toBuffer(),
                }, { quoted: ms });
            }

            repondre("Tous les stickers ont été envoyés.");
        } catch (error) {
            console.error(error);
            repondre("Une erreur s'est produite lors du téléchargement des stickers.");
        }
    }
);

ovlcmd(
  {
    nom_cmd: "fetch_sc",
    classe: "Owner",
    react: "💻",
    desc: "Extrait les données d'une page web, y compris HTML, CSS, JavaScript et médias",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, prenium_id, ms } = cmd_options;
    const lien = arg[0];
if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: "Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
}
    if (!lien) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir un lien valide. Le bot extraira le HTML, CSS, JavaScript, et les médias de la page web." }, { quoted: ms });
    }

    if (!/^https?:\/\//i.test(lien)) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir une URL valide commençant par http:// ou https://" }, { quoted: ms });
    }

    try {
      const response = await axios.get(lien);
      const html = response.data;
      const $ = cheerio.load(html);

      const fichiersMedia = [];
      $('img[src], video[src], audio[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) fichiersMedia.push(src);
      });

      const fichiersCSS = [];
      $('link[rel="stylesheet"]').each((i, element) => {
        let href = $(element).attr('href');
        if (href) fichiersCSS.push(href);
      });

      const fichiersJS = [];
      $('script[src]').each((i, element) => {
        let src = $(element).attr('src');
        if (src) fichiersJS.push(src);
      });

      await ovl.sendMessage(ms_org, { text: `**Contenu HTML**:\n\n${html}` }, { quoted: ms });

      if (fichiersCSS.length > 0) {
        for (const fichierCSS of fichiersCSS) {
          const cssResponse = await axios.get(new URL(fichierCSS, lien));
          const cssContent = cssResponse.data;
          await ovl.sendMessage(ms_org, { text: `**Contenu du fichier CSS**:\n\n${cssContent}` }, { quoted: ms });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier CSS externe trouvé." }, { quoted: ms });
      }

      if (fichiersJS.length > 0) {
        for (const fichierJS of fichiersJS) {
          const jsResponse = await axios.get(new URL(fichierJS, lien));
          const jsContent = jsResponse.data;
          await ovl.sendMessage(ms_org, { text: `**Contenu du fichier JavaScript**:\n\n${jsContent}` }, { quoted: ms });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier JavaScript externe trouvé." }, { quoted: ms });
      }

      if (fichiersMedia.length > 0) {
        await ovl.sendMessage(ms_org, { text: `**Fichiers médias trouvés**:\n${fichiersMedia.join('\n')}` }, { quoted: ms });
      } else {
        await ovl.sendMessage(ms_org, { text: "Aucun fichier média (images, vidéos, audios) trouvé." }, { quoted: ms });
      }

    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de l'extraction du contenu de la page web." }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antidelete",
    classe: "Owner",
    react: "🔗",
    desc: "Configure ou désactive l'Antidelete",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, prenium_id } = cmd_options;
    
    try {
      if (!prenium_id) {
        return repondre("Seuls les utilisateurs premium peuvent utiliser cette commande.");
      }

      const sousCommande = arg[0]?.toLowerCase();
      const validTypes = {
        1: 'pm',
        2: 'gc',
        3: 'status',
        4: 'all',
        5: 'pm/gc',
        6: 'pm/status',
        7: 'gc/status'
      };

      const [settings] = await WA_CONF.findOrCreate({
        where: { id: '1' },
        defaults: { id: '1' , antidelete: 'non' },
      });

      if (sousCommande === 'off') {
        if (settings.antidelete === 'non') {
          return repondre("L'Antidelete est déjà désactivé.");
        }
        settings.antidelete = 'non';
        await settings.save();
        return repondre("L'Antidelete désactivé avec succès !");
      }

      const typeSelection = parseInt(sousCommande);
      if (validTypes[typeSelection]) {
        const selectedType = validTypes[typeSelection];

        if (settings.antidelete === selectedType) {
          return repondre(`L'Antidelete est déjà configuré sur ${selectedType}.`);
        }

        settings.antidelete = selectedType;
        await settings.save();
        return repondre(`L'Antidelete est maintenant configuré sur ${selectedType}.`);
      }

      return repondre(
        "Utilisation :\n" +
        "antidelete off: Désactiver l'antidelete\n\n" +
        "antidelete 1: Configurer l'action antidelete sur les messages privés (pm)\n" +
        "antidelete 2: Configurer l'action antidelete sur les messages de groupe (gc)\n" +
        "antidelete 3: Configurer l'action antidelete sur les statuts (status)\n" +
        "antidelete 4: Configurer l'action antidelete sur tous les types (all)\n" +
        "antidelete 5: Configurer l'action antidelete sur les messages privés et de groupe (pm/gc)\n" +
        "antidelete 6: Configurer l'action antidelete sur les messages privés et les statuts (pm/status)\n" +
        "antidelete 7: Configurer l'action antidelete sur les messages de groupe et les statuts (gc/status)"
      );
    } catch (error) {
      console.error("Erreur lors de la configuration d'antidelete :", error);
      repondre("Une erreur s'est produite lors de l'exécution de la commande.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "jid",
    classe: "Owner",
    react: "🆔",
    desc: "fournit le jid d'une personne ou d'un groupe",
  },  
  async (ms_org, ovl, cmd_options) => {
    const { repondre, auteur_Msg_Repondu, prenium_id, msg_Repondu } = cmd_options;

    if (!prenium_id) {
      return repondre("Seuls les utilisateurs prenium peuvent utiliser cette commande");
    }

    let jid;

    if (!msg_Repondu) {
      jid = ms_org;
    } else {
      jid = auteur_Msg_Repondu;
    }

    repondre(jid);
  }
);

ovlcmd(
    {
        nom_cmd: "restart",
        classe: "Owner",
        desc: "Redémarre le bot via PM2"
    },
    async (ms_org, ovl, opt) => {
        const { ms, prenium_id } = opt;

        if (!prenium_id) {
            return ovl.sendMessage(ms_org, { text: "Vous n'avez pas la permission d'utiliser cette commande." }, { quoted: ms });
        }

        await ovl.sendMessage(ms_org, { text: "♻️ Redémarrage du bot en cours..." }, { quoted: ms });

        exec('pm2 restart all', (err, stdout, stderr) => {
            if (err) {
                return ovl.sendMessage(ms_org, { text: `Erreur lors du redémarrage :\n${err.message}` }, { quoted: ms });
            }
        });
    }
);

ovlcmd(
  {
    nom_cmd: "connect",
    classe: "Owner",
    desc: "Connexion d’un compte avec le bot via session_id",
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { arg, ms, prenium_id } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: "🚫 Vous n'avez pas le droit d'exécuter cette commande." }, { quoted: ms });
      }

      if (!arg || !arg[0]) {
        return ovl.sendMessage(ms_org, { text: "Exemple : .connect SESSION_ID" }, { quoted: ms });
      }

      const session_id = arg[0].trim();

      await saveSecondSession(session_id);

      exec('pm2 restart all', (err) => {
        if (err) {
          ovl.sendMessage(ms_org, { text: `⚠️ Erreur lors du redémarrage :\n${err.message}` }, { quoted: ms });
        }
      });

      return ovl.sendMessage(ms_org, { text: `✅ Tentative de connexion enregistrée pour la session : ${session_id}` }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: `❌ Erreur : ${err.message}` });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "connect_session",
    classe: "Owner",
    desc: "Affiche la liste des numéros connectés",
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { ms, JidToLid, prenium_id } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, {
          text: "Vous n'avez pas le droit d'exécuter cette commande.",
        }, { quoted: ms });
      }

      const sessions = await getSecondAllSessions();

      if (!sessions || sessions.length === 0) {
        return ovl.sendMessage(ms_org, {
          text: "📭 Aucune session secondaire active pour le moment.",
        }, { quoted: ms });
      }

      const jids = sessions.map(s => `${s.numero}@s.whatsapp.net`);
      const texte = jids.map(jid => `@${jid.split("@")[0]}`).join("\n");

      await ovl.sendMessage(ms_org, {
        text: `📡 *Sessions secondaires connectées (${sessions.length})* :\n\n${texte}`,
        mentions: jids,
      }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: `❌ Erreur : ${err.message}` });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "disconnect",
    classe: "Owner",
    desc: "Supprime une session connectée par session_id",
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { arg, ms, prenium_id } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, {
          text: "Vous n'avez pas le droit d'exécuter cette commande.",
        }, { quoted: ms });
      }

      if (!arg || !arg[0]) {
        return ovl.sendMessage(ms_org, {
          text: "Usage : .disconnect SESSION_ID",
        }, { quoted: ms });
      }

      const session_id = arg[0].trim();
      const result = await deleteSecondSession(session_id);

      if (result === 0) {
        return ovl.sendMessage(ms_org, {
          text: `Aucune session trouvée pour la session : ${session_id}`,
        }, { quoted: ms });
      }

      exec('pm2 restart all', (err) => {
        if (err) {
          ovl.sendMessage(ms_org, { text: `⚠️ Erreur lors du redémarrage :\n${err.message}` }, { quoted: ms });
        }
      });

      await ovl.sendMessage(ms_org, {
        text: `✅ Session ${session_id} supprimée avec succès.`,
      }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: `❌ Erreur : ${err.message}` });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "setmention",
    classe: "Owner",
    react: "✅",
    desc: "Configurer le message d'antimention global",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, prenium_id } = cmd_options;

    if (!prenium_id) return repondre("❌ Seuls les utilisateurs premium peuvent utiliser cette commande.");

    try {
      const joined = arg.join(" ");
      if (!joined) {
        return repondre(
          `🛠️ Utilisation de la commande *setmention* :

1️⃣ Pour une image ou vidéo avec texte :
> *setmention url=https://exemple.com/fichier.jpg & text=Votre message ici*

2️⃣ Pour un audio (.opus uniquement) :
> *setmention url=https://exemple.com/audio.opus*

3️⃣ Pour un message texte seulement (pas de média) :
> *setmention text=Votre message ici*

📌 Extensions supportées : .jpg, .jpeg, .png, .mp4, .opus, .ogg, .mp3, .m4a, .aac, .wav
⚠️ Le texte n’est pas autorisé avec l'audio.
✅Veuillez utuliser la commande *url* pour obtenir l'URL.`
        );
      }

      const parts = joined.split("&").map(p => p.trim());
      let url = "url";
      let text = "text";

      for (const part of parts) {
        if (part.startsWith("url=")) url = part.replace("url=", "").trim();
        else if (part.startsWith("text=")) text = part.replace("text=", "").trim();
      }

      const lowerUrl = url.toLowerCase();

      const isAudio = lowerUrl.endsWith(".opus") || lowerUrl.endsWith(".ogg") || lowerUrl.endsWith(".mp3") || lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".aac") || lowerUrl.endsWith(".wav");
      const isImage = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png");
      const isVideo = lowerUrl.endsWith(".mp4");

      if (url === "url" && text !== "text") {
        await setMention({ url: "", text, mode: "oui" });
        return repondre("✅ Message texte configuré avec succès pour l'antimention.");
      }

      if (isAudio) {
        if (text !== "text" && text !== "") return repondre("❌ Le texte n'est pas autorisé pour un message audio (.opus).");
        await setMention({ url, text: "", mode: "oui" });
        return repondre("✅ Mention audio enregistrée.");
      }

      if (isImage || isVideo) {
        await setMention({ url, text, mode: "oui" });
        return repondre(`✅ Mention ${isImage ? "image" : "vidéo"} enregistrée avec succès.`);
      }

      return repondre("Format de fichier non supporté. Extensions valides : .jpg, .jpeg, .png, .mp4, .opus");
    } catch (e) {
      console.error("Erreur dans setmention:", e);
      repondre("Une erreur s'est produite lors de la configuration.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "delmention",
    classe: "Owner",
    react: "🚫",
    desc: "Désactiver le système d'antimention",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, prenium_id } = cmd_options;

    if (!prenium_id) return repondre("Seuls les utilisateurs premium peuvent utiliser cette commande.");

    try {
      await delMention();
      return repondre("✅ mention désactivé.");
    } catch (e) {
      console.error("Erreur dans delmention:", e);
      repondre("Une erreur s'est produite.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "getmention",
    classe: "Owner",
    react: "📄",
    desc: "Afficher la configuration actuelle de l'antimention",
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, prenium_id } = cmd_options;

    try {
      if (!prenium_id) return repondre("Seuls les utilisateurs premium peuvent utiliser cette commande.");

      const data = await getMention();

      if (!data || data.mode === "non") {
        return repondre("ℹ️ Antimention désactivé ou non configuré.");
      }

      const { mode, url, text } = data;

      if (!url || url === "" || url === "url") {
        if (!text || text === "text") {
          return repondre("ℹ️ Antimention activé mais aucun contenu défini.");
        }
        return repondre(text);
      }

      const lowerUrl = url.toLowerCase();
      const isAudio = lowerUrl.endsWith(".opus") || lowerUrl.endsWith(".ogg") || lowerUrl.endsWith(".mp3") || lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".aac") || lowerUrl.endsWith(".wav");
      const isImage = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png");
      const isVideo = lowerUrl.endsWith(".mp4");

      const type = isAudio ? "audio" : isImage ? "image" : isVideo ? "video" : "document";
 
      if (isAudio) {
        return await ovl.sendMessage(jid, {
          audio: { url },
          mimetype: 'audio/mp4',
          ptt: true,
        }, { quoted: null });
      }

      if (isImage) {
        return await ovl.sendMessage(jid, {
          image: { url },
          caption: (text && text !== "text") ? text : undefined,
        }, { quoted: null });
      }

      if (isVideo) {
        return await ovl.sendMessage(jid, {
          video: { url },
          caption: (text && text !== "text") ? text : undefined,
        }, { quoted: null });
      }

      return repondre("Le type de média est inconnu ou non pris en charge.");
    } catch (e) {
      console.error("Erreur dans gmention:", e);
      repondre("Impossible d'afficher la configuration.");
    }
  }
);

ovlcmd({
  nom_cmd: "addstickcmd",
  classe: "Owner",
  react: "✨",
  desc: "Associer une commande à un sticker (réponds à un sticker)",
}, async (ms_org, ovl, { repondre, msg_Repondu, arg, prenium_id }) => {
  if (!prenium_id) return repondre("Pas autorisé.");

  const name = arg[0];
  if (!name) return repondre("Tu dois donner un nom à la commande.\nExemple : \`addstickcmd test\`");

  if (!msg_Repondu || !msg_Repondu.stickerMessage || !msg_Repondu.stickerMessage.url)
    return repondre("Tu dois répondre à un *sticker* pour l'enregistrer.");

  const stick_url = msg_Repondu.stickerMessage.url;

  try {
    await set_stick_cmd(name.toLowerCase(), stick_url);
    repondre(`✅ Le sticker a été associé à la commande *${name}*`);
  } catch (e) {
    console.error(e);
    repondre("Erreur lors de l'enregistrement.");
  }
});

ovlcmd({
  nom_cmd: "delstickcmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprimer une commande sticker",
}, async (ms_org, ovl, { repondre, arg, prenium_id }) => {
  if (!prenium_id) return repondre("Pas autorisé.");

  const name = arg[0];
  if (!name) return repondre("Exemple : \`delstickcmd test\`");

  const ok = await del_stick_cmd(name.toLowerCase());
  repondre(ok ? `🗑️ La commande *${name}* a été supprimée.` : `Aucune commande nommée *${name}* trouvée.`);
});

ovlcmd({
  nom_cmd: "getstickcmd",
  classe: "Owner",
  react: "📋",
  desc: "Liste des commandes stickers",
}, async (ms_org, ovl, { repondre, prenium_id }) => {
  if (!prenium_id) return repondre("Pas autorisé.");

  const list = await get_stick_cmd();
  if (!list.length) return repondre("Aucune commande sticker trouvée.");

  let msg = "*📌 Liste des commandes stickers :*\n\n";
  for (const { no_cmd, stick_url } of list) {
    msg += `• *${no_cmd}*\n`;
  }

  repondre(msg);
});

ovlcmd({
  nom_cmd: "setpublic_cmd",
  classe: "Owner",
  react: "✅",
  desc: "Ajoute une commande publique utilisable par tout le monde quand le bot est en mode privé",
}, async (ms_org, ovl, { arg, repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre("❌ Utilisation: setpublic_cmd nom_cmd");

  try {
    await set_cmd(nom_cmd, "public");
    repondre(`✅ Commande publique '${nom_cmd}' enregistrée.`);
  } catch {
    repondre("❌ Erreur lors de l'enregistrement.");
  }
});

ovlcmd({
  nom_cmd: "delpublic_cmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprime une commande des commandes publiques.",
}, async (ms_org, ovl, { arg, repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre("❌ Utilisation: delpublic_cmd nom_cmd");

  try {
    const deleted = await del_cmd(nom_cmd, "public");
    repondre(deleted ? `✅ Commande '${nom_cmd}' supprimée.` : `❌ Commande '${nom_cmd}' introuvable.`);
  } catch {
    repondre("❌ Erreur lors de la suppression.");
  }
});

ovlcmd({
  nom_cmd: "listpublic_cmd",
  classe: "Owner",
  react: "📜",
  desc: "Liste les commandes publiques utilisablent quand le bot est en mode privé",
}, async (ms_org, ovl, { repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const all = await list_cmd("public");
  if (!all.length) return repondre("❌ Aucune commande publique enregistrée.");

  const msg = all.map((c, i) => `🔹 *${i + 1}.* ${c.nom_cmd}`).join("\n");
  repondre(`📖 *Commandes publiques enregistrées :*\n\n${msg}`);
});

ovlcmd({
  nom_cmd: "setprivate_cmd",
  classe: "Owner",
  react: "🔒",
  desc: "Ajoute une commande privée utilisable par les utilisateurs premiums quand le bot est en mode public",
}, async (ms_org, ovl, { arg, repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre("❌ Utilisation: setprivate_cmd nom_cmd");

  try {
    await set_cmd(nom_cmd, "private");
    repondre(`🔐 Commande privée '${nom_cmd}' enregistrée.`);
  } catch {
    repondre("❌ Erreur lors de l'enregistrement.");
  }
});

ovlcmd({
  nom_cmd: "delprivate_cmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprime une commande des commandes privée"
}, async (ms_org, ovl, { arg, repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre("❌ Utilisation: delprivate_cmd nom_cmd");

  try {
    const deleted = await del_cmd(nom_cmd, "private");
    repondre(deleted ? `✅ Commande '${nom_cmd}' supprimée.` : `❌ Commande '${nom_cmd}' introuvable.`);
  } catch {
    repondre("❌ Erreur lors de la suppression.");
  }
});

ovlcmd({
  nom_cmd: "listprivate_cmd",
  classe: "Owner",
  react: "📃",
  desc: "Liste les commandes privées utilisablent par les utilisateurs premiums quand le bot est en mode public",
}, async (ms_org, ovl, { repondre, prenium_id }) => {
  if (!prenium_id) return repondre("❌ Vous n'avez pas la permission d'exécuter cette commande.");

  const all = await list_cmd("private");
  if (!all.length) return repondre("❌ Aucune commande privée enregistrée.");

  const msg = all.map((c, i) => `🔹 *${i + 1}.* ${c.nom_cmd}`).join("\n");
  repondre(`🔒 *Commandes privées enregistrées :*\n\n${msg}`);
});


ovlcmd(
  {
    nom_cmd: "chatbot",
    classe: "Owner",
    react: "🤖",
    desc: "Active ou désactive le chatbot ici ou globalement.",
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, verif_Groupe, prenium_id } = cmd_options;
    const sousCommande = arg[0]?.toLowerCase();

    if (!prenium_id) {
      repondre("❌ Pas autorisé.");
      return;
    }

    try {
      const [config] = await ChatbotConf.findOrCreate({
        where: { id: '1' },
        defaults: {
          chatbot_pm: 'non',
          chatbot_gc: 'non',
          enabled_ids: JSON.stringify([]),
        },
      });

      let ids = [];
      try {
        ids = JSON.parse(config.enabled_ids || '[]');
      } catch {
        ids = [];
      }

      if (sousCommande === 'on') {
        if (ids.includes(jid)) {
          repondre("🔁 Le chatbot est *déjà activé ici*.");
        } else {
          ids.push(jid);
          config.enabled_ids = JSON.stringify([...new Set(ids)]);
          config.chatbot_pm = 'non';
          config.chatbot_gc = 'non';
          await config.save();
          repondre("✅ Le chatbot est maintenant activé *dans cette discussion*.");
        }

      } else if (sousCommande === 'off') {
        config.chatbot_pm = 'non';
        config.chatbot_gc = 'non';
        config.enabled_ids = JSON.stringify([]);
        await config.save();
        repondre("⛔️ Le chatbot est maintenant désactivé *partout*.");

      } else if (['pm', 'gc', 'all'].includes(sousCommande)) {
        config.chatbot_pm = sousCommande === 'pm' || sousCommande === 'all' ? 'oui' : 'non';
        config.chatbot_gc = sousCommande === 'gc' || sousCommande === 'all' ? 'oui' : 'non';
        config.enabled_ids = JSON.stringify([]);
        await config.save();

        const messages = {
          pm: "✅ Le chatbot est maintenant activé *dans tous les chats privés*.",
          gc: "✅ Le chatbot est maintenant activé *dans tous les groupes*.",
          all: "✅ Le chatbot est maintenant activé *partout*.",
        };

        repondre(messages[sousCommande]);

      } else {
        repondre(
          "🤖 *Gestion du Chatbot*\n\n" +
          "`chatbot on` - Active ici uniquement\n" +
          "`chatbot off` - Désactive *partout*\n" +
          "`chatbot pm` - Active dans *tous les chats privés*\n" +
          "`chatbot gc` - Active dans *tous les groupes*\n" +
          "`chatbot all` - Active *partout*"
        );
      }

    } catch (err) {
      console.error("❌ Erreur dans la commande chatbot :", err);
      repondre("Une erreur est survenue.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "list",
    classe: "Système",
    react: "📃",
    desc: "Affiche la liste des plugins disponibles (✓ installé, ✗ non installé).",
  },
  async (ms, ovl, { repondre }) => {
    try {
      const { data } = await axios.get('https://premier-armadillo-ovl-02d9d108.koyeb.app/pglist');
      const installs = await Plugin.findAll();
      const installedNames = installs.map(p => p.name);

      const lignes = data.map(p => {
        const estInstalle = installedNames.includes(p.name);
        return `${estInstalle ? '✓' : '✗'} ${p.name}`;
      });

      const message = lignes.length > 0
        ? `📦 Liste des plugins disponibles :\n\n${lignes.join('\n')}`
        : "Aucun plugin disponible.";

      await repondre(message);
    } catch (e) {
      await repondre("❌ Erreur lors du chargement de la liste.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "remove",
    classe: "Système",
    react: "🗑️",
    desc: "Supprime un plugin installé par nom ou tape `remove all` pour tous.",
  },
  async (ms, ovl, { arg, repondre }) => {
    const input = arg[0];
    if (!input) return repondre("❌ Utilise `remove nom_plugin` ou `remove all`.");

    if (input === 'all') {
      const plugins = await Plugin.findAll();
      for (const p of plugins) {
        const filePath = path.join(__dirname, '../cmd', `${p.name}.js`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await Plugin.destroy({ where: { name: p.name } });
      }
      return repondre("🗑️ Tous les plugins ont été supprimés.");
    }

    const plugin = await Plugin.findOne({ where: { name: input } });
    if (!plugin) return repondre("❌ Plugin non trouvé dans la base.");

    const filePath = path.join(__dirname, '../cmd', `${plugin.name}.js`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Plugin.destroy({ where: { name: input } });

    await repondre(`🗑️ Plugin *${input}* supprimé.`);
  }
);


function extractNpmModules(code) {
  const regex = /require\s*\(\s*['"]([^\.\/][^'"]*)['"]\s*\)/g;
  const modules = new Set();
  let match;
  while ((match = regex.exec(code)) !== null) {
    modules.add(match[1]);
  }
  return Array.from(modules);
}

async function installModules(modules) {
  if (modules.length === 0) return;
  return new Promise((resolve, reject) => {
    const cmd = `npm install ${modules.join(' ')}`;
    exec(cmd, { cwd: path.resolve(__dirname, '../') }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || stdout || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

ovlcmd(
  {
    nom_cmd: "install",
    classe: "Système",
    react: "📥",
    desc: "Installe un plugin.",
  },
  async (ms, ovl, { arg, repondre }) => {
    const input = arg[0];
    if (!input) return repondre("❌ Donne un lien direct vers un plugin ou tape `install all` pour tout installer.");

    const installOne = async (url, name) => {
      try {
        const res = await axios.get(url);
        const code = res.data;
        const filePath = path.join(__dirname, '../cmd', `${name}.js`);
        fs.writeFileSync(filePath, code);

        const modules = extractNpmModules(code);
        if (modules.length > 0) {
          await repondre(`⚙️ Installation des dépendances npm : ${modules.join(', ')}`);
          await installModules(modules);
        }

        await Plugin.findOrCreate({ where: { name }, defaults: { url } });
        await repondre(`✅ Plugin *${name}* installé.`);
      } catch (e) {
        await repondre("❌ Erreur : " + e);
      }
    };

    if (input === 'all') {
      try {
        const { data } = await axios.get('https://premier-armadillo-ovl-02d9d108.koyeb.app/pglist');
        for (const p of data) {
          await installOne(p.url, p.name);
        }
        await repondre('✅ Tous les plugins disponibles ont été installés.');
      } catch (e) {
        await repondre("❌ Erreur : " + e.message);
      }
    } else {
      await installOne(input, path.basename(input).replace('.js', ''));
    }
  }
);
