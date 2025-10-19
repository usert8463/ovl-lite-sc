const { ovlcmd } = require("../lib/ovlcmd");

ovlcmd(
    {
        nom_cmd: "save",
        classe: "Status",
        react: "💾",
        desc: "Télécharge un statut WhatsApp",
    },
    async (ms_org, ovl, _cmd_options) => {
        const { ms, msg_Repondu, repondre, quote } = _cmd_options;

        try {
            if (!msg_Repondu || !quote?.remoteJid || quote.remoteJid !== "status@broadcast") {
                return repondre("Merci de répondre à un statut WhatsApp.");
            }

            let media, options = { quoted: ms };

            if (msg_Repondu.extendedTextMessage) {
                await ovl.sendMessage(ovl.user.id, { text: msg_Repondu.extendedTextMessage.text }, options);
            } else if (msg_Repondu.imageMessage) {
                media = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
                await ovl.sendMessage(ovl.user.id, { image: { url: media }, caption: msg_Repondu.imageMessage.caption }, options);
            } else if (msg_Repondu.videoMessage) {
                media = await ovl.dl_save_media_ms(msg_Repondu.videoMessage);
                await ovl.sendMessage(ovl.user.id, { video: { url: media }, caption: msg_Repondu.videoMessage.caption }, options);
            } else if (msg_Repondu.audioMessage) {
                media = await ovl.dl_save_media_ms(msg_Repondu.audioMessage);
                await ovl.sendMessage(ovl.user.id, { audio: { url: media }, mimetype: "audio/mp4", ptt: false }, options);
            } else {
                return repondre("Ce type de statut n'est pas pris en charge.");
            }
        } catch (_error) {
            console.error("Erreur lors du téléchargement du statut :", _error.message || _error);
        }
    }
);
