const { ovlcmd, cmd } = require("../lib/ovlcmd");
const config = require("../set");
const { translate } = require('@vitalets/google-translate-api');
const prefixe = config.PREFIXE;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { TempMail } = require("tempmail.lol");
const JavaScriptObfuscator = require('javascript-obfuscator');
const { exec } = require('child_process');
const AdmZip = require('adm-zip');
const os = require('os');


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

ovlcmd(
    {
        nom_cmd: "test",
        classe: "Outils",
        react: "🌟",
        desc: "Tester la connectivité du bot"
    },
    async (ms_org, ovl, cmd_options) => {
        try {
           const themePath = './lib/theme.json';
           const rawData = fs.readFileSync(themePath, 'utf8');
           const themes = JSON.parse(rawData);

            let lien;
        if (config.THEME.startsWith("http://") || config.THEME.startsWith("https://")) {
          lien = config.THEME;
        } else {
          const selectedTheme = themes.find(t => t.id === config.THEME);
          if (!selectedTheme) throw new Error("Thème introuvable dans le fichier JSON");
          lien = selectedTheme.theme[Math.floor(Math.random() * selectedTheme.theme.length)];
        }
            const menu = `🌐 Bienvenue sur *OVL-MD-V2*, votre bot WhatsApp multi-device.🔍 Tapez *${config.PREFIXE}menu* pour voir toutes les commandes disponibles.\n> ©2025 OVL-MD-V2 By *AINZ*`;

            if (lien.endsWith(".mp4")) {
                await ovl.sendMessage(ms_org, {
                    video: { url: lien },
                    caption: stylize(menu),
                    gifPlayback: true,
                }, { quoted: cmd_options.ms });
            } else {
                await ovl.sendMessage(ms_org, {
                    image: { url: lien },
                    caption: stylize(menu)
                }, { quoted: cmd_options.ms });
            }

        } catch (error) {
            console.error("Erreur lors de l'envoi du message de test :", error.message || error);
        }
    }
);

ovlcmd(
    {
        nom_cmd: "description",
        classe: "Outils",
        desc: "Affiche la liste des commandes avec leurs descriptions ou les détails d'une commande spécifique.",
        alias: ["desc", "help"],
    },
    async (ms_org, ovl, cmd_options) => {
        try {
            const { arg, ms } = cmd_options;
            const commandes = cmd;

            if (arg.length) {
                const recherche = arg[0].toLowerCase();
                const commandeTrouvee = commandes.find(
                    (c) =>
                        c.nom_cmd.toLowerCase() === recherche ||
                        c.alias.some((alias) => alias.toLowerCase() === recherche)
                );

                if (commandeTrouvee) {
                    const message = `♻️*Détails de la commande :*\n\n` +
                        `Nom : *${commandeTrouvee.nom_cmd}*\n` +
                        `Alias : [${commandeTrouvee.alias.join(", ")}]\n` +
                        `Description : ${commandeTrouvee.desc}`;
                    return await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
                } else {
                    return await ovl.sendMessage(ms_org, {
                        text: `❌ Commande ou alias "${recherche}" introuvable. Vérifiez et réessayez.`,
                    }, { quoted: ms });
                }
            }

            let descriptionMsg = "♻️*Liste des commandes disponibles :*\n\n";
            commandes.forEach((cmd) => {
                descriptionMsg += `Nom : *${cmd.nom_cmd}*\nAlias : [${cmd.alias.join(", ")}]\nDescription : ${cmd.desc}\n\n`;
            });

            await ovl.sendMessage(ms_org, { text: descriptionMsg }, { quoted: ms });
        } catch (error) {
            console.error("Erreur lors de l'affichage des descriptions :", error.message || error);
            await ovl.sendMessage(ms_org, { text: "Une erreur s'est produite lors de l'affichage des descriptions." }, { quoted: cmd_options.ms });
        }
    }
);

ovlcmd(
  {
    nom_cmd: "theme",
    classe: "Outils",
    react: "🎨",
    desc: "Gérer les thèmes disponibles"
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms, repondre } = cmd_options;

    try {
      const themePath = './lib/theme.json';
      const rawData = fs.readFileSync(themePath, 'utf8');
      const themesData = JSON.parse(rawData);

      const afficherAide = () => {
        const exemple = `${config.PREFIXE}theme 2`;
        const exempleUrl = `${config.PREFIXE}theme https://exemple.com/mon_theme.jpg`;
        return ovl.sendMessage(ms_org, {
          text:
            `🎨 *Utilisation de la commande thème :*\n\n` +
            `• *${config.PREFIXE}theme list* : Affiche la liste des thèmes disponibles\n` +
            `• *${config.PREFIXE}theme <numéro>* : Applique un thème en utilisant son numéro dans la liste\n` +
            `• *${config.PREFIXE}theme <url>* : Utilise une image personnalisée depuis un lien externe\n\n` +
            `📌 *Exemples :*\n` +
            `- ${exemple}\n` +
            `- ${exempleUrl}`,
        }, { quoted: ms });
      };

      if (arg.length === 0) return afficherAide();

      const sousCmd = arg[0].toLowerCase();

      if (sousCmd === "list") {
        let msg = "*🎨 Liste des thèmes disponibles :*\n";
        themesData.forEach((theme, i) => {
          msg += `${i + 1}. ${theme.nom}\n`;
        });
        return ovl.sendMessage(ms_org, {
          image: { url: 'https://files.catbox.moe/6xlk10.jpg' },
          caption: msg
        }, { quoted: ms });
      }

      if (sousCmd.startsWith("http://") || sousCmd.startsWith("https://")) {
        const setPath = path.join(__dirname, '../set.js');
        let contenu = fs.readFileSync(setPath, 'utf8');
        contenu = contenu.replace(/THEME:\s*".*?"/, `THEME: "${sousCmd}"`);
        fs.writeFileSync(setPath, contenu);

        await ovl.sendMessage(ms_org, {
          text: `✅ Thème personnalisé défini avec succès depuis le lien fourni.\n🔄 Redémarrage du bot...`
        }, { quoted: ms });

        exec('pm2 restart all');
        return;
      }

      const numero = parseInt(sousCmd, 10);
      if (isNaN(numero) || numero < 1 || numero > themesData.length) {
        return ovl.sendMessage(ms_org, {
          text: `❌ Numéro invalide.\n📌 Utilise *${config.PREFIXE}theme list* pour voir les numéros disponibles.`
        }, { quoted: ms });
      }

      const selectedTheme = themesData[numero - 1];
      const themeId = selectedTheme.id;
      const themeName = selectedTheme.nom;

      const setPath = path.join(__dirname, '../set.js');
      let contenu = fs.readFileSync(setPath, 'utf8');
      contenu = contenu.replace(/THEME:\s*".*?"/, `THEME: "${themeId}"`);
      fs.writeFileSync(setPath, contenu);

      await ovl.sendMessage(ms_org, {
        text: `✅ Thème *${themeName}* sélectionné avec succès !\n🔄 Redémarrage du bot...`
      }, { quoted: ms });

      exec('pm2 restart all');

    } catch (err) {
      console.error("Erreur dans la commande theme :", err);
      return ovl.sendMessage(ms_org, {
        text: "❌ Une erreur est survenue lors du traitement de la commande."
      }, { quoted: ms });
    }
  }
);

ovlcmd(
    {
        nom_cmd: "menu",
        classe: "Outils",
        react: "🔅",
        desc: "Affiche le menu du bot",
    },
    async (ms_org, ovl, cmd_options) => {
        try {
            const arg = cmd_options.arg;
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

            let menu = "";

            if (arg.length === 0) {
                menu += `╭──⟪ 🤖 OVL-MD BOT V2 ⟫──╮
├ ߷ Préfixe       : ${config.PREFIXE}
├ ߷ Owner         : ${config.NOM_OWNER}
├ ߷ Commandes  : ${commandes.length}
├ ߷ Uptime        : ${uptime.trim()}
├ ߷ D-H: ${dateStr} - ${heureStr}
├ ߷ Plateforme  : ${platform}
├ ߷ Développeur : AINZ
├ ߷ Version        : 2.0.0
╰──────────────────╯\n\n`;

                menu += "╭───⟪ Catégories ⟫───╮\n";
                classesSorted.forEach((classe, i) => {
                    menu += `├ ߷ ${i + 1} • ${classe}\n`;
                });
                menu += "╰───────────────────╯\n";
                menu += `
💡 Tape *${config.PREFIXE}menu <numéro>* pour voir ses commandes.
📌 Exemple : *${config.PREFIXE}menu 1*

> ©2025 OVL-MD-V2 By *AINZ*`;
            } else {
                const input = parseInt(arg[0], 10);
                if (isNaN(input) || input < 1 || input > classesSorted.length) {
                    await ovl.sendMessage(ms_org, {
                        text:`Catégorie introuvable : ${arg[0]}`
                    }, { quoted: cmd_options.ms });
                    return;
                }
                const classeSelectionnee = classesSorted[input - 1];
                menu += `╭────⟪ ${classeSelectionnee.toUpperCase()} ⟫────╮\n`;
                cmd_classe[classeSelectionnee].forEach((cmd) => {
                    menu += `├ ߷ ${cmd.nom_cmd}\n`;
                });
                menu += `╰──────────────────╯\n\nTape *${config.PREFIXE}menu* pour revenir au menu principal.`;
            }

            const themePath = './lib/theme.json';
            const rawData = fs.readFileSync(themePath, 'utf8');
            const themes = JSON.parse(rawData);

            let lien;
        if (config.THEME.startsWith("http://") || config.THEME.startsWith("https://")) {
          lien = config.THEME;
        } else {
          const selectedTheme = themes.find(t => t.id === config.THEME);
          if (!selectedTheme) throw new Error("Thème introuvable dans le fichier JSON");
          lien = selectedTheme.theme[Math.floor(Math.random() * selectedTheme.theme.length)];
        }

            if (lien.endsWith(".mp4")) {
                await ovl.sendMessage(ms_org, {
                    video: { url: lien },
                    caption: stylize(menu),
                    gifPlayback: true
                }, { quoted: cmd_options.ms });
            } else {
                await ovl.sendMessage(ms_org, {
                    image: { url: lien },
                    caption: stylize(menu)
                }, { quoted: cmd_options.ms });
            }

        } catch (error) {
            console.error("Erreur lors de la génération du menu :", error.message || error);
            await ovl.sendMessage(ms_org, {
                text: "Une erreur est survenue lors de la génération du menu."
            }, { quoted: cmd_options.ms });
        }
    }
);

ovlcmd(
    {
        nom_cmd: "allmenu",
        classe: "Outils",
        react: "📜",
        desc: "Affiche toutes les commandes du bot",
    },
    async (ms_org, ovl, cmd_options) => {
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

            let menu = `╭──⟪ 🤖 OVL-MD BOT V2 ⟫──╮
├ ߷ Préfixe       : ${config.PREFIXE}
├ ߷ Owner         : ${config.NOM_OWNER}
├ ߷ Commandes  : ${commandes.length}
├ ߷ Uptime        : ${uptime.trim()}
├ ߷ D-H: ${dateStr} - ${heureStr}
├ ߷ Plateforme  : ${platform}
├ ߷ Développeur : AINZ
├ ߷ Version        : 2.0.0
╰──────────────────╯\n\n`;

            for (const classe of classesSorted) {
                menu += `╭──⟪ ${classe.toUpperCase()} ⟫──╮\n`;
                cmd_classe[classe].forEach((cmd) => {
                    menu += `├ ߷ ${cmd.nom_cmd}\n`;
                });
                menu += `╰──────────────────╯\n\n`;
            }

            menu += `> ©2025 OVL-MD-V2 By *AINZ*`;

            const themePath = './lib/theme.json';
            const rawData = fs.readFileSync(themePath, 'utf8');
            const themes = JSON.parse(rawData);

            let lien;
        if (config.THEME.startsWith("http://") || config.THEME.startsWith("https://")) {
          lien = config.THEME;
        } else {
          const selectedTheme = themes.find(t => t.id === config.THEME);
          if (!selectedTheme) throw new Error("Thème introuvable dans le fichier JSON");
          lien = selectedTheme.theme[Math.floor(Math.random() * selectedTheme.theme.length)];
        }
            
            if (lien.endsWith(".mp4")) {
                await ovl.sendMessage(ms_org, {
                    video: { url: lien },
                    caption: stylize(menu),
                    gifPlayback: true
                }, { quoted: cmd_options.ms });
            } else {
                await ovl.sendMessage(ms_org, {
                    image: { url: lien },
                    caption: stylize(menu)
                }, { quoted: cmd_options.ms });
            }

        } catch (error) {
            console.error("Erreur lors de la génération de allmenu :", error.message || error);
            await ovl.sendMessage(ms_org, {
                text: "Une erreur est survenue lors de l'affichage du menu complet."
            }, { quoted: cmd_options.ms });
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
        await ovl.sendMessage(ms_org, { text: `⏳ Temps de fonctionnement : ${uptime}` }, { quoted: cmd_options.ms });
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

ovlcmd(
  {
    nom_cmd: "capture",
    classe: "Outils",
    react: "📸",
    desc: "Prend une capture d'écran d'un site web.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, prefixe, ms } = cmd_options;

    if (!arg[0]) {
      return ovl.sendMessage(ms_org, {
        text: `Entrez un lien`,
      }, { quoted: ms });
    }

      const url = arg[0];

    try {
      const screenshot = await axios.get(`https://api.kenshiro.cfd/api/tools/ssweb?url=${encodeURIComponent(url)}&type=mobile&mode=dark`, {
        responseType: 'arraybuffer',
      }); 

      await ovl.sendMessage(ms_org, {
        image:  screenshot.data, 
        caption: `Voici la capture d'écran de: ${url}`,
      }, { quoted: ms });
    } catch (error) {
      console.error('Erreur lors de la capture de l\'écran:', error.message); // Log pour l'erreur générale
      return ovl.sendMessage(ms_org, {
        text: "Une erreur est survenue lors de la capture du site. Veuillez réessayer plus tard.",
      }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "system_status",
    classe: "Outils",
    react: "🖥️",
    desc: "Affiche les informations du système en temps réel"
  },
  async (ms_org, ovl, cmd_options) => {
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const hostname = os.hostname();
    const loadAverage = os.loadavg();
    const uptimeSeconds = os.uptime();

    const j = Math.floor(uptimeSeconds / 86400);
    const h = Math.floor((uptimeSeconds / 3600) % 24);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    const s = Math.floor(uptimeSeconds % 60);
    let uptime = '';
    if (j > 0) uptime += `${j}J `;
    if (h > 0) uptime += `${h}H `;
    if (m > 0) uptime += `${m}M `;
    if (s > 0) uptime += `${s}S`;

    const cpuUsage = cpus.map(cpu => {
      let total = 0;
      for (type in cpu.times) {
        total += cpu.times[type];
      }
      const usage = ((100 - (cpu.times.idle / total) * 100)).toFixed(2);
      return usage + "%";
    }).join(", ");

    const serverSpeed = (100 - loadAverage[0] * 100 / cpus.length).toFixed(2);

    await ovl.sendMessage(ms_org, {
      text: `🖥️ *ÉTAT DU SYSTÈME*\n\n` +
            `⚡ *Vitesse du serveur*: ${serverSpeed} %\n` +
            `🖧 *Charge Moyenne*: ${loadAverage.map(l => l.toFixed(2)).join(", ")}\n` +
            `⏳ *Uptime*: ${uptime.trim()}\n` +
            `💻 *Plateforme*: ${platform}\n` +
            `🔧 *Architecture*: ${arch}\n` +
            `🖧 *Processeur*: ${cpus.length} Cœur(s) (${cpuUsage})\n` +
            `💾 *Mémoire Totale*: ${totalMemory} GB\n` +
            `🆓 *Mémoire Libre*: ${freeMemory} GB\n` +
            `🌐 *Nom de l'Hôte*: ${hostname}\n` +
            `🎉 *Version*: OVL-MD 1.0.0`
    }, { quoted: cmd_options.ms });
  }
);

ovlcmd(
    {
        nom_cmd: "qr",
        classe: "Outils",
        desc: "Génère un QR code pour obtenir une session_id.",
    },
    async (ms_org, ovl, cmd_options) => {
        const { ms } = cmd_options;
        
        try {
            const response = await axios.get(`https://premier-armadillo-ovl-02d9d108.koyeb.app/qr`);
            const qrImageBase64 = response.data.qr;

            const filePath = path.join(__dirname, 'qr_code.png');  

            fs.writeFile(filePath, qrImageBase64, 'base64', async (err) => {
                if (err) {
                    console.error("Erreur lors de l'écriture du fichier :", err);
                    await ovl.sendMessage(ms_org, { text: "Désolé, il y a eu une erreur lors de la génération du QR code." }, { quoted: ms });
                } else {
                    console.log("Image sauvegardée avec succès !");
                    
                    await ovl.sendMessage(ms_org, {
                        image: { url: filePath, caption: "Scannez ce QR code" }
                    }, { quoted: ms });
                }
            });

        } catch (error) {
            console.error("Erreur lors de la génération du QR code:", error);
            await ovl.sendMessage(ms_org, { text: "Désolé, il y a eu une erreur lors de la génération du QR code." }, { quoted: ms });
        }
    }
);

ovlcmd(
    {
        nom_cmd: "pair",
        classe: "Outils",
        desc: "Génère un pair_code pour obtenir une session_id",
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms } = cmd_options;
       if(!arg) {
            return await ovl.sendMessage(ms_org, { text: "entrer un numéro de téléphone" }, { quoted: ms });
        }
        const bc = arg.join(" ");

        try {
            let response = await axios(`https://premier-armadillo-ovl-02d9d108.koyeb.app/code?number=${bc}`);
            let code = response.data.code || "indisponible";

            await ovl.sendMessage(ms_org, {
                text: `CODE : ${code}`,
            }, { quoted: ms });
        } catch (error) {
            console.error("Erreur lors de la génération du code:", error);
            await ovl.sendMessage(ms_org, { text: "Désolé, il y a eu une erreur lors de la génération du code." }, { quoted: ms });
        }
    }
);

ovlcmd(
  {
    nom_cmd: "tempmail",
    classe: "Outils",
    react: "📧",
    desc: "Crée un email temporaire."
  },
  async (ms_org, ovl, cmd_options) => {
    const { ms } = cmd_options;

    try {
      const tempmail = new TempMail();
      const inbox = await tempmail.createInbox();
      
      const emailMessage = `Voici votre adresse email temporaire : ${inbox.address}\n\nVotre token est : ${inbox.token}\n\nPour récupérer vos messages, utilisez <tempinbox votre-token>.`;

      await ovl.sendMessage(ms_org, { text: emailMessage }, {quoted: ms});
      
    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: "Une erreur s'est produite lors de la création de l'email temporaire." }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "tempinbox",
    classe: "Outils",
    react: "📩",
    desc: "Récupère les messages d'un email temporaire."
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms } = cmd_options;

    if (!arg[0]) return ovl.sendMessage(ms_org, { text: "Pour récupérer les messages de votre email temporaire, fournissez le token qui a été émis." });

    try {
      const tempmail = new TempMail();
      const emails = await tempmail.checkInbox(arg[0]);

      if (!emails || emails.length === 0) {
        return ovl.sendMessage(ms_org, { text: "Aucun message trouvé pour ce token." }, {quoted: ms});
      }

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const sender = email.sender;
        const subject = email.subject;
        const date = new Date(email.date).toLocaleString();

        const messageBody = email.body;

        const mailMessage = `👥 Expéditeur : ${sender}\n📝 Sujet : ${subject}\n🕜 Date : ${date}\n📩 Message : ${messageBody}`;

        await ovl.sendMessage(ms_org, { text: mailMessage }, {quoted: ms});
      }
      
    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: "Une erreur est survenue lors de la récupération des messages de l'email temporaire." }, {quoted: ms});
    }
  }
);

ovlcmd(
  {
    nom_cmd: "obfuscate",
    classe: "Outils",
    react: "📥",
    desc: "Obfusque du code JavaScript",
    alias: ['obf'],
  },  
  async (ms_org, ovl, cmd_options) => {
    const { arg, repondre, ms } = cmd_options;
    if (!arg || arg.length === 0) return repondre("Veuillez fournir le code JavaScript à obfusquer.");
    const codeToObfuscate = arg.join(" ");
    try {
      repondre('🔄obfucation en cours...');
      const obfuscatedCode = JavaScriptObfuscator.obfuscate(codeToObfuscate, { compact: true, controlFlowFlattening: true }).getObfuscatedCode();
      const tempFilePath = path.join(__dirname, 'obfuscate.js');
      fs.writeFileSync(tempFilePath, obfuscatedCode);
      await ovl.sendMessage(ms_org, { document: { url: tempFilePath }, mimetype: 'application/javascript', fileName: 'obfuscate.js' }, { quoted: ms });
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(error);
      repondre("Une erreur est survenue lors de l'obfuscation du code.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gitclone",
    classe: "Outils",
    react: "📥",
    desc: "clone un repo Git",
    alias: ['gcl'],
  },  
  async (ms_org, ovl, cmd_options) => {
    const { arg, repondre, ms } = cmd_options;
    if (!arg || arg.length < 1) return repondre("Veuillez fournir l'URL du dépôt Git à cloner.");
    const dp = arg[0];
    const repoUrl = dp + '.git';
    const destination = arg[1] ? arg[1] : path.basename(repoUrl, '.git');
    const tempZipPath = `${destination}.zip`;
    const gitUrlPattern = /^(https?:\/\/|git@)([\w.@:\/-]+)(\.git)(\/?)$/;
    if (!gitUrlPattern.test(repoUrl)) return repondre("URL de dépôt Git invalide.");
    try {
      repondre(`🔄Clonage du dépôt en cours...`);
      exec(`git clone ${repoUrl} ${destination}`, (error, stdout, stderr) => {
        if (error) return repondre(`Erreur lors du clonage du dépôt : ${error.message}`);
        try {
          const zip = new AdmZip();
          zip.addLocalFolder(destination);
          zip.writeZip(tempZipPath);
          const documentMessage = { document: fs.readFileSync(tempZipPath), mimetype: 'application/zip', fileName: `${destination}.zip` };
          ovl.sendMessage(ms_org, documentMessage, { quoted: ms });
          fs.rmSync(destination, { recursive: true, force: true });
          fs.unlinkSync(tempZipPath);
        } catch (zipError) {
          repondre(`Erreur lors de la compression en zip : ${zipError.message}`);
        }
      });
    } catch (error) {
      console.error(error);
      repondre("Une erreur est survenue lors du clonage du dépôt.");
    }
  }
);

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
    const { verif_Groupe, repondre, auteur_msg, ms } = cmd_options;

    const inviteLink = 'https://chat.whatsapp.com/HzhikAmOuYhFXGLmcyMo62';
    const message = `📩 *OVL-MD-V2 SUPPORT*\nVoici le lien pour rejoindre le groupe:\n${inviteLink}`;

    await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
  }
);
