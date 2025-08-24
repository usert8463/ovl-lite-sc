const fs = require('fs');
const path = require('path');
const { delay, DisconnectReason } = require("@whiskeysockets/baileys");
let evt = require("../lib/ovlcmd");
const pkg = require('../package');
const config = require("../set");
const { installpg } = require("../lib/plugin");
const { manage_env } = require("../lib/manage_env");

async function connection_update(con, ovl, main, startNextSession = null) {
    const { connection, lastDisconnect } = con;

    try {
        switch (connection) {
            case "connecting":
                console.log("🌍 Connexion en cours...");
                break;

            case "open":
                try {
                    console.log(`
╭─────────────────╮
│                 
│    🎉  OVL BOT ONLINE 🎉    
│                 
╰─────────────────╯
`);

                    console.log("🔄 Synchronisation des variables d'environnement...");
                    await manage_env();
                    console.log("✅ Variables synchronisées.");

                    const commandes = fs.readdirSync(path.join(__dirname, "../cmd"))
                        .filter(f => path.extname(f).toLowerCase() === ".js");

                    console.log("📂 Chargement des commandes :");
                    for (const fichier of commandes) {
                        try {
                            require(path.join(__dirname, "../cmd", fichier));
                            console.log(`  ✓ ${fichier}`);
                        } catch (e) {
                            console.error(`  ✗ ${fichier} — erreur :`, e);
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

                    try {
                        await ovl.sendMessage(ovl.user.id, {
                            text: start_msg,
                            contextInfo: {
                                forwardingScore: 1,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363371282577847@newsletter',
                                    newsletterName: 'ᴏᴠʟ-ᴍᴅ-ᴠ𝟸',
                                },
                            }
                        });
                    } catch (err) {
                        console.error("❌ Erreur lors de l'envoi du message de démarrage :", err);
                    }

                    await delay(10000);

                    if (startNextSession) {
                        try {
                            await startNextSession();
                        } catch (err) {
                            console.error("❌ Erreur lors du lancement de la session suivante :", err);
                        }
                    }
                } catch (err) {
                    console.error("❌ Erreur pendant la phase d'ouverture :", err);
                }
                break;

            case "close":
                try {
                    const error = lastDisconnect?.error;
                    const code = error?.output?.statusCode || error?.statusCode;

                    console.log("⛔ Déconnexion détectée !");
                    console.error("🔎 Détails de l'erreur :", error);

                    if (code === DisconnectReason.loggedOut) {
                        console.log("🚪 Session terminée définitivement. Supprimez la DB et reconnectez-vous.");
                    } else {
                        console.log(`⚠️ Connexion perdue (code: ${code || "inconnu"}), tentative de reconnexion...`);
                        await delay(5000);
                        main();
                    }
                } catch (err) {
                    console.error("❌ Erreur lors du traitement de la déconnexion :", err);
                }
                break;

            default:
                console.log("ℹ️ Mise à jour de la connexion :", connection);
        }
    } catch (err) {
        console.error("💥 Erreur imprévue dans connection_update :", err);
    }
}

module.exports = connection_update;
