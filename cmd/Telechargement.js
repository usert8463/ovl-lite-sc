const { ovlcmd } = require("../lib/ovlcmd");
const { fbdl, ttdl, igdl, twitterdl, fbdl, ytdl, apkdl } = require("../lib/dl");
const ytsr = require('@distube/ytsr');
const axios = require('axios');
const fs = require("fs");
const path = require("path");

ovlcmd(
  {
    nom_cmd: "song",
    classe: "Telechargement",
    react: "🎵",
    desc: "Télécharge une chanson depuis YouTube avec un terme de recherche",
    alias: ["play"],
  },
  async (ms_org, ovl, { arg, ms, repondre }) => {
    if (!arg.length) return repondre("Veuillez spécifier un titre ou un lien YouTube.");

    try {
      const query = arg.join(" ");
      const info = await ytdl(query, "audio");
      if (!info.download) return repondre("Aucun lien audio disponible.");

      const caption = `*AUDIO* 𝙊𝙑𝙇-𝙈𝘿\n\n` +
        `🎼 *Titre* : ${info.title}\n` +
        `🕐 *Durée* : ${info.duration}\n` +
        `👁️ *Vues* : ${info.views}\n` +
        `🔗 *Lien* : ${info.url}\n\n` +
        `🔊 *Powered by OVL-MD-V2*`;

      await ovl.sendMessage(ms_org, {
        image: { url: info.thumbnail },
        caption,
      }, { quoted: ms });

      const { data } = await axios.get(info.download, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        audio: Buffer.from(data),
        mimetype: "audio/mpeg",
        caption: "```Powered by OVL-MD-V2```"
      }, { quoted: ms });

    } catch (e) {
      console.error(e);
      repondre("❌ Erreur lors du téléchargement de la chanson.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "video",
    classe: "Telechargement",
    react: "🎥",
    desc: "Télécharge une vidéo depuis YouTube avec un terme de recherche",
  },
  async (ms_org, ovl, { arg, ms, repondre }) => {
    if (!arg.length) return repondre("Veuillez spécifier un titre ou un lien YouTube.");

    try {
      const query = arg.join(" ");
      const info = await ytdl(query, "video");
      if (!info.download) return repondre("Aucun lien vidéo disponible.");

      const caption = `*VIDÉO* 𝙊𝙑𝙇-𝙈𝘿\n\n` +
        `🎼 *Titre* : ${info.title}\n` +
        `🕐 *Durée* : ${info.duration}\n` +
        `👁️ *Vues* : ${info.views}\n` +
        `🔗 *Lien* : ${info.url}\n\n` +
        `🎬 *Powered by OVL-MD-V2*`;

      await ovl.sendMessage(ms_org, {
        image: { url: info.thumbnail },
        caption,
      }, { quoted: ms });

      const { data } = await axios.get(info.download, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        video: Buffer.from(data),
        mimetype: "video/mp4",
        caption: "```Powered by OVL-MD-V2```"
      }, { quoted: ms });

    } catch (e) {
      console.error(e);
      repondre("❌ Erreur lors du téléchargement de la vidéo.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "yta",
    classe: "Telechargement",
    react: "🎧",
    desc: "Télécharge l'audio d'une vidéo YouTube à l'aide d'un lien",
    alias: ["ytmp3"],
  },
  async (ms_org, ovl, { arg, ms, repondre }) => {
    const link = arg.join(" ");
    if (!link) return repondre("Exemple : *yta https://youtube.com/watch?v=xyz*");

    try {
      const info = await ytdl(link, "audio");
      const { data } = await axios.get(info.url, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        audio: Buffer.from(data),
        mimetype: "audio/mpeg"
      }, { quoted: ms });

    } catch (e) {
      console.error(e);
      repondre("Impossible de télécharger l'audio.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ytv",
    classe: "Telechargement",
    react: "🎬",
    desc: "Télécharge une vidéo YouTube à l'aide d'un lien",
    alias: ["ytmp4"],
  },
  async (ms_org, ovl, { arg, ms, repondre }) => {
    const link = arg.join(" ");
    if (!link) return repondre("Exemple : *ytv https://youtube.com/watch?v=xyz*");

    try {
      const info = await ytdl(link, "video");
      const { data } = await axios.get(info.url, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        video: Buffer.from(data),
        mimetype: "video/mp4",
        caption: "```Powered By OVL-MD-V2```"
      }, { quoted: ms });

    } catch (e) {
      console.error(e);
      repondre("Impossible de télécharger la vidéo.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "fbdl",
    classe: "Telechargement",
    react: "📥",
    desc: "Télécharger ou envoyer directement une vidéo depuis Facebook"
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms } = cmd_options;
    const videoLink = arg.join(" ");
    
    if (!videoLink) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir un lien vidéo, par exemple : fbdl https://www.facebook.com/video-link" }, { quoted: ms });
    }

    try {
      const videoDownloadLink = await fbdl(videoLink);
      const response = await axios.get(videoDownloadLink, {
        responseType: "arraybuffer",
        headers: {
          "Accept": "application/octet-stream",
          "Content-Type": "application/octet-stream",
          "User-Agent": "GoogleBot",
        },
      });
      const videoBuffer = Buffer.from(response.data);

      return ovl.sendMessage(ms_org, { video: videoBuffer, caption: `\`\`\`Powered By OVL-MD-V2\`\`\`` }, { quoted: ms });

    } catch (error) {
      ovl.sendMessage(ms_org, { text: `Erreur: ${error.message}` }, { quoted: ms });
      console.error('Error:', error);
      return ovl.sendMessage(ms_org, { text: `Erreur: ${error.message}` }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ttdl",
    classe: "Telechargement",
    react: "📥",
    desc: "Télécharger ou envoyer directement une vidéo depuis TikTok"
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms } = cmd_options;
    const videoLink = arg.join(" ");
    
    if (!videoLink) {
      return ovl.sendMessage(ms_org, { text: "Veuillez fournir un lien vidéo TikTok, par exemple : ttdl https://vm.tiktok.com/..." }, { quoted: ms });
    }

    try {
      const downloadLinks = await ttdl(videoLink);

      const video = await axios.get(downloadLinks.result.nowatermark, {
        responseType: "arraybuffer",
        headers: {
          "Accept": "application/octet-stream",
          "Content-Type": "application/octet-stream",
          "User-Agent": "GoogleBot",
        },
      });

      return ovl.sendMessage(ms_org, { video: Buffer.from(video.data), caption: `\`\`\`Powered By OVL-MD-V2\`\`\`` }, { quoted: ms });

    } catch (error) {
      ovl.sendMessage(ms_org, { text: `Erreur: ${error}` }, { quoted: ms });
      console.error('Error:', error);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "igdl",
    classe: "Telechargement",
    react: "📥",
    desc: "Télécharger ou envoyer directement une vidéo depuis Instagram",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms } = cmd_options;
    const videoLink = arg.join(" ");

    if (!videoLink) {
      return ovl.sendMessage(ms_org, {
        text: "Veuillez fournir un lien vidéo Instagram, par exemple : igdl https://www.instagram.com/reel/...",
      }, { quoted: ms });
    }
    try {
      const downloadLinks = await igdl(videoLink);
      const video = await axios.get(downloadLinks.result.video, {
        responseType: "arraybuffer",
        headers: {
          "Accept": "application/octet-stream",
          "Content-Type": "application/octet-stream",
          "User-Agent": "GoogleBot",
        },
      });
	    
      return ovl.sendMessage(ms_org, {
        video: Buffer.from(video.data),
        caption: `\`\`\`Powered By OVL-MD-V2\`\`\``
      }, { quoted: ms });
    } catch (error) {
      ovl.sendMessage(ms_org, { text: `Erreur: ${error.message}` }, { quoted: ms });
      console.error("Error:", error);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "twitterdl",
    classe: "Telechargement",
    react: "📥",
    desc: "Télécharger ou envoyer directement une vidéo depuis Twitter",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms } = cmd_options;
    const videoLink = arg.join(" ");

    if (!videoLink) {
      return ovl.sendMessage(ms_org, {
        text: "Veuillez fournir un lien vidéo Twitter, par exemple : twitterdl https://twitter.com/...",
      }, { quoted: ms });
    }

    try {
      const downloadLinks = await twitterdl(videoLink);

      const video = await axios.get(downloadLinks.result.video, {
        responseType: "arraybuffer",
        headers: {
          "Accept": "application/octet-stream",
          "Content-Type": "application/octet-stream",
          "User-Agent": "GoogleBot",
        },
      });

      return ovl.sendMessage(ms_org, {
        video: Buffer.from(video.data),
        caption: `\`\`\`Powered By OVL-MD-V2\`\`\``
      }, { quoted: ms });
    } catch (error) {
      ovl.sendMessage(ms_org, { text: `Erreur: ${error.message}` }, { quoted: ms });
      console.error("Error:", error);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "apk",
    classe: "Telechargement",
    react: "📥",
    desc: "Télécharger une application depuis Aptoide",
  },  
  async (ms_org, ovl, cmd_options) => {
    const { repondre, arg, ms } = cmd_options;

    try {
      const appName = arg.join(' ');
      if (!appName) {
        return repondre("*Entrer le nom de l'application à rechercher*");
      }

      const searchResults = await apkdl.search(appName);

      if (searchResults.length === 0) {
        return repondre("*Application non existante, veuillez entrer un autre nom*");
      }

      const appData = await apkdl.download(searchResults[0].id);
      const fileSize = parseInt(appData.size);

      if (isNaN(fileSize)) {
        return repondre("*Erreur dans la taille du fichier*");
      }

      if (fileSize > 300) {
        return repondre("Le fichier dépasse 300 Mo, impossible de le télécharger.");
      }

      const downloadLink = appData.dllink;
      const captionText =
        "『 *ᴏᴠʟ-ᴍᴅ-ᴠ𝟸 ᴀᴘᴋ-ᴅʟ* 』\n\n*📱ɴᴏᴍ :* " + appData.name +
        "\n*🆔ɪᴅ :* " + appData["package"] +
        "\n*📅ᴍɪsᴇ ᴀ̀ ᴊᴏᴜʀ:* " + appData.lastup +
        "\n*📦ᴛᴀɪʟʟᴇ :* " + appData.size +
        "\n";

      const apkFileName = (appData?.["name"] || "Downloader") + ".apk";
      const filePath = apkFileName;

      const response = await axios.get(downloadLink, { 'responseType': "stream" });
      const fileWriter = fs.createWriteStream(filePath);
      response.data.pipe(fileWriter);

      await new Promise((resolve, reject) => {
        fileWriter.on('finish', resolve);
        fileWriter.on("error", reject);
      });

      const documentMessage = {
        'document': fs.readFileSync(filePath),
        'mimetype': 'application/vnd.android.package-archive',
        'fileName': apkFileName
      };

      ovl.sendMessage(ms_org, { image: { url: appData.icon }, caption: captionText }, { quoted: ms });
      ovl.sendMessage(ms_org, documentMessage, { quoted: ms });

      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Erreur lors du traitement de la commande apk:', error);
      repondre("*Erreur lors du traitement de la commande apk*");
    }
  }
);
