const { ovlcmd, cmd } = require("../lib/ovlcmd");
const config = require("../set");
const { translate } = require('@vitalets/google-translate-api');
const prefixe = config.PREFIXE;
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const pkg = require('../package');

function stylize(text) {
    const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const small =  'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ' +
                   'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ' +
                   '0123456789';
    return text.split('').map(c => {
        const i = normal.indexOf(c);
        return i !== -1 ? small[i] : c;
    }).join('');
}

const contextInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363371282577847@newsletter',
        newsletterName: 'OVL-LITE',
    },
};

ovlcmd(
  {
    nom_cmd: "test",
    classe: "Outils",
    react: "🌟",
    desc: "Tester la connectivité du bot"
  },
  async (ms_org, ovl, { ms, repondre }) => {
    try {

      const menu = `🌐 Bienvenue sur *OVL-LITE*, votre bot WhatsApp multi-device.\n🔍 Tapez *${config.PREFIXE}menu* pour voir toutes les commandes disponibles.\n> ©2025 OVL-LITE By *AINZ*`;

      let lien = "https://files.catbox.moe/wc0gph.jpg";

      if (lien.endsWith(".mp4")) {
        await ovl.sendMessage(ms_org, {
          video: { url: lien },
          caption: stylize(menu),
          gifPlayback: true,
          contextInfo
        }, { quoted: ms });
      } else {
        await ovl.sendMessage(ms_org, {
          image: { url: lien },
          caption: stylize(menu),
          contextInfo
        }, { quoted: ms });
      }

    } catch (e) {
      console.error("Erreur dans la commande test :", e);
      const fallback = `🌐 Bienvenue sur *OVL-LITE*, votre bot WhatsApp multi-device.\n🔍 Tapez *${config.PREFIXE}menu* pour voir toutes les commandes disponibles.\n> ©2025 OVL-LITE By *AINZ*`;

      await ovl.sendMessage(ms_org, {
        text: stylize(fallback),
        contextInfo
      }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "description",
    classe: "Outils",
    desc: "Menu des commandes : toutes, par catégorie ou détail d’une commande.",
    alias: ["desc", "help"],
  },
  async (ms_org, ovl, cmd_options) => {
    try {
      const { arg, ms } = cmd_options;
      const commandes = cmd;

      if (arg.length) {
        const recherche = arg[0].toLowerCase();

        if (recherche === "all") {
          let message = "📚 *Toutes les commandes disponibles :*\n\n";
          commandes.forEach((c) => {
            message += `🔹 *${c.nom_cmd}* — _${c.desc}_\nAlias : [${c.alias.join(", ")}]\nClasse : ${c.classe}\n\n`;
          });
          return await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
        }

        if (recherche === "cat") {
          const classes = [...new Set(commandes.map(c => c.classe))];
          let message = "📂 *Catégories disponibles :*\n\n";
          classes.forEach((classe) => {
            const cmds = commandes.filter(c => c.classe === classe);
            message += `📁 *${classe}* (${cmds.length})\n`;
            cmds.forEach((c) => {
              message += ` ┗ 🧩 *${c.nom_cmd}* — _${c.desc}_\n`;
            });
            message += "\n";
          });
          return await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
        }

        if (recherche.startsWith("cat=")) {
          const classeDemandee = recherche.split("cat=")[1].toLowerCase();
          const classesExistantes = [...new Set(commandes.map(c => c.classe.toLowerCase()))];

          if (!classesExistantes.includes(classeDemandee)) {
            return await ovl.sendMessage(ms_org, {
              text: `❌ Catégorie *"${classeDemandee}"* introuvable.\nUtilise *desc cat* pour voir les catégories disponibles.`,
            }, { quoted: ms });
          }

          const commandesClasse = commandes.filter(c => c.classe.toLowerCase() === classeDemandee);
          let message = `📁 *Commandes de la catégorie "${classeDemandee}"* (${commandesClasse.length}) :\n\n`;

          commandesClasse.forEach(c => {
            message += `🧩 *${c.nom_cmd}* — _${c.desc}_\nAlias : [${c.alias.join(", ")}]\n\n`;
          });

          return await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
        }

        const commandeTrouvee = commandes.find(
          (c) =>
            c.nom_cmd.toLowerCase() === recherche ||
            c.alias.map(a => a.toLowerCase()).includes(recherche)
        );

        if (commandeTrouvee) {
          const detail = `🧩 *Détails de la commande :*\n\n` +
            `🔹 *Nom* : ${commandeTrouvee.nom_cmd}\n` +
            `📚 *Alias* : [${commandeTrouvee.alias.join(", ")}]\n` +
            `🗂️ *Classe* : ${commandeTrouvee.classe}\n` +
            `📝 *Description* : ${commandeTrouvee.desc}`;
          return await ovl.sendMessage(ms_org, { text: detail }, { quoted: ms });
        } else {
          return await ovl.sendMessage(ms_org, {
            text: `❌ Commande ou alias *"${recherche}"* introuvable.`,
          }, { quoted: ms });
        }
      }

      const menu = `📖 *Menu d'aide des commandes :*\n\n` +
        `📌 *desc all* → Toutes les commandes\n` +
        `📌 *desc cat=[catégorie]* → Commandes d’une seule catégorie\n` +
        `📌 *desc [commande]* → Détail d'une commande spécifique\n\n` +
        `Exemples :\n` +
        `• desc all\n` +
        `• desc cat=groupe\n` +
        `• desc tagall`;

      await ovl.sendMessage(ms_org, { text: menu }, { quoted: ms });

    } catch (error) {
      console.error("Erreur dans description :", error);
      await ovl.sendMessage(ms_org, {
        text: "❌ Une erreur s’est produite dans le menu description.",
      }, { quoted: cmd_options.ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "menu",
    classe: "Outils",
    react: "📜",
    desc: "Affiche toutes les commandes du bot",
  },
  async (ms_org, ovl, cmd_options) => {
      const { ms } = cmd_options;
    try {
      const seconds = process.uptime();
      const j = Math.floor(seconds / 86400);
      const h = Math.floor((seconds / 3600) % 24);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      let uptime = "";
      if (j > 0) uptime += `${j}J `;
      if (h > 0) uptime += `${h}H `;
      if (m > 0) uptime += `${m}M `;
      if (s > 0) uptime += `${s}S`;

      const dateObj = new Date();
      const dateStr = dateObj.toLocaleDateString("fr-FR");
      const heureStr = dateObj.toLocaleTimeString("fr-FR");
      const platform = process.platform;

      const commandes = cmd;
      const cmd_classe = {};
      commandes.forEach((cmd) => {
        if (!cmd_classe[cmd.classe]) cmd_classe[cmd.classe] = [];
        cmd_classe[cmd.classe].push(cmd);
      });

      const classesSorted = Object.keys(cmd_classe).sort((a, b) => a.localeCompare(b));
      for (const classe of classesSorted) {
        cmd_classe[classe].sort((a, b) =>
          a.nom_cmd.localeCompare(b.nom_cmd, undefined, { numeric: true })
        );
      }

      let menu = `╭──⟪ 🤖 OVL-LITE BOT ⟫──╮
├ ߷ Préfixe       : ${config.PREFIXE}
├ ߷ Owner         : ${config.NOM_OWNER}
├ ߷ Commandes  : ${commandes.length}
├ ߷ Uptime        : ${uptime.trim()}
├ ߷ Date    : ${dateStr}
├ ߷ Heure   : ${heureStr}
├ ߷ Plateforme  : ${platform}
├ ߷ Développeur : AINZ
├ ߷ Version        : ${pkg.version}
╰──────────────────╯\n\n`;

      for (const classe of classesSorted) {
        menu += `╭──⟪ ${classe.toUpperCase()} ⟫──╮\n`;
        cmd_classe[classe].forEach((cmd) => {
          menu += `├ ߷ ${cmd.nom_cmd}\n`;
        });
        menu += `╰──────────────────╯\n\n`;
      }

      menu += `> ©2025 OVL-LITE By *AINZ*`;

      const lien = "https://files.catbox.moe/wc0gph.jpg";

      try {
        if (lien && lien.endsWith(".mp4")) {
          await ovl.sendMessage(ms_org, {
            video: { url: lien },
            caption: stylize(menu),
            gifPlayback: true,
            contextInfo
          }, { quoted: ms });
        } else if (lien) {
          await ovl.sendMessage(ms_org, {
            image: { url: lien },
            caption: stylize(menu),
            contextInfo
          }, { quoted: ms });
        } else {
          throw new Error("Aucun thème trouvé");
        }
      } catch (e) {
        await ovl.sendMessage(ms_org, {
          text: stylize(menu),
          contextInfo
        }, { quoted: ms });
      }

    } catch (err) {
        console.error(err);
      await ovl.sendMessage(ms_org, {
        text: "Une erreur est survenue lors de l'affichage du menu complet.",
        contextInfo
      }, { quoted: ms });
    }
  }
);

ovlcmd(
    {
        nom_cmd: "vv",
        classe: "Outils",
        react: "👀",
        desc: "Affiche un message envoyé en vue unique dans la discussion",
    },
    async (ms_org, ovl, cmd_options) => {
        const { ms, msg_Repondu, repondre } = cmd_options;

        if (!msg_Repondu) {
            return repondre("Veuillez mentionner un message en vue unique.");
        }

        let viewOnceKey = Object.keys(msg_Repondu).find(key => key.startsWith("viewOnceMessage"));
        let vue_Unique_Message = msg_Repondu;

        if (viewOnceKey) {
            vue_Unique_Message = msg_Repondu[viewOnceKey].message;
        }

        if (vue_Unique_Message) {
            if (
                (vue_Unique_Message.imageMessage && vue_Unique_Message.imageMessage.viewOnce !== true) ||
                (vue_Unique_Message.videoMessage && vue_Unique_Message.videoMessage.viewOnce !== true) ||
                (vue_Unique_Message.audioMessage && vue_Unique_Message.audioMessage.viewOnce !== true)
            ) {
                return repondre("Ce message n'est pas un message en vue unique.");
            }
        }

        try {
            let media;
            let options = { quoted: ms };

            if (vue_Unique_Message.imageMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.imageMessage);
                await ovl.sendMessage(
                    ms_org,
                    { image: { url: media }, caption: vue_Unique_Message.imageMessage.caption || "" },
                    options
                );

            } else if (vue_Unique_Message.videoMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.videoMessage);
                await ovl.sendMessage(
                    ms_org,
                    { video: { url: media }, caption: vue_Unique_Message.videoMessage.caption || "" },
                    options
                );

            } else if (vue_Unique_Message.audioMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.audioMessage);
                await ovl.sendMessage(
                    ms_org,
                    { audio: { url: media }, mimetype: "audio/mp4", ptt: false },
                    options
                );

            } else {
                return repondre("Ce type de message en vue unique n'est pas pris en charge.");
            }
        } catch (_error) {
            console.error("❌ Erreur lors de l'envoi du message en vue unique :", _error.message || _error);
            return repondre("Une erreur est survenue lors du traitement du message.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "vv2",
        classe: "Outils",
        react: "👀",
        desc: "Affiche un message envoyé en vue unique en inbox",
    },
    async (ms_org, ovl, cmd_options) => {
        const { ms, msg_Repondu, repondre } = cmd_options;

        if (!msg_Repondu) {
            return repondre("Veuillez mentionner un message en vue unique.");
        }

        let viewOnceKey = Object.keys(msg_Repondu).find(key => key.startsWith("viewOnceMessage"));
        let vue_Unique_Message = msg_Repondu;

        if (viewOnceKey) {
            vue_Unique_Message = msg_Repondu[viewOnceKey].message;
        }

        if (vue_Unique_Message) {
            if (
                (vue_Unique_Message.imageMessage && vue_Unique_Message.imageMessage.viewOnce !== true) ||
                (vue_Unique_Message.videoMessage && vue_Unique_Message.videoMessage.viewOnce !== true) ||
                (vue_Unique_Message.audioMessage && vue_Unique_Message.audioMessage.viewOnce !== true)
            ) {
                return repondre("Ce message n'est pas un message en vue unique.");
            }
        }

        try {
            let media;
            let options = { quoted: ms };

            if (vue_Unique_Message.imageMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.imageMessage);
                await ovl.sendMessage(
                    ovl.user.id,
                    { image: { url: media }, caption: vue_Unique_Message.imageMessage.caption || "" },
                    options
                );

            } else if (vue_Unique_Message.videoMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.videoMessage);
                await ovl.sendMessage(
                    ovl.user.id,
                    { video: { url: media }, caption: vue_Unique_Message.videoMessage.caption || "" },
                    options
                );

            } else if (vue_Unique_Message.audioMessage) {
                media = await ovl.dl_save_media_ms(vue_Unique_Message.audioMessage);
                await ovl.sendMessage(
                    ovl.user.id,
                    { audio: { url: media }, mimetype: "audio/mp4", ptt: false },
                    options
                );

            } else {
                return repondre("Ce type de message en vue unique n'est pas pris en charge.");
            }
        } catch (_error) {
            console.error("❌ Erreur lors de l'envoi du message en vue unique :", _error.message || _error);
            return repondre("Une erreur est survenue lors du traitement du message.");
        }
    }
);

ovlcmd(
  {
    nom_cmd: "ping",
    classe: "Outils",
    react: "🏓",
    desc: "Mesure la latence du bot.",
  },
  async (ms_org, ovl, cmd_options) => {
    const start = Date.now();

    const msg_envoye = await ovl.sendMessage(ms_org, {
      text: "*OVL-MD-V2 Ping...*"
    }, { quoted: cmd_options.ms });

    const end = Date.now();
    const latency = end - start;

    await ovl.sendMessage(ms_org, {
      edit: msg_envoye.key,
      text: `*🏓 Pong ! Latence : ${latency}ms*`
    });
  }
);

ovlcmd(
    {
        nom_cmd: "uptime",
        classe: "Outils",
        react: "⏱️",
        desc: "Affiche le temps de fonctionnement du bot.",
        alias: ["upt"],
    },
    async (ms_org, ovl, cmd_options) => {
        const seconds = process.uptime();
        const j = Math.floor(seconds / 86400);
        const h = Math.floor((seconds / 3600) % 24);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        let uptime = '';
        if (j > 0) uptime += `${j}J `;
        if (h > 0) uptime += `${h}H `;
        if (m > 0) uptime += `${m}M `;
        if (s > 0) uptime += `${s}S`;
        await ovl.sendMessage(ms_org, { text: `⏳ Temps de fonctionnement : ${uptime}`, contextInfo }, { quoted: cmd_options.ms });
    }
);

ovlcmd(
    {
        nom_cmd: "translate",
        classe: "Outils",
        react: "🌍",
        desc: "Traduit un texte dans la langue spécifiée.",
        alias: ["trt"],
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, msg_Repondu } = cmd_options;
        let lang, text;

        if (msg_Repondu && arg.length === 1) {
            lang = arg[0];
            text = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
        } else if (arg.length >= 2) {
            lang = arg[0];
            text = arg.slice(1).join(" ");
        } else {
            return await ovl.sendMessage(ms_org, { text: `Utilisation : ${prefixe}translate <langue> <texte> ou répondre à un message avec : ${prefixe}translate <langue>` }, { quoted: ms });
        }

        try {
            const result = await translate(text, { to: lang });
            await ovl.sendMessage(ms_org, { text: `🌐Traduction (${lang}) :\n${result.text}` }, { quoted: ms });
        } catch (error) {
            console.error("Erreur lors de la traduction:", error);
            await ovl.sendMessage(ms_org, { text: "Erreur lors de la traduction. Vérifiez la langue et le texte fournis." }, { quoted: ms });
        }
    }
);

/*ovlcmd(
  {
    nom_cmd: "qr",
    classe: "Outils",
    desc: "Génère un QR code pour obtenir une session_id.",
  },
  async (ms_org, ovl, { ms }) => {
    try {
      const response = await axios.get(`https://premier-armadillo-ovl-02d9d108.koyeb.app/qr`);
      const qrImageBase64 = response.data.qr;

      const filePath = path.join(__dirname, 'qr_code.png');

      fs.writeFile(filePath, qrImageBase64, 'base64', async (err) => {
        if (err) {
          await ovl.sendMessage(ms_org, {
            text: "❌ Une erreur est survenue lors de la génération du QR code."
          }, { quoted: ms });
        } else {
          const sent = await ovl.sendMessage(ms_org, {
            image: { url: filePath },
          });

          await ovl.sendMessage(ms_org, {
            text: "✅ Scannez ce QR code dans *WhatsApp > Appareils connectés > Connecter un appareil*.",
          }, { quoted: sent });
        }
      });
    } catch (error) {
      await ovl.sendMessage(ms_org, {
        text: "❌ Une erreur est survenue lors de la génération du QR code."
      }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "pair",
    classe: "Outils",
    desc: "Génère un pair_code pour obtenir une session_id",
  },
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg.length) {
      return await ovl.sendMessage(ms_org, {
        text: "❌ Veuillez entrer un numéro de téléphone. Exemple :\n\n`pair 226XXXXXXXX`"
      }, { quoted: ms });
    }

    const number = arg.join(" ");

    try {
      const response = await axios.get(`https://premier-armadillo-ovl-02d9d108.koyeb.app/code?number=${number}`);
      const code = response.data.code || "indisponible";

      const sent = await ovl.sendMessage(ms_org, {
        text: code,
      });

      await ovl.sendMessage(ms_org, {
        text: "✅ Entrez ce code dans *WhatsApp > Appareils connectés > Connecter un appareil > Appairer avec un code*.",
      }, { quoted: sent });

    } catch (error) {
      await ovl.sendMessage(ms_org, {
        text: "❌ Une erreur est survenue lors de la génération du code."
      }, { quoted: ms });
    }
  }
);
*/
ovlcmd(
  {
    nom_cmd: "owner",
    classe: "Outils",
    react: "🔅",
    desc: "Numero du propriétaire du bot",
  },  
  async (ms_org, ovl, cmd_options) => {
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      'FN:' + config.NOM_OWNER + '\n' +
      'ORG:undefined;\n' +
      'TEL;type=CELL;type=VOICE;waid=' + config.NUMERO_OWNER + ':+' + config.NUMERO_OWNER + '\n' + 
      'END:VCARD';

    ovl.sendMessage(ms_org, {
      contacts: {
        displayName: config.NOM_OWNER,
        contacts: [{ vcard }],
      },
    }, { quoted: cmd_options.ms });
  }
);

ovlcmd(
  {
    nom_cmd: "developpeur",
    classe: "Outils",
    react: "🔅",
    desc: "Numero du créateur du bot",
    alias: ['dev'],
  },  
  async (ms_org, ovl, cmd_options) => {
    const devNum = '22651463203';
    const devNom = 'Ainz';

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      'FN:' + devNom + '\n' +
      'ORG:undefined;\n' +
      'TEL;type=CELL;type=VOICE;waid=' + devNum + ':+' + devNum + '\n' + 
      'END:VCARD';

    ovl.sendMessage(ms_org, {
      contacts: {
        displayName: devNom,
        contacts: [{ vcard }],
      },
    }, { quoted: cmd_options.ms });
  }
);


ovlcmd(
  {
    nom_cmd: "support",
    classe: "Outils",
    react: "📩",
    desc: "Lien vers le groupe de support du bot",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, repondre, auteur_Message, ms } = cmd_options;

    const inviteLink = 'https://chat.whatsapp.com/HzhikAmOuYhFXGLmcyMo62';
    const message = `📩 *OVL-MD SUPPORT*\nVoici le lien pour rejoindre le groupe:\n${inviteLink}`;

    if (verif_Groupe) {
      await repondre("📩 Le lien d'invitation a été envoyé en message privé.");
      await ovl.sendMessage(auteur_Message, { text: message, contextInfo }, { quoted: ms });
     } else {
      await ovl.sendMessage(ms_org, { text: message, contextInfo}, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "repo",
    alias: ["sc", "script", "code_source", "repository"],
    classe: "Outils",
    react: "📦",
    desc: "Affiche les informations et le lien du repository du bot"
  },
  async (ms_org, ovl, { ms, repondre }) => {
    const repoUrl = "https://github.com/Ainz-devs/OVL-MD-V2";
    let caption;

    try {
      const { data } = await axios.get("https://api.github.com/repos/Ainz-devs/OVL-MD-V2");
      caption = `
╭───⟪ 📦 OVL-MD-V2 ⟫───╮
│ ⇨ ⭐ Stars       : ${data.stargazers_count}
│ ⇨ 🍴 Forks       : ${data.forks_count}
│ ⇨ 🔄 Dernière MAJ : ${new Date(data.updated_at).toLocaleDateString("fr-FR")}
│ ⇨ 🔗 Repo        : ${data.html_url}
╰───────────────────╯
> ©2025 ᴏᴠʟ-ᴍᴅ-ᴠ2 ʙʏ *ᴀɪɴᴢ*`;
    } catch (e) {
      console.error("Erreur récupération API :", e);
      caption = `
╭───⟪ 📦 OVL-MD-V2 ⟫───╮
│ 🔗 Repo : ${repoUrl}
╰───────────────────╯
> ©2025 ᴏᴠʟ-ᴍᴅ-ᴠ2 ʙʏ *ᴀɪɴᴢ*`;
    }

    try {
      await ovl.sendMessage(ms_org, {
        image: { url: "https://files.catbox.moe/lojrxz.jpg" },
        caption,
        contextInfo
      }, { quoted: ms });
    } catch (e) {
      console.error("Erreur envoi avec image :", e);
      await ovl.sendMessage(ms_org, { text: caption, contextInfo }, { quoted: ms });
    }
  }
);
