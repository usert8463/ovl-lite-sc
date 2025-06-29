const { ovlcmd, cmd } = require("../lib/ovlcmd");
const { t } = require('../lib/funcLangue');
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
      if (!cmd_options.prenium_id) {
        return ovl.sendMessage(ms_org, {
          text: t("no_permission")
        }, { quoted: ms_org });
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

      const caption = stylize(t("test_caption", { prefixe: config.PREFIXE }));

      if (lien.endsWith(".mp4")) {
        await ovl.sendMessage(ms_org, {
          video: { url: lien },
          caption,
          gifPlayback: true,
        }, { quoted: cmd_options.ms });
      } else {
        await ovl.sendMessage(ms_org, {
          image: { url: lien },
          caption
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
          const message = t("desc_detail", {
            nom: commandeTrouvee.nom_cmd,
            alias: commandeTrouvee.alias.join(", "),
            description: commandeTrouvee.desc,
          });
          return await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
        } else {
          return await ovl.sendMessage(ms_org, {
            text: t("desc_not_found", { recherche }),
          }, { quoted: ms });
        }
      }

      let descriptionMsg = `${t("desc_list_title")}\n\n`;

      commandes.forEach((cmd) => {
        descriptionMsg += `${t("desc_line", {
          nom: cmd.nom_cmd,
          alias: cmd.alias.join(", "),
          description: cmd.desc
        })}\n\n`;
      });

      await ovl.sendMessage(ms_org, { text: descriptionMsg }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'affichage des descriptions :", error.message || error);
      await ovl.sendMessage(ms_org, {
        text: t("desc_error")
      }, { quoted: cmd_options.ms });
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
    const { arg, ms } = cmd_options;

    try {
      const themePath = './lib/theme.json';
      const rawData = fs.readFileSync(themePath, 'utf8');
      const themesData = JSON.parse(rawData);

      const afficherAide = () => {
        return ovl.sendMessage(ms_org, {
          text: t("theme_help", {
            prefixe: config.PREFIXE
          })
        }, { quoted: ms });
      };

      if (arg.length === 0) return afficherAide();

      const sousCmd = arg[0].toLowerCase();

      if (sousCmd === "list") {
        let msg = t("theme_list_title") + "\n";
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
          text: t("theme_custom_set")
        }, { quoted: ms });

        exec('pm2 restart all');
        return;
      }

      const numero = parseInt(sousCmd, 10);
      if (isNaN(numero) || numero < 1 || numero > themesData.length) {
        return ovl.sendMessage(ms_org, {
          text: t("theme_invalid_number", { prefixe: config.PREFIXE })
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
        text: t("theme_selected", { theme: themeName })
      }, { quoted: ms });

      exec('pm2 restart all');

    } catch (err) {
      console.error("Erreur dans la commande theme :", err);
      return ovl.sendMessage(ms_org, {
        text: t("theme_error")
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
        menu += t("menu_header", {
          prefixe: config.PREFIXE,
          owner: config.NOM_OWNER,
          total_cmd: commandes.length,
          uptime: uptime.trim(),
          date: dateStr,
          heure: heureStr,
          platform
        }) + "\n\n";

        menu += t("menu_categories_title") + "\n";
        classesSorted.forEach((classe, i) => {
          menu += t("menu_category_line", { index: i + 1, name: classe }) + "\n";
        });

        menu += t("menu_categories_footer", { prefixe: config.PREFIXE });
      } else {
        const input = parseInt(arg[0], 10);
        if (isNaN(input) || input < 1 || input > classesSorted.length) {
          await ovl.sendMessage(ms_org, {
            text: t("menu_invalid_category", { arg: arg[0] })
          }, { quoted: cmd_options.ms });
          return;
        }

        const classeSelectionnee = classesSorted[input - 1];
        menu += t("menu_selected_class_header", { classe: classeSelectionnee }) + "\n";
        cmd_classe[classeSelectionnee].forEach((cmd) => {
          menu += t("menu_command_line", { nom: cmd.nom_cmd }) + "\n";
        });
        menu += t("menu_back_tip", { prefixe: config.PREFIXE });
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
        text: t("menu_error")
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

      let menu = t("menu_header", {
        prefixe: config.PREFIXE,
        owner: config.NOM_OWNER,
        total_cmd: commandes.length,
        uptime: uptime.trim(),
        date: dateStr,
        heure: heureStr,
        platform
      }) + "\n\n";

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
        text: t("menu_error")
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

    if (!msg_Repondu) return repondre(t("vue_unique_aucun"));

    const viewOnceKey = Object.keys(msg_Repondu).find(k => k.startsWith("viewOnceMessage"));
    const vue_Unique_Message = viewOnceKey ? msg_Repondu[viewOnceKey].message : msg_Repondu;

    const isValid =
      (vue_Unique_Message.imageMessage && vue_Unique_Message.imageMessage.viewOnce) ||
      (vue_Unique_Message.videoMessage && vue_Unique_Message.videoMessage.viewOnce) ||
      (vue_Unique_Message.audioMessage && vue_Unique_Message.audioMessage.viewOnce);

    if (!isValid) return repondre(t("vue_unique_non"));

    try {
      let media;
      const options = { quoted: ms };

      if (vue_Unique_Message.imageMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.imageMessage);
        await ovl.sendMessage(ms_org, {
          image: { url: media },
          caption: vue_Unique_Message.imageMessage.caption || ""
        }, options);
      } else if (vue_Unique_Message.videoMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.videoMessage);
        await ovl.sendMessage(ms_org, {
          video: { url: media },
          caption: vue_Unique_Message.videoMessage.caption || ""
        }, options);
      } else if (vue_Unique_Message.audioMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.audioMessage);
        await ovl.sendMessage(ms_org, {
          audio: { url: media },
          mimetype: "audio/mp4",
          ptt: false
        }, options);
      } else {
        return repondre(t("vue_unique_non_supporte"));
      }
    } catch (err) {
      console.error("❌ Erreur :", err.message || err);
      return repondre(t("vue_unique_erreur"));
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

    if (!msg_Repondu) return repondre(t("vue_unique_aucun"));

    const viewOnceKey = Object.keys(msg_Repondu).find(k => k.startsWith("viewOnceMessage"));
    const vue_Unique_Message = viewOnceKey ? msg_Repondu[viewOnceKey].message : msg_Repondu;

    const isValid =
      (vue_Unique_Message.imageMessage && vue_Unique_Message.imageMessage.viewOnce) ||
      (vue_Unique_Message.videoMessage && vue_Unique_Message.videoMessage.viewOnce) ||
      (vue_Unique_Message.audioMessage && vue_Unique_Message.audioMessage.viewOnce);

    if (!isValid) return repondre(t("vue_unique_non"));

    try {
      let media;
      const options = { quoted: ms };

      if (vue_Unique_Message.imageMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.imageMessage);
        await ovl.sendMessage(ovl.user.id, {
          image: { url: media },
          caption: vue_Unique_Message.imageMessage.caption || ""
        }, options);
      } else if (vue_Unique_Message.videoMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.videoMessage);
        await ovl.sendMessage(ovl.user.id, {
          video: { url: media },
          caption: vue_Unique_Message.videoMessage.caption || ""
        }, options);
      } else if (vue_Unique_Message.audioMessage) {
        media = await ovl.dl_save_media_ms(vue_Unique_Message.audioMessage);
        await ovl.sendMessage(ovl.user.id, {
          audio: { url: media },
          mimetype: "audio/mp4",
          ptt: false
        }, options);
      } else {
        return repondre(t("vue_unique_non_supporte"));
      }
    } catch (err) {
      console.error("❌ Erreur inbox :", err.message || err);
      return repondre(t("vue_unique_erreur"));
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
  async (ms, ovl, cmd_options) => {
    const start = Date.now();

    const msg_envoye = await ovl.sendMessage(ms, {
      text: t('ping_msg')
    }, { quoted: cmd_options.ms });

    const end = Date.now();
    const latency = end - start;

    await ovl.sendMessage(ms, {
      edit: msg_envoye.key,
      text: t('ping_result', { latency })
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
  async (ms_org, ovl, { ms }) => {
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

    await ovl.sendMessage(ms_org, { text: `${t("uptime_msg")}: ${uptime}` }, { quoted: ms });
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
  async (ms_org, ovl, { arg, ms, msg_Repondu }) => {
    let lang, text;

    if (msg_Repondu && arg.length === 1) {
      lang = arg[0];
      text = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
    } else if (arg.length >= 2) {
      lang = arg[0];
      text = arg.slice(1).join(" ");
    } else {
      return await ovl.sendMessage(ms_org, { text: t("translate_usage") }, { quoted: ms });
    }

    try {
      const result = await translate(text, { to: lang });
      await ovl.sendMessage(ms_org, {
        text: `🌐 ${t("translate_result")} (${lang}) :\n${result.text}`
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur traduction:", error);
      await ovl.sendMessage(ms_org, { text: t("translate_error") }, { quoted: ms });
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
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg[0]) {
      return ovl.sendMessage(ms_org, { text: t("capture_missing_url") }, { quoted: ms });
    }

    const url = arg[0];

    try {
      const screenshot = await axios.get(`https://api.kenshiro.cfd/api/tools/ssweb?url=${encodeURIComponent(url)}&type=mobile&mode=dark`, {
        responseType: 'arraybuffer',
      });

      await ovl.sendMessage(ms_org, {
        image: screenshot.data,
        caption: `${t("capture_result")} ${url}`,
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur capture :", error.message);
      return ovl.sendMessage(ms_org, { text: t("capture_error") }, { quoted: ms });
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
  async (ms_org, ovl, { ms }) => {
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const totalMemory = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemory = (os.freemem() / (1024 ** 3)).toFixed(2);
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
      for (const type in cpu.times) total += cpu.times[type];
      return ((100 - (cpu.times.idle / total) * 100)).toFixed(2) + "%";
    }).join(", ");

    const serverSpeed = (100 - loadAverage[0] * 100 / cpus.length).toFixed(2);

    await ovl.sendMessage(ms_org, {
      text: `🖥️ *${t("system_status_title")}*\n\n` +
            `⚡ *${t("server_speed")}*: ${serverSpeed} %\n` +
            `🖧 *${t("load_average")}*: ${loadAverage.map(l => l.toFixed(2)).join(", ")}\n` +
            `⏳ *${t("uptime")}*: ${uptime.trim()}\n` +
            `💻 *${t("platform")}*: ${platform}\n` +
            `🔧 *${t("architecture")}*: ${arch}\n` +
            `🖧 *${t("cpu")}*: ${cpus.length} ${t("cores")} (${cpuUsage})\n` +
            `💾 *${t("total_memory")}*: ${totalMemory} GB\n` +
            `🆓 *${t("free_memory")}*: ${freeMemory} GB\n` +
            `🌐 *${t("hostname")}*: ${hostname}\n` +
            `🎉 *${t("bot_version")}*: OVL-MD 2.0.0`
    }, { quoted: ms });
  }
);

ovlcmd(
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
          console.error("Erreur QR:", err);
          await ovl.sendMessage(ms_org, { text: t("qr_error") }, { quoted: ms });
        } else {
          await ovl.sendMessage(ms_org, {
            image: { url: filePath },
            caption: t("qr_scan")
          }, { quoted: ms });
        }
      });
    } catch (error) {
      console.error("Erreur QR:", error);
      await ovl.sendMessage(ms_org, { text: t("qr_error") }, { quoted: ms });
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
    if (!arg || !arg.length) {
      return await ovl.sendMessage(ms_org, { text: t("pair_missing_number") }, { quoted: ms });
    }

    const numero = arg.join(" ");

    try {
      const response = await axios(`https://premier-armadillo-ovl-02d9d108.koyeb.app/code?number=${numero}`);
      const code = response.data.code || "indisponible";

      await ovl.sendMessage(ms_org, {
        text: `🔑 ${t("pair_code")}: ${code}`
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur Pair:", error);
      await ovl.sendMessage(ms_org, { text: t("pair_error") }, { quoted: ms });
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
  async (ms_org, ovl, { ms }) => {
    try {
      const tempmail = new TempMail();
      const inbox = await tempmail.createInbox();

      const emailMessage = `${t("tempmail_address")}: ${inbox.address}\n\n` +
                           `${t("tempmail_token")}: ${inbox.token}\n\n` +
                           `${t("tempmail_usage")}`;

      await ovl.sendMessage(ms_org, { text: emailMessage }, { quoted: ms });
    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: t("tempmail_error") }, { quoted: ms });
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
  async (ms_org, ovl, { arg, ms }) => {
    if (!arg[0]) return ovl.sendMessage(ms_org, { text: t("tempinbox_need_token") }, { quoted: ms });

    try {
      const tempmail = new TempMail();
      const emails = await tempmail.checkInbox(arg[0]);

      if (!emails || emails.length === 0) {
        return ovl.sendMessage(ms_org, { text: t("tempinbox_empty") }, { quoted: ms });
      }

      for (let email of emails) {
        const sender = email.sender;
        const subject = email.subject;
        const date = new Date(email.date).toLocaleString();
        const messageBody = email.body;

        const mailMessage = `👥 ${t("email_sender")}: ${sender}\n` +
                            `📝 ${t("email_subject")}: ${subject}\n` +
                            `🕜 ${t("email_date")}: ${date}\n` +
                            `📩 ${t("email_message")}: ${messageBody}`;

        await ovl.sendMessage(ms_org, { text: mailMessage }, { quoted: ms });
      }
    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: t("tempinbox_error") }, { quoted: ms });
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
  async (ms_org, ovl, { arg, repondre, ms }) => {
    if (!arg || arg.length === 0) return repondre(t("obfuscate_need_code"));
    
    const codeToObfuscate = arg.join(" ");
    try {
      repondre(t("obfuscate_processing"));
      const obfuscatedCode = JavaScriptObfuscator.obfuscate(codeToObfuscate, {
        compact: true,
        controlFlowFlattening: true
      }).getObfuscatedCode();

      const tempFilePath = path.join(__dirname, 'obfuscate.js');
      fs.writeFileSync(tempFilePath, obfuscatedCode);

      await ovl.sendMessage(ms_org, {
        document: { url: tempFilePath },
        mimetype: 'application/javascript',
        fileName: 'obfuscate.js'
      }, { quoted: ms });

      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(error);
      repondre(t("obfuscate_error"));
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
  async (ms_org, ovl, { arg, repondre, ms }) => {
    if (!arg || arg.length < 1) return repondre(t("gitclone_no_url"));
    const dp = arg[0];
    const repoUrl = dp + '.git';
    const destination = arg[1] ? arg[1] : path.basename(repoUrl, '.git');
    const tempZipPath = `${destination}.zip`;
    const gitUrlPattern = /^(https?:\/\/|git@)([\w.@:\/-]+)(\.git)(\/?)$/;
    if (!gitUrlPattern.test(repoUrl)) return repondre(t("gitclone_invalid_url"));
    try {
      repondre(t("gitclone_start"));
      exec(`git clone ${repoUrl} ${destination}`, (error, stdout, stderr) => {
        if (error) return repondre(t("gitclone_error", { error: error.message }));
        try {
          const zip = new AdmZip();
          zip.addLocalFolder(destination);
          zip.writeZip(tempZipPath);
          const documentMessage = {
            document: fs.readFileSync(tempZipPath),
            mimetype: 'application/zip',
            fileName: `${destination}.zip`
          };
          ovl.sendMessage(ms_org, documentMessage, { quoted: ms });
          fs.rmSync(destination, { recursive: true, force: true });
          fs.unlinkSync(tempZipPath);
        } catch (zipError) {
          repondre(t("gitclone_zip_error", { error: zipError.message }));
        }
      });
    } catch (error) {
      console.error(error);
      repondre(t("gitclone_general_error"));
    }
  }
);

ovlcmd(
  {
    nom_cmd: "owner",
    classe: "Outils",
    react: "🔅",
    desc: "Numéro du propriétaire du bot",
  },  
  async (ms_org, ovl, { ms }) => {
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${config.NOM_OWNER}\n` +
      'ORG:undefined;\n' +
      `TEL;type=CELL;type=VOICE;waid=${config.NUMERO_OWNER}:+${config.NUMERO_OWNER}\n` +
      'END:VCARD';

    ovl.sendMessage(ms_org, {
      contacts: {
        displayName: config.NOM_OWNER,
        contacts: [{ vcard }],
      },
    }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "developpeur",
    classe: "Outils",
    react: "🔅",
    desc: "Numéro du créateur du bot",
    alias: ['dev'],
  },  
  async (ms_org, ovl, { ms }) => {
    const devNum = '22651463203';
    const devNom = 'Ainz';

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${devNom}\n` +
      'ORG:undefined;\n' +
      `TEL;type=CELL;type=VOICE;waid=${devNum}:+${devNum}\n` +
      'END:VCARD';

    ovl.sendMessage(ms_org, {
      contacts: {
        displayName: devNom,
        contacts: [{ vcard }],
      },
    }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "support",
    classe: "Outils",
    react: "📩",
    desc: "Lien vers le groupe de support du bot",
  },
  async (ms_org, ovl, { ms }) => {
    const inviteLink = 'https://chat.whatsapp.com/HzhikAmOuYhFXGLmcyMo62';
    const message = `📩 *OVL-MD-V2 SUPPORT*\n${t("support_message")}\n${inviteLink}`;

    await ovl.sendMessage(ms_org, { text: message }, { quoted: ms });
  }
);
