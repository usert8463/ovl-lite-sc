const { exec } = require("child_process");
const { ovlcmd } = require("../lib/ovlcmd");
const { Bans } = require('../DataBase/ban');
const { Sudo } = require('../DataBase/sudo');
const config = require('../set');
const axios = require("axios");
const { t } = require('../lib/funcLangue');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const cheerio = require('cheerio');
const { WA_CONF } = require('../DataBase/wa_conf');
const { ChatbotConf } = require('../DataBase/chatbot');
const path = require('path');
const fs = require('fs');
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
    const { repondre, verif_Groupe, prenium_id, t } = cmd_options;

    if (verif_Groupe) {
      return repondre(t("block_group_error"));
    }
    if (!prenium_id) {
      return repondre(t("block_no_permission"));
    }
    try {
      await ovl.updateBlockStatus(ms_org, "block");
      repondre(t("block_success"));
    } catch (error) {
      console.error("Erreur block:", error);
      repondre(t("block_fail"));
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
    const { verif_Groupe, repondre, prenium_id, t } = cmd_options;

    if (verif_Groupe) {
      return repondre(t("unblock_group_error"));
    }
    if (!prenium_id) {
      return repondre(t("unblock_no_permission"));
    }
    try {
      await ovl.updateBlockStatus(ms_org, "unblock");
      repondre(t("unblock_success"));
    } catch (error) {
      console.error("Erreur deblock:", error);
      repondre(t("unblock_fail"));
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ban",
    classe: "Owner",
    react: "🚫",
    desc: "Bannir un utilisateur des commandes du bot"
  },
  async (ms_org, ovl, cmd_options) => {
    const { repondre, ms, arg, auteur_Msg_Repondu, prenium_id, dev_num, t } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
      }

      const cible =
        auteur_Msg_Repondu ||
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

      if (!cible) return repondre(t("ban_mention_user"));

      if (dev_num.includes(cible)) {
        return ovl.sendMessage(ms_org, { text: t("ban_dev_protect") }, { quoted: ms });
      }

      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "user" }
      });

      if (!ban._options.isNewRecord) return repondre(t("ban_already"));

      return ovl.sendMessage(ms_org, {
        text: t("ban_success").replace("{username}", cible.split("@")[0]),
        mentions: [cible]
      }, { quoted: ms });

    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande ban :", error);
      return repondre(t("ban_fail"));
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
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms, t } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(jid, { text: t("ban_no_permission") }, { quoted: ms });
      }

      const cible =
        auteur_Msg_Repondu ||
        (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

      if (!cible) return repondre(t("deban_mention_user"));

      const suppression = await Bans.destroy({ where: { id: cible, type: "user" } });
      if (suppression === 0) return repondre(t("deban_not_banned"));

      return ovl.sendMessage(jid, {
        text: t("deban_success").replace("{username}", cible.split("@")[0]),
        mentions: [cible]
      }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande deban :", error);
      return repondre(t("deban_fail"));
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
    const { repondre, verif_Groupe, prenium_id, ms, t } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(jid, { text: t("ban_no_permission") }, { quoted: ms });
      }

      if (!verif_Groupe) return repondre(t("bangroup_not_group"));

      const cible = jid;
      if (!cible) return repondre(t("bangroup_no_id"));

      const [ban] = await Bans.findOrCreate({
        where: { id: cible },
        defaults: { id: cible, type: "group" },
      });

      if (!ban._options.isNewRecord) return repondre(t("bangroup_already_banned"));
      return repondre(t("bangroup_success"));
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande bangroup :", error);
      return repondre(t("bangroup_fail"));
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
    const { repondre, verif_Groupe, prenium_id, ms, t } = cmd_options;

    try {
      if (!prenium_id) {
        return ovl.sendMessage(jid, { text: t("ban_no_permission") }, { quoted: ms });
      }

      if (!verif_Groupe) return repondre(t("bangroup_not_group"));

      const cible = jid;
      if (!cible) return repondre(t("bangroup_no_id"));

      const suppression = await Bans.destroy({ where: { id: cible, type: "group" } });
      if (suppression === 0) return repondre(t("debangroup_not_banned"));
      return repondre(t("debangroup_success"));
    } catch (error) {
      console.error("Erreur lors de l'exécution de la commande debangroup :", error);
      return repondre(t("debangroup_fail"));
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
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms, t } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
    }

    const cible =
      auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    if (!cible) return repondre(t("setsudo_no_user"));

    try {
      const [user] = await Sudo.findOrCreate({
        where: { id: cible },
        defaults: { id: cible },
      });

      if (!user._options.isNewRecord) {
        return ovl.sendMessage(ms_org, {
          text: t("setsudo_already_premium").replace("{username}", cible.split("@")[0]),
          mentions: [cible]
        }, { quoted: ms });
      }

      return ovl.sendMessage(ms_org, {
        text: t("setsudo_success").replace("{username}", cible.split("@")[0]),
        mentions: [cible]
      }, { quoted: ms });

    } catch (error) {
      console.error("Erreur setsudo:", error);
      return repondre(t("setsudo_fail"));
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
    const { repondre, prenium_id, ms, t } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
    }

    try {
      const sudoUsers = await Sudo.findAll();
      if (!sudoUsers.length) return repondre(t("sudolist_empty"));

      const userList = sudoUsers
        .map((user, i) => `🔹 *${i + 1}.* @${user.id.split("@")[0]}`)
        .join("\n");

      const message = t("sudolist_template")
        .replace("{count}", sudoUsers.length)
        .replace("{users}", userList);

      return ovl.sendMessage(ms_org, {
        text: message,
        mentions: sudoUsers.map(u => u.id)
      }, { quoted: ms });

    } catch (error) {
      console.error("Erreur sudolist:", error);
      return repondre(t("sudolist_fail"));
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
    const { repondre, arg, auteur_Msg_Repondu, prenium_id, ms, t } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
    }

    const cible =
      auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);
    if (!cible) return repondre(t("delsudo_no_user"));

    try {
      const deletion = await Sudo.destroy({ where: { id: cible } });

      if (deletion === 0) {
        return ovl.sendMessage(ms_org, {
          text: t("delsudo_not_found").replace("{username}", cible.split("@")[0]),
          mentions: [cible]
        }, { quoted: ms });
      }

      return ovl.sendMessage(ms_org, {
        text: t("delsudo_success").replace("{username}", cible.split("@")[0]),
        mentions: [cible]
      }, { quoted: ms });

    } catch (error) {
      console.error("Erreur delsudo:", error);
      return repondre(t("delsudo_fail"));
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
    const { repondre, arg, prenium_id, ms, t } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") });
    }

    if (!arg[0]) {
      return repondre(t("tgs_no_link"));
    }

    const lien = arg[0];
    const nomStickers = lien.split("/addstickers/")[1];

    if (!nomStickers) {
      return repondre(t("tgs_invalid_link"));
    }

    const urlAPI = `https://api.telegram.org/bot<API_KEY>/getStickerSet?name=${nomStickers}`;

    try {
      const { data } = await axios.get(urlAPI);
      const stickers = data.result.stickers;

      if (!stickers || stickers.length === 0) {
        return repondre(t("tgs_no_stickers"));
      }

      repondre(t("tgs_pack_info", {
        name: data.result.name,
        type: data.result.is_animated ? t("tgs_type_animated") : t("tgs_type_static"),
        count: stickers.length
      }));

      for (const stickerData of stickers) {
        const fileInfo = await axios.get(`https://api.telegram.org/bot<API_KEY>/getFile?file_id=${stickerData.file_id}`);
        const stickerBuffer = await axios({
          method: "get",
          url: `https://api.telegram.org/file/bot<API_KEY>/${fileInfo.data.result.file_path}`,
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

      repondre(t("tgs_done"));
    } catch (error) {
      console.error(error);
      repondre(t("tgs_error"));
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
    const { arg, prenium_id, ms, t } = cmd_options;
    const lien = arg[0];

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
    }

    if (!lien) {
      return ovl.sendMessage(ms_org, { text: t("fetchsc_no_link") }, { quoted: ms });
    }

    if (!/^https?:\/\//i.test(lien)) {
      return ovl.sendMessage(ms_org, { text: t("fetchsc_invalid_link") }, { quoted: ms });
    }

    try {
      const response = await axios.get(lien);
      const html = response.data;
      const $ = cheerio.load(html);

      const fichiersMedia = [];
      $('img[src], video[src], audio[src]').each((i, el) => fichiersMedia.push($(el).attr('src')));

      const fichiersCSS = [];
      $('link[rel="stylesheet"]').each((i, el) => fichiersCSS.push($(el).attr('href')));

      const fichiersJS = [];
      $('script[src]').each((i, el) => fichiersJS.push($(el).attr('src')));

      await ovl.sendMessage(ms_org, { text: `**HTML**:\n\n${html}` }, { quoted: ms });

      if (fichiersCSS.length) {
        for (const f of fichiersCSS) {
          const res = await axios.get(new URL(f, lien));
          await ovl.sendMessage(ms_org, { text: `**CSS**:\n\n${res.data}` }, { quoted: ms });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: t("fetchsc_no_css") }, { quoted: ms });
      }

      if (fichiersJS.length) {
        for (const f of fichiersJS) {
          const res = await axios.get(new URL(f, lien));
          await ovl.sendMessage(ms_org, { text: `**JS**:\n\n${res.data}` }, { quoted: ms });
        }
      } else {
        await ovl.sendMessage(ms_org, { text: t("fetchsc_no_js") }, { quoted: ms });
      }

      if (fichiersMedia.length) {
        await ovl.sendMessage(ms_org, { text: `**Médias**:\n${fichiersMedia.join("\n")}` }, { quoted: ms });
      } else {
        await ovl.sendMessage(ms_org, { text: t("fetchsc_no_media") }, { quoted: ms });
      }

    } catch (error) {
      console.error(error);
      return ovl.sendMessage(ms_org, { text: t("fetchsc_error") }, { quoted: ms });
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
    const { ms, repondre, arg, prenium_id, t } = cmd_options;

    try {
      if (!prenium_id) {
        return repondre(t("ban_no_permission"));
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
        defaults: { id: '1', antidelete: 'non' },
      });

      if (sousCommande === 'off') {
        if (settings.antidelete === 'non') {
          return repondre(t("antidelete_already_off"));
        }
        settings.antidelete = 'non';
        await settings.save();
        return repondre(t("antidelete_disabled"));
      }

      const typeSelection = parseInt(sousCommande);
      if (validTypes[typeSelection]) {
        const selectedType = validTypes[typeSelection];

        if (settings.antidelete === selectedType) {
          return repondre(t("antidelete_already", { type: selectedType }));
        }

        settings.antidelete = selectedType;
        await settings.save();
        return repondre(t("antidelete_set", { type: selectedType }));
      }

      return repondre(t("antidelete_help"));
    } catch (error) {
      console.error("Erreur antidelete :", error);
      return repondre(t("global_error"));
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
    const { repondre, auteur_Msg_Repondu, prenium_id, msg_Repondu, t } = cmd_options;

    if (!prenium_id) {
      return repondre(t("ban_no_permission"));
    }

    const jid = msg_Repondu ? auteur_Msg_Repondu : ms_org;
    repondre(jid);
  }
);

ovlcmd(
  {
    nom_cmd: "restart",
    classe: "Owner",
    desc: "Redémarre le bot via PM2"
  },
  async (ms_org, ovl, cmd_options) => {
    const { ms, prenium_id, t } = cmd_options;

    if (!prenium_id) {
      return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
    }

    await ovl.sendMessage(ms_org, { text: t("restart_msg") }, { quoted: ms });

    exec('pm2 restart all', (err) => {
      if (err) {
        return ovl.sendMessage(ms_org, { text: t("restart_error", { err: err.message }) }, { quoted: ms });
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
      const { arg, ms, prenium_id, t } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
      }

      if (!arg || !arg[0]) {
        return ovl.sendMessage(ms_org, { text: t("connect_usage") }, { quoted: ms });
      }

      const session_id = arg[0].trim();
      await saveSecondSession(session_id);

      exec('pm2 restart all', (err) => {
        if (err) {
          ovl.sendMessage(ms_org, { text: t("restart_error", { err: err.message }) }, { quoted: ms });
        }
      });

      return ovl.sendMessage(ms_org, { text: t("connect_success", { session_id }) }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: t("global_error", { err: err.message }) });
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
      const { ms, prenium_id, t } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, {
          text: t("ban_no_permission"),
        }, { quoted: ms });
      }

      const sessions = await getSecondAllSessions();

      if (!sessions || sessions.length === 0) {
        return ovl.sendMessage(ms_org, {
          text: t("connect_session_empty"),
        }, { quoted: ms });
      }

      const jids = sessions.map(s => `${s.numero}@s.whatsapp.net`);
      const texte = jids.map(jid => `@${jid.split("@")[0]}`).join("\n");

      await ovl.sendMessage(ms_org, {
        text: t("connect_session_list", { total: sessions.length, liste: texte }),
        mentions: jids,
      }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: t("global_error", { err: err.message }) });
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
      const { arg, ms, prenium_id, t } = cmd_options;

      if (!prenium_id) {
        return ovl.sendMessage(ms_org, { text: t("ban_no_permission") }, { quoted: ms });
      }

      if (!arg || !arg[0]) {
        return ovl.sendMessage(ms_org, { text: t("disconnect_usage") }, { quoted: ms });
      }

      const session_id = arg[0].trim();
      const result = await deleteSecondSession(session_id);

      if (result === 0) {
        return ovl.sendMessage(ms_org, {
          text: t("disconnect_not_found", { session_id }),
        }, { quoted: ms });
      }

      exec('pm2 restart all', (err) => {
        if (err) {
          ovl.sendMessage(ms_org, { text: t("restart_error", { err: err.message }) }, { quoted: ms });
        }
      });

      await ovl.sendMessage(ms_org, {
        text: t("disconnect_success", { session_id }),
      }, { quoted: ms });
    } catch (err) {
      return ovl.sendMessage(ms_org, { text: t("global_error", { err: err.message }) });
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
    const { ms, repondre, arg, prenium_id, t } = cmd_options;

    if (!prenium_id) return repondre(t("ban_no_permission"));

    try {
      const joined = arg.join(" ");
      if (!joined) {
        return repondre(t("setmention_help"));
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
        return repondre(t("setmention_text_ok"));
      }

      if (isAudio) {
        if (text !== "text" && text !== "") return repondre(t("setmention_text_not_allowed_audio"));
        await setMention({ url, text: "", mode: "oui" });
        return repondre(t("setmention_audio_ok"));
      }

      if (isImage || isVideo) {
        await setMention({ url, text, mode: "oui" });
        return repondre(t("setmention_media_ok", { type: isImage ? "image" : "vidéo" }));
      }

      return repondre(t("setmention_invalid_format"));
    } catch (e) {
      console.error("Erreur dans setmention:", e);
      repondre(t("global_error"));
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
    const { repondre, prenium_id, t } = cmd_options;

    if (!prenium_id) return repondre(t("ban_no_permission"));

    try {
      await delMention();
      return repondre(t("delmention_success"));
    } catch (e) {
      console.error("Erreur dans delmention:", e);
      repondre(t("global_error"));
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
    const { repondre, prenium_id, t } = cmd_options;

    if (!prenium_id) return repondre(t("ban_no_permission"));

    try {
      const data = await getMention();

      if (!data || data.mode === "non") {
        return repondre(t("getmention_disabled"));
      }

      const { mode, url, text } = data;

      if (!url || url === "" || url === "url") {
        if (!text || text === "text") {
          return repondre(t("getmention_enabled_no_content"));
        }
        return repondre(text);
      }

      const lowerUrl = url.toLowerCase();
      const isAudio = lowerUrl.endsWith(".opus") || lowerUrl.endsWith(".ogg") || lowerUrl.endsWith(".mp3") || lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".aac") || lowerUrl.endsWith(".wav");
      const isImage = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png");
      const isVideo = lowerUrl.endsWith(".mp4");

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

      return repondre(t("getmention_unknown_media"));
    } catch (e) {
      console.error("Erreur dans getmention:", e);
      repondre(t("global_error"));
    }
  }
);

ovlcmd({
  nom_cmd: "addstickcmd",
  classe: "Owner",
  react: "✨",
  desc: "Associer une commande à un sticker (réponds à un sticker)",
}, async (ms_org, ovl, { repondre, msg_Repondu, arg, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const name = arg[0];
  if (!name) return repondre(t("addstickcmd_no_name"));

  if (!msg_Repondu || !msg_Repondu.stickerMessage || !msg_Repondu.stickerMessage.url)
    return repondre(t("addstickcmd_no_reply_sticker"));

  const stick_url = msg_Repondu.stickerMessage.url;

  try {
    await set_stick_cmd(name.toLowerCase(), stick_url);
    repondre(t("addstickcmd_success", { name }));
  } catch (e) {
    console.error(e);
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "delstickcmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprimer une commande sticker",
}, async (ms_org, ovl, { repondre, arg, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const name = arg[0];
  if (!name) return repondre(t("delstickcmd_usage"));

  const ok = await del_stick_cmd(name.toLowerCase());
  repondre(ok ? t("delstickcmd_success", { name }) : t("delstickcmd_not_found", { name }));
});

ovlcmd({
  nom_cmd: "getstickcmd",
  classe: "Owner",
  react: "📋",
  desc: "Liste des commandes stickers",
}, async (ms_org, ovl, { repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const list = await get_stick_cmd();
  if (!list.length) return repondre(t("getstickcmd_empty"));

  let msg = t("getstickcmd_list_header") + "\n\n";
  for (const { no_cmd } of list) {
    msg += `• *${no_cmd}*\n`;
  }

  repondre(msg);
});

ovlcmd({
  nom_cmd: "setpublic_cmd",
  classe: "Owner",
  react: "✅",
  desc: "Ajoute une commande publique utilisable par tout le monde quand le bot est en mode privé",
}, async (ms_org, ovl, { arg, repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre(t("setpublic_usage"));

  try {
    await set_cmd(nom_cmd, "public");
    repondre(t("setpublic_success", { nom_cmd }));
  } catch {
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "delpublic_cmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprime une commande des commandes publiques.",
}, async (ms_org, ovl, { arg, repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre(t("delpublic_usage"));

  try {
    const deleted = await del_cmd(nom_cmd, "public");
    repondre(deleted ? t("delpublic_success", { nom_cmd }) : t("delpublic_not_found", { nom_cmd }));
  } catch {
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "listpublic_cmd",
  classe: "Owner",
  react: "📜",
  desc: "Liste les commandes publiques utilisables quand le bot est en mode privé",
}, async (ms_org, ovl, { repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const all = await list_cmd("public");
  if (!all.length) return repondre(t("listpublic_empty"));

  const msg = all.map((c, i) => `🔹 *${i + 1}.* ${c.nom_cmd}`).join("\n");
  repondre(t("listpublic_header") + "\n\n" + msg);
});

ovlcmd({
  nom_cmd: "setprivate_cmd",
  classe: "Owner",
  react: "🔒",
  desc: "Ajoute une commande privée utilisable par les utilisateurs premiums quand le bot est en mode public",
}, async (ms_org, ovl, { arg, repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre(t("setprivate_usage"));

  try {
    await set_cmd(nom_cmd, "private");
    repondre(t("setprivate_success", { nom_cmd }));
  } catch {
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "delprivate_cmd",
  classe: "Owner",
  react: "🗑️",
  desc: "Supprime une commande des commandes privées"
}, async (ms_org, ovl, { arg, repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const nom_cmd = arg[0];
  if (!nom_cmd) return repondre(t("delprivate_usage"));

  try {
    const deleted = await del_cmd(nom_cmd, "private");
    repondre(deleted ? t("delprivate_success", { nom_cmd }) : t("delprivate_not_found", { nom_cmd }));
  } catch {
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "listprivate_cmd",
  classe: "Owner",
  react: "📃",
  desc: "Liste les commandes privées utilisables par les utilisateurs premiums quand le bot est en mode public",
}, async (ms_org, ovl, { repondre, prenium_id, t }) => {
  if (!prenium_id) return repondre(t("ban_no_permission"));

  const all = await list_cmd("private");
  if (!all.length) return repondre(t("listprivate_empty"));

  const msg = all.map((c, i) => `🔹 *${i + 1}.* ${c.nom_cmd}`).join("\n");
  repondre(t("listprivate_header") + "\n\n" + msg);
});

ovlcmd({
  nom_cmd: "chatbot",
  classe: "Owner",
  react: "🤖",
  desc: "Active ou désactive le chatbot ici ou globalement.",
}, async (jid, ovl, { ms, repondre, arg, prenium_id, t }) => {
  const sousCommande = arg[0]?.toLowerCase();

  if (!prenium_id) return repondre(t("ban_no_permission"));

  try {
    const [config] = await ChatbotConf.findOrCreate({
      where: { id: '1' },
      defaults: {
        chatbot_pm: 'non',
        chatbot_gc: 'non',
        enabled_ids: JSON.stringify([]),
      },
    });

    let ids;
    try {
      ids = JSON.parse(config.enabled_ids || '[]');
    } catch {
      ids = [];
    }

    if (sousCommande === 'on') {
      if (ids.includes(jid)) {
        repondre(t("chatbot.already_here"));
      } else {
        ids.push(jid);
        config.enabled_ids = JSON.stringify([...new Set(ids)]);
        config.chatbot_pm = 'non';
        config.chatbot_gc = 'non';
        await config.save();
        repondre(t("chatbot.enabled_here"));
      }
    } else if (sousCommande === 'off') {
      config.chatbot_pm = 'non';
      config.chatbot_gc = 'non';
      config.enabled_ids = JSON.stringify([]);
      await config.save();
      repondre(t("chatbot.disabled_global"));
    } else if (['pm', 'gc', 'all'].includes(sousCommande)) {
      config.chatbot_pm = sousCommande === 'pm' || sousCommande === 'all' ? 'oui' : 'non';
      config.chatbot_gc = sousCommande === 'gc' || sousCommande === 'all' ? 'oui' : 'non';
      config.enabled_ids = JSON.stringify([]);
      await config.save();

      const messages = {
        pm: t("chatbot.enabled_pm"),
        gc: t("chatbot.enabled_gc"),
        all: t("chatbot.enabled_all"),
      };

      repondre(messages[sousCommande]);
    } else {
      repondre(t("chatbot.usage"));
    }
  } catch (err) {
    console.error("❌ Erreur dans la commande chatbot :", err);
    repondre(t("global_error"));
  }
});

ovlcmd({
  nom_cmd: "list",
  classe: "Système",
  react: "📃",
  desc: "Affiche la liste des plugins disponibles (✓ installé, ✗ non installé).",
}, async (ms, ovl, { repondre, t }) => {
  try {
    const { data } = await axios.get('https://premier-armadillo-ovl-02d9d108.koyeb.app/pglist');
    const installs = await Plugin.findAll();
    const installedNames = installs.map(p => p.name);

    const lignes = data.map(p => {
      const estInstalle = installedNames.includes(p.name);
      return `${estInstalle ? '✓' : '✗'} ${p.name}`;
    });

    const message = lignes.length > 0
      ? t("plugin.list_header") + "\n\n" + lignes.join('\n')
      : t("plugin.none");

    await repondre(message);
  } catch (e) {
    await repondre(t("plugin.error_loading"));
  }
});

ovlcmd({
  nom_cmd: "remove",
  classe: "Système",
  react: "🗑️",
  desc: "Supprime un plugin installé par nom ou tape `remove all` pour tous.",
}, async (ms, ovl, { arg, repondre, t }) => {
  const input = arg[0];
  if (!input) return repondre(t("plugin.remove.usage"));

  if (input === 'all') {
    const plugins = await Plugin.findAll();
    for (const p of plugins) {
      const filePath = path.join(__dirname, '../cmd', `${p.name}.js`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await Plugin.destroy({ where: { name: p.name } });
    }
    repondre(t("plugin.remove.all_done"));
    return exec('pm2 restart all', () => {});
  }

  const plugin = await Plugin.findOne({ where: { name: input } });
  if (!plugin) return repondre(t("plugin.remove.not_found"));

  const filePath = path.join(__dirname, '../cmd', `${plugin.name}.js`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await Plugin.destroy({ where: { name: input } });

  await repondre(t("plugin.remove.success", { name: input }));
  return exec('pm2 restart all', () => {});
});

ovlcmd({
  nom_cmd: "install",
  classe: "Système",
  react: "📥",
  desc: "Installe un plugin.",
}, async (ms, ovl, { arg, repondre, t }) => {
  const input = arg[0];
  if (!input) return repondre(t("plugin.install.usage"));

  const installOne = async (url, name) => {
    try {
      const res = await axios.get(url);
      const code = res.data;
      const filePath = path.join(__dirname, '../cmd', `${name}.js`);
      fs.writeFileSync(filePath, code);

      const modules = extractNpmModules(code);
      if (modules.length > 0) {
        await repondre(t("plugin.install.modules", { modules: modules.join(", ") }));
        await installModules(modules);
      }

      await Plugin.findOrCreate({ where: { name }, defaults: { url } });
      await repondre(t("plugin.install.success", { name }));
      return exec('pm2 restart all', () => {});
    } catch (e) {
      await repondre(t("plugin.install.error", { error: e.message }));
    }
  };

  if (input === 'all') {
    try {
      const { data } = await axios.get('https://premier-armadillo-ovl-02d9d108.koyeb.app/pglist');
      for (const p of data) {
        await installOne(p.url, p.name);
      }
      await repondre(t("plugin.install.all_done"));
    } catch (e) {
      await repondre(t("plugin.install.error", { error: e.message }));
    }
  } else {
    await installOne(input, path.basename(input).replace('.js', ''));
  }
});
