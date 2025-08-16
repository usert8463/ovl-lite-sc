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
      const audio = info.yts[0];
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
      const stream = await axios.get(
        `https://you-tube-dl-psi.vercel.app/youtube/download?url=${encodeURIComponent(audio.url)}&format=audio`,
        { responseType: "stream" }
      );
      await ovl.sendMessage(ms_org, {
        audio: stream.data,
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
      const video = info.yts[0];
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
      const stream = await axios.get(
        `https://you-tube-dl-psi.vercel.app/youtube/download?url=${encodeURIComponent(video.url)}&format=video`,
        { responseType: "stream" }
      );
      await ovl.sendMessage(ms_org, {
        video: stream.data,
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
      const stream = await axios.get(
        `https://you-tube-dl-psi.vercel.app/youtube/download?url=${encodeURIComponent(link)}&format=audio`,
        { responseType: "stream" }
      );
      await ovl.sendMessage(ms_org, {
        audio: stream.data,
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
      const stream = await axios.get(
        `https://you-tube-dl-psi.vercel.app/youtube/download?url=${encodeURIComponent(link)}&format=video`,
        { responseType: "stream" }
      );
      await ovl.sendMessage(ms_org, {
        video: stream.data,
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
    desc: "Télécharger un média depuis TikTok"
},
async (ms_org, ovl, cmd_options) => {
    const { arg, ms, auteur_Message } = cmd_options;

    const videoLink = arg.join(" ");
    if (!videoLink) return ovl.sendMessage(ms_org, { text: "Veuillez fournir un lien vidéo TikTok, par exemple : ttdl https://vm.tiktok.com/..." }, { quoted: ms });

    try {
        const links = await ttdl(videoLink);
        const options = [];
        if (links.noWatermark) options.push({ type: "video", label: "Vidéo sans filigrane", url: links.noWatermark });
        if (links.mp3) options.push({ type: "audio", label: "Audio (MP3)", url: links.mp3 });
        if (links.slides.length > 0) options.push({ type: "images", label: "Images (slides)", urls: links.slides });
        if (options.length === 0) return ovl.sendMessage(ms_org, { text: "Aucun fichier téléchargeable trouvé." }, { quoted: ms });

        let choixValide = false;
        let selection;

        while (!choixValide) {
            let msg = "📥 Options disponibles :\n";
            options.forEach((opt, idx) => msg += `${idx + 1}. ${opt.label}\n`);
            msg += "\nRépondez avec le numéro de l'option à télécharger.";
            await ovl.sendMessage(ms_org, { text: msg }, { quoted: ms });

            const rep = await ovl.recup_msg({ auteur: auteur_Message, ms_org, temps: 60000 });
            const reponse = rep?.message?.conversation || rep?.message?.extendedTextMessage?.text || "";
            const choix = parseInt(reponse.trim(), 10);

            if (!isNaN(choix) && choix >= 1 && choix <= options.length) {
                selection = options[choix - 1];
                choixValide = true;
            } else {
                await ovl.sendMessage(ms_org, { text: "Choix invalide, veuillez réessayer." }, { quoted: ms });
            }
        }

        if (selection.type === "video") {
            const file = await axios.get(selection.url, { responseType: "arraybuffer", headers: { "Accept": "application/octet-stream", "Content-Type": "application/octet-stream", "User-Agent": "GoogleBot" } });
            await ovl.sendMessage(ms_org, { video: Buffer.from(file.data), caption: "```Powered By OVL-MD-V2```" }, { quoted: ms });
        } else if (selection.type === "audio") {
            const file = await axios.get(selection.url, { responseType: "arraybuffer", headers: { "Accept": "application/octet-stream", "Content-Type": "application/octet-stream", "User-Agent": "GoogleBot" } });
            await ovl.sendMessage(ms_org, { audio: Buffer.from(file.data), mimetype: "audio/mp4" }, { quoted: ms });
        } else if (selection.type === "images") {
            for (const imgUrl of selection.urls) {
                const file = await axios.get(imgUrl, { responseType: "arraybuffer", headers: { "Accept": "application/octet-stream", "Content-Type": "application/octet-stream", "User-Agent": "GoogleBot" } });
                await ovl.sendMessage(ms_org, { image: Buffer.from(file.data) }, { quoted: ms });
            }
        }

    } catch (error) {
        ovl.sendMessage(ms_org, { text: `Erreur: ${error.message}` }, { quoted: ms });
        console.error('Error:', error);
    }
});

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
async (ms_org, ovl, { repondre, arg, ms }) => {
  try {
    const appName = arg.join(' ');
    if (!appName) return repondre("*Entrer le nom de l'application à rechercher*");

    const searchResults = await apkdl(appName);
    if (!Array.isArray(searchResults) || searchResults.length === 0) return repondre("*Application non existante*");

    const appData = searchResults[0];
    if (!appData.dllink || !appData.size) return repondre("*Impossible de récupérer le lien*");

    const fileSizeMB = parseFloat(appData.size.replace(/[^\d\.]/g, '')) || 0;
    if (fileSizeMB > 300) return repondre("Le fichier dépasse 300 Mo, impossible de le télécharger.");

    const tmpDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const apkFileName = (appData.name || "Downloader") + ".apk";
    const tempFilePath = path.join(tmpDir, apkFileName);

    const response = await axios.get(appData.dllink, { responseType: 'stream' });
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

    let thumbBuffer = null;
    try { thumbBuffer = (await axios.get(appData.icon, { responseType: 'arraybuffer' })).data; } catch {}

    await ovl.sendMessage(ms_org, {
      document: fs.createReadStream(tempFilePath),
      mimetype: 'application/vnd.android.package-archive',
      fileName: apkFileName,
      contextInfo: {
        externalAdReply: {
          title: appData.name,
          body: appData.size,
          mediaUrl: appData.icon || '',
          mediaType: 2,
          thumbnail: thumbBuffer,
          sourceUrl: appData.icon || ''
        }
      }
    }, { quoted: ms });

    fs.unlinkSync(tempFilePath);

  } catch (error) {
    console.error('Erreur apk:', error);
    repondre("*Erreur lors du traitement de la commande apk*");
  }
});
