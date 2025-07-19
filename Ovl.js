const fs = require('fs');
const path = require('path');
const pino = require("pino");
const axios = require('axios');

const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion,
  delay
} = require("@whiskeysockets/baileys");

const { getMessage } = require('./lib/store');
const get_session = require('./DataBase/session');
const config = require("./set");
const { useSQLiteAuthState, WAAuth } = require('./lib/OvlAuth');

const {
  message_upsert,
  group_participants_update,
  connection_update,
  dl_save_media_ms,
  recup_msg
} = require('./Ovl_events');

const { getSecondAllSessions, getSecondSession } = require("./DataBase/connect");

const MAX_SESSIONS = 100;
const sessionsActives = new Set();
const instancesSessions = new Map();

async function startGenericSession({ numero, isPrincipale = false, sessionId = null }) {
  try {
    const instanceId = isPrincipale ? "principale" : numero;
    const sessionData = await get_session(sessionId);
    await WAAuth.upsert({ key: `creds--${instanceId}`, value: sessionData || null });
    const { state, saveCreds } = await useSQLiteAuthState(instanceId);
    const { version } = await fetchLatestBaileysVersion();
    const ovl = makeWASocket({
      version,
      auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      logger: pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
      keepAliveIntervalMs: 10000,
      getMessage: async (key) => {
        const msg = getMessage(key.id);
        return msg?.message || undefined;
      }
    });
    ovl.ev.on("messages.upsert", async (m) => message_upsert(m, ovl));
    ovl.ev.on("group-participants.update", async (data) => group_participants_update(data, ovl));
    ovl.ev.on("connection.update", async (con) => {
      connection_update(
        con,
        ovl,
        () => startGenericSession({ numero, isPrincipale, sessionId }),
        isPrincipale ? async () => await startSecondarySessions() : undefined
      );
    });
    ovl.ev.on("creds.update", saveCreds);
    ovl.dl_save_media_ms = (msg, filename = '', attachExt = true, dir = './downloads') =>
      dl_save_media_ms(ovl, msg, filename, attachExt, dir);
    ovl.recup_msg = (params = {}) =>
      recup_msg({ ovl, ...params });
    console.log(`✅ Session ${isPrincipale ? "principale" : "secondaire " + numero} démarrée`);
    return ovl;
  } catch (err) {
    console.error(`❌ Erreur session ${isPrincipale ? "principale" : numero} :`, err.message);
    return null;
  }
}

async function stopSession(numero) {
  if (instancesSessions.has(numero)) {
    const ovl = instancesSessions.get(numero);
    try {
      await ovl.logout();
      ovl.ev.removeAllListeners();
      console.log(`🛑 Session ${numero} arrêtée.`);
    } catch (err) {
      console.error(`❌ Erreur lors de l'arrêt de la session ${numero} :`, err.message);
    }
    instancesSessions.delete(numero);
    sessionsActives.delete(numero);
    await WAAuth.destroy({ where: { key: numero } });
  }
}

async function startPrincipalSession() {
  await delay(45000);
  const sess = config.SESSION_ID || "";
  if (!(sess && sess.startsWith("Ovl-MD_") && sess.endsWith("_SESSION-ID"))) return;
  const ovlPrincipale = await startGenericSession({ numero: "principale", isPrincipale: true, sessionId: sess });
  if (ovlPrincipale) instancesSessions.set("principale", ovlPrincipale);
  await startSecondarySessions();
  console.log(`🤖 Session principale + secondaires démarrées : ${sessionsActives.size}/${MAX_SESSIONS}`);
  surveillerNouvellesSessions();
}

async function startSecondarySessions() {
  const sessions = await getSecondAllSessions();
  const numerosEnBase = new Set(sessions.map(s => s.numero));
  for (const numero of sessionsActives) {
    if (!numerosEnBase.has(numero)) {
      console.log(`⚠️ Session supprimée détectée : ${numero} - arrêt en cours.`);
      await stopSession(numero);
    }
  }
  for (const { numero } of sessions) {
    if (sessionsActives.size >= MAX_SESSIONS) {
      console.log(`❌ Limite de sessions atteinte (${sessionsActives.size}/${MAX_SESSIONS}).`);
      break;
    }
    if (!sessionsActives.has(numero)) {
      const ovl = await startGenericSession({ numero });
      if (ovl) {
        sessionsActives.add(numero);
        instancesSessions.set(numero, ovl);
        console.log(`✅ Démarrage terminé — Sessions actives : ${sessionsActives.size}/${MAX_SESSIONS}`);
      }
    }
  }
}

function surveillerNouvellesSessions() {
  setInterval(async () => {
    try {
      await startSecondarySessions();
    } catch (err) {
      console.error("❌ Erreur lors de la vérification des sessions secondaires :", err.message);
    }
  }, 10000);
}

startPrincipalSession().catch((err) => {
  console.error("❌ Erreur inattendue :", err.message || err);
});

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let dernierPingRecu = Date.now();

app.get('/', (req, res) => {
  dernierPingRecu = Date.now();
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OVL-Bot Web Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #121212; font-family: Arial, sans-serif; color: #fff; overflow: hidden; }
    .content { text-align: center; padding: 30px; background-color: #1e1e1e; border-radius: 12px; box-shadow: 0 8px 20px rgba(255,255,255,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .content:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(255,255,255,0.15); }
    h1 { font-size: 2em; color: #f0f0f0; margin-bottom: 15px; letter-spacing: 1px; }
    p { font-size: 1.1em; color: #d3d3d3; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="content">
    <h1>Bienvenue sur OVL-MD-V2</h1>
    <p>Votre assistant WhatsApp</p>
  </div>
</body>
</html>`);
});

app.listen(port, () => {
  console.log("Listening on port: " + port);
  setupAutoPing(`http://localhost:${port}/`);
});

function setupAutoPing(url) {
  setInterval(async () => {
    try {
      const res = await axios.get(url);
      if (res.data) {
        console.log(`Ping: OVL-MD-V2✅`);
      }
    } catch (err) {
      console.error('Erreur lors du ping', err.message);
    }
  }, 30000);
}

process.on("uncaughtException", async (e) => {
  console.log("Une erreur inattendue est survenue :", e.message);
});
