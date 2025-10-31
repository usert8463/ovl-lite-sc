const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
  Browsers,
  delay,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys');
const { 
  get_session,
  restaureAuth,
  get_all_id,
  del_id
} = require('./lib/manage_connections');
const { message_upsert, connection_update, dl_save_media_ms, recup_msg } = require('./Ovl_events');

const MAX_SESSIONS = 500;
const sessionsActives = new Set();
const instancesSessions = new Map();

async function startGenericSession({ numero, sessionId }) {
  try {
    const sessionData = await get_session(sessionId);
    await restaureAuth(numero, sessionData.creds, sessionData.keys);
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${numero}`);
    const ovl = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      keepAliveIntervalMs: 10000,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
    });
    ovl.ev.on('messages.upsert', async (m) => message_upsert(m, ovl));
    ovl.ev.on('connection.update', async (con) => {
      connection_update(con, del_id, sessionId, ovl, () => startGenericSession({ numero, sessionId }));
    });
    ovl.ev.on('creds.update', saveCreds);
    ovl.dl_save_media_ms = (msg, filename = '', attachExt = true, dir = './downloads') =>
      dl_save_media_ms(ovl, msg, filename, attachExt, dir);
    ovl.recup_msg = (params = {}) => recup_msg({ ovl, ...params });
    instancesSessions.set(numero, ovl);
    sessionsActives.add(numero);
    console.log(`✅ Session ${numero} démarrée`);
    return ovl;
  } catch (err) {
    console.error(`❌ Erreur lors du démarrage de la session ${numero} :`, err.message);
    return null;
  }
}

async function stopSession(numero) {
  if (!instancesSessions.has(numero)) return;
  const ovl = instancesSessions.get(numero);
  try {
    await ovl.ws.close();
    console.log(`🛑 Session ${numero} arrêtée.`);
  } catch (err) {
    console.error(`❌ Erreur lors de l'arrêt de la session ${numero} :`, err.message);
  }
  instancesSessions.delete(numero);
  sessionsActives.delete(numero);
  const sessionDir = path.join(__dirname, '../auth', numero);
  if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
}

async function startSecondarySessions() {
  const sessions = await get_all_id();
  const numerosEnBase = new Set(sessions.map(s => s.numero));
  for (const numero of sessionsActives) {
    if (!numerosEnBase.has(numero)) {
      console.log(`⚠️ Session supprimée détectée : ${numero} - arrêt en cours.`);
      await stopSession(numero);
    }
  }
  for (const { numero, session_id } of sessions) {
    if (sessionsActives.size >= MAX_SESSIONS) break;
    if (!sessionsActives.has(numero)) {
      try {
        await startGenericSession({ numero, sessionId: session_id });
      } catch (err) {
        console.error(`❌ Impossible de démarrer ${numero} :`, err.message);
      }
    }
  }
}

function surveillerNouvellesSessions() {
  setInterval(async () => {
    try {
      await startSecondarySessions();
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour des sessions :', err.message);
    }
  }, 10000);
}

(async () => {
  console.log('🚀 Initialisation des sessions secondaires...');
  await delay(5000);
  await startSecondarySessions();
  surveillerNouvellesSessions();
})();

process.on('uncaughtException', (e) => console.log('Erreur non capturée :', e.message));
process.on('unhandledRejection', (reason) => console.error('Promesse rejetée :', reason));
