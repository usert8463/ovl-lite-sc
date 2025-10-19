const fs = require('fs');
const path = require('path');
const { delay, DisconnectReason } = require("@whiskeysockets/baileys");
let evt = require("../lib/ovlcmd");
const pkg = require('../package');
const config = require("../set");

async function connection_update(con, ovl, main, startNextSession = null) {
    const { connection, lastDisconnect } = con;

    switch (connection) {
        case "connecting":
            console.log("🌍 Connexion en cours...");
            break;

        case "open":
            console.log(`
╭─────────────────╮
│                          
│    🎉  OVL BOT ONLINE 🎉   
│                          
╰─────────────────╯
`);            
            const commandes = fs.readdirSync(path.join(__dirname, "../cmd"))
                .filter(f => path.extname(f).toLowerCase() === ".js");

            console.log("📂 Chargement des commandes :");
            for (const fichier of commandes) {
                try {
                    require(path.join(__dirname, "../cmd", fichier));
                    console.log(`  ✓ ${fichier}`);
                } catch (e) {
                    console.log(`  ✗ ${fichier} — erreur : ${e.message}`);
                }
            }

            installpg();

            const start_msg = `╭───〔 🤖 𝙊𝙑𝙇 𝘽𝙊𝙏 〕───⬣
│ ߷ *Etat*       ➜ Connecté ✅
│ ߷ *Préfixe*    ➜ ${config.PREFIXE}
│ ߷ *Mode*       ➜ ${config.MODE}
│ ߷ *Commandes*  ➜ ${evt.cmd.length}
│ ߷ *Version*    ➜ ${pkg.version}
│ ߷ *Développeur*➜ Ainz
╰──────────────⬣`;

            console.log(start_msg + "\n");

            await delay(5000);

            while (!ovl.user?.id) {
                await delay(1000);
            }

            await ovl.sendMessage(ovl.user.id, {
                text: start_msg,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363371282577847@newsletter',
                        newsletterName: 'ᴏᴠʟ-ᴍᴅ-ᴠ𝟸'
                    }
                }
            });

            await delay(10000);
            
            if (startNextSession) {
                await startNextSession();
            }
            
            break;

        case "close":
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log("⛔ Déconnecté : Session terminée.");
            } else {
                console.log("⚠️ Connexion perdue, tentative de reconnexion...");
                await delay(5000);
                main();
            }
            break;

        default:
    }
}

module.exports = connection_update;
