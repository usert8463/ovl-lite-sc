const { ovlcmd } = require("../lib/ovlcmd");
const { fbdl, ttdl, igdl, twitterdl, ytdl, apkdl } = require("../lib/dl");
const axios = require("axios");
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
      const audio = info?.ytdl;

      if (!audio?.download) return repondre("Aucun lien audio disponible.");

      const caption = `*AUDIO* 𝙊𝙑𝙇-𝙈𝘿\n\n` +
        `🎼 *Titre* : ${audio.title}\n` +
        `🕐 *Durée* : ${audio.duration}\n` +
        `👁️ *Vues* : ${audio.views}\n` +
        `🔗 *Lien* : ${audio.url}\n\n` +
        `🔊 *Powered by OVL-MD-V2*`;

      await ovl.sendMessage(ms_org, {
        image: { url: audio.thumbnail },
        caption,
      }, { quoted: ms });

      const { data } = await axios.get(audio.download, { responseType: "arraybuffer" });

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
      const video = info?.ytdl;

      if (!video?.download) return repondre("Aucun lien vidéo disponible.");

      const caption = `*VIDÉO* 𝙊𝙑𝙇-𝙈𝘿\n\n` +
        `🎼 *Titre* : ${video.title}\n` +
        `🕐 *Durée* : ${video.duration}\n` +
        `👁️ *Vues* : ${video.views}\n` +
        `🔗 *Lien* : ${video.url}\n\n` +
        `🎬 *Powered by OVL-MD-V2*`;

      await ovl.sendMessage(ms_org, {
        image: { url: video.thumbnail },
        caption,
      }, { quoted: ms });

      const { data } = await axios.get(video.download, { responseType: "arraybuffer" });

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
      const audio = info?.ytdl;

      if (!audio?.download) return repondre("Lien audio non disponible.");

      const { data } = await axios.get(audio.download, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        audio: Buffer.from(data),
        mimetype: "audio/mpeg",
        caption: "```Powered by OVL-MD-V2```"
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
      const video = info?.ytdl;

      if (!video?.download) return repondre("Lien vidéo non disponible.");

      const { data } = await axios.get(video.download, { responseType: "arraybuffer" });

      await ovl.sendMessage(ms_org, {
        video: Buffer.from(data),
        mimetype: "video/mp4",
        caption: "```Powered by OVL-MD-V2```"
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

      const searchResults = await apkdl(appName);
      if (searchResults.length === 0) {
        return repondre("*Application non existante, veuillez entrer un autre nom*");
      }

      const appData = searchResults[0];
      const fileSizeMB = parseFloat(appData.size.replace(/[^\d\.]/g, '')) || 0;
      if (fileSizeMB > 300) {
        return repondre("Le fichier dépasse 300 Mo, impossible de le télécharger.");
      }

      const apkFileName = (appData.name || "Downloader") + ".apk";
      const tempFilePath = path.join('/tmp', apkFileName);

      const apkResponse = await axios.get(appData.dllink, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempFilePath, apkResponse.data);

      await ovl.sendMessage(ms_org, {
        document: fs.readFileSync(tempFilePath),
        mimetype: 'application/vnd.android.package-archive',
        fileName: apkFileName,
        contextInfo: {
          externalAdReply: {
            title: appData.name,
            body: appData.size,
            mediaUrl: appData.icon,
            mediaType: 2,
            thumbnail: (await axios.get(appData.icon, { responseType: 'arraybuffer' })).data,
            sourceUrl: appData.icon
          }
        }
      }, { quoted: ms });

      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error('Erreur lors du traitement de la commande apk:', error);
      repondre("*Erreur lors du traitement de la commande apk*");
    }
  }
);
