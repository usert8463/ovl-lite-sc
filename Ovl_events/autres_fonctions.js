const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const FileType = require('file-type');
const { getJid } = require('./Message_upsert_events');

async function dl_save_media_ms(ovl, message, filename = '', attachExtension = true, directory = './downloads') {
    try {
        const quoted = message.msg || message;
        const mime = quoted.mimetype || '';
        const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

        if (!mime) {
            throw new Error("Type MIME non spécifié ou non pris en charge.");
        }

        const stream = await downloadContentFromMessage(quoted, messageType);
        const bufferChunks = [];
        for await (const chunk of stream) {
            bufferChunks.push(chunk);
        }

        const buffer = Buffer.concat(bufferChunks);
        const type = await FileType.fromBuffer(buffer);
        if (!type) {
            throw new Error("Type de fichier non reconnu");
        }

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        const trueFileName = attachExtension ? `${filename}.${type.ext}` : filename;
        const filePath = path.resolve(directory, trueFileName);

        await fs.promises.writeFile(filePath, buffer);

        return filePath;
    } catch (error) {
        console.error('Erreur lors du téléchargement et de la sauvegarde du fichier:', error);
        throw error;
    }
}

async function recup_msg({ ovl, auteur, ms_org, temps = 30000 } = {}) {
  return new Promise(async (resolve, reject) => {
    if (auteur !== undefined && typeof auteur !== "string") return reject(new Error("L'auteur doit être une chaîne si défini."));
    if (ms_org !== undefined && typeof ms_org !== "string") return reject(new Error("Le ms_org doit être une chaîne si défini."));
    if (typeof temps !== "number") return reject(new Error("Le temps doit être un nombre."));

    const auteur_jid = auteur && ms_org ? await getJid(auteur, ms_org, ovl) : auteur;

    let timer;

    const listener = async ({ type, messages }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        const idSalon = msg.key.remoteJid;

        const expJid = msg.key.fromMe
          ? ovl.user.id
          : msg.key.participant
            ? await getJid(msg.key.participant, idSalon, ovl)
            : idSalon;

        if (auteur_jid && ms_org) {
          if (expJid === auteur_jid && idSalon === ms_org) {
            ovl.ev.off("messages.upsert", listener);
            if (timer) clearTimeout(timer);
            return resolve(msg);
          }
        } else if (auteur_jid && !ms_org) {
          if (expJid === auteur_jid) {
            ovl.ev.off("messages.upsert", listener);
            if (timer) clearTimeout(timer);
            return resolve(msg);
          }
        } else if (!auteur_jid && ms_org) {
          if (idSalon === ms_org) {
            ovl.ev.off("messages.upsert", listener);
            if (timer) clearTimeout(timer);
            return resolve(msg);
          }
        } else {
          ovl.ev.off("messages.upsert", listener);
          if (timer) clearTimeout(timer);
          return resolve(msg);
        }
      }
    };

    ovl.ev.on("messages.upsert", listener);

    if (temps > 0) {
      timer = setTimeout(() => {
        ovl.ev.off("messages.upsert", listener);
        reject(new Error("Timeout"));
      }, temps);
    }
  });
}

module.exports = { dl_save_media_ms, recup_msg };
