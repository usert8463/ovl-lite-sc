const { ovlcmd } = require("../lib/ovlcmd");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { Antilink } = require("../DataBase/antilink");
const { Antitag } = require("../DataBase/antitag");
const { Antibot } = require("../DataBase/antibot");
const { GroupSettings } = require("../DataBase/events");
const fs = require("fs");
const { Antimention } = require('../DataBase/antimention');

ovlcmd(
  {
    nom_cmd: "tagall",
    classe: "Groupe",
    react: "💬",
    desc: t("tagall_desc") //"Commande pour taguer tous les membres d'un groupe"
  },
  async (dest, ovl, cmd_options) => {
    try {
      const { ms, repondre, arg, verif_Groupe, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

      if (!verif_Groupe) return repondre(t("tagall_group_only"));

      const messageTexte = arg?.length > 0 ? arg.join(" ") : "";
      const membresGroupe = await infos_Groupe.participants;

      let tagMessage = `${t("tagall_header")}\n`;
      tagMessage += `${t("tagall_author", { author: nom_Auteur_Message })}\n`;
      tagMessage += `${t("tagall_message", { message: messageTexte })}\n│\n`;

      membresGroupe.forEach(m => {
        tagMessage += `│◦❒ @${m.id.split("@")[0]}\n`;
      });

      tagMessage += `${t("tagall_footer")}\n`;

      if (verif_Admin) {
        await ovl.sendMessage(dest, {
          text: tagMessage,
          mentions: membresGroupe.map(m => m.id)
        }, { quoted: ms });
      } else {
        repondre(t("tagall_admin_only"));
      }
    } catch (error) {
      console.error("Erreur tagall :", error);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "tagadmin",
    classe: "Groupe",
    react: "💬",
    desc: t("tagadmin_desc") //"Commande pour taguer tous les administrateurs d'un groupe"
  },
  async (dest, ovl, cmd_options) => {
    try {
      const { ms, repondre, arg, verif_Groupe, infos_Groupe, nom_Auteur_Message, verif_Admin } = cmd_options;

      if (!verif_Groupe) return repondre(t("tagadmin_group_only"));

      const messageTexte = arg?.length > 0 ? arg.join(" ") : "";
      const membresGroupe = await infos_Groupe.participants;
      const adminsGroupe = membresGroupe.filter(m => m.admin).map(m => m.id);

      if (adminsGroupe.length === 0) return repondre(t("tagadmin_no_admin"));

      let tagMessage = `${t("tagadmin_header")}\n`;
      tagMessage += `${t("tagadmin_author", { author: nom_Auteur_Message })}\n`;
      tagMessage += `${t("tagadmin_message", { message: messageTexte })}\n│\n`;

      membresGroupe.forEach(m => {
        if (m.admin) tagMessage += `│◦❒ @${m.id.split("@")[0]}\n`;
      });

      tagMessage += `${t("tagadmin_footer")}\n`;

      if (verif_Admin) {
        await ovl.sendMessage(dest, {
          text: tagMessage,
          mentions: adminsGroupe
        }, { quoted: ms });
      } else {
        repondre(t("tagadmin_admin_only"));
      }
    } catch (error) {
      console.error("Erreur tagadmin :", error);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "tag",
    classe: "Groupe",
    react: "💬",
    desc: t("tag_desc") //"Partager un message à tous les membres d'un groupe"
  },
  async (dest, ovl, cmd_options) => {
    const { repondre, msg_Repondu, verif_Groupe, arg, verif_Admin, ms } = cmd_options;

    if (!verif_Groupe) return repondre(t("tag_group_only"));

    if (!verif_Admin) return repondre(t("tag_admin_only"));

    const metadata = await ovl.groupMetadata(dest);
    const membres = metadata.participants.map(p => p.id);
    let contenu_msg;

    if (msg_Repondu) {
      if (msg_Repondu.imageMessage) {
        const img = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
        contenu_msg = {
          image: { url: img },
          caption: msg_Repondu.imageMessage.caption,
          mentions: membres
        };
      } else if (msg_Repondu.videoMessage) {
        const vid = await ovl.dl_save_media_ms(msg_Repondu.videoMessage);
        contenu_msg = {
          video: { url: vid },
          caption: msg_Repondu.videoMessage.caption,
          mentions: membres
        };
      } else if (msg_Repondu.audioMessage) {
        const aud = await ovl.dl_save_media_ms(msg_Repondu.audioMessage);
        contenu_msg = {
          audio: { url: aud },
          mimetype: "audio/mp4",
          mentions: membres
        };
      } else if (msg_Repondu.stickerMessage) {
        const stk = await ovl.dl_save_media_ms(msg_Repondu.stickerMessage);
        const sticker = new Sticker(stk, {
          pack: "OVL-MD Hidtag",
          type: StickerTypes.FULL,
          quality: 80,
          background: "transparent"
        });
        contenu_msg = { sticker: await sticker.toBuffer(), mentions: membres };
      } else {
        contenu_msg = { text: msg_Repondu.conversation, mentions: membres };
      }
    } else {
      if (!arg?.[0]) return repondre(t("tag_no_arg_or_reply"));
      contenu_msg = { text: arg.join(" "), mentions: membres };
    }

    ovl.sendMessage(dest, contenu_msg, { quoted: ms });
  }
);

const createPollCmd = (nom_cmd, selectableCount = undefined) =>
  ovlcmd(
    {
      nom_cmd,
      classe: "Groupe",
      react: "📊",
      desc: t("poll_desc") //`Crée un sondage dans le groupe${selectableCount === 1 ? " (un seul vote autorisé)" : " (plusieurs votes autorisés)"}.`
    },
    async (dest, ovl, cmd_options) => {
      try {
        const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;

        if (!verif_Groupe) return repondre(t("poll_group_only"));

        const [pollName, pollOptions] = arg.join(" ").split(";");

        if (!pollOptions) return repondre(t("poll_no_options"));

        const options = pollOptions
          .split(",")
          .map(opt => opt.trim())
          .filter(opt => opt);

        if (options.length < 2) return repondre(t("poll_min_options"));

        if (verif_Admin) {
          await ovl.sendMessage(dest, {
            poll: {
              name: pollName,
              values: options,
              ...(selectableCount ? { selectableCount } : {})
            }
          }, { quoted: ms });
        } else {
          repondre(t("poll_admin_only"));
        }
      } catch (error) {
        console.error(`Erreur sondage (${nom_cmd}) :`, error);
        repondre(t("poll_creation_error"));
      }
    }
  );

createPollCmd("poll");
createPollCmd("poll2", 1);

ovlcmd(
  {
    nom_cmd: "kick",
    classe: "Groupe",
    react: "🛑",
    desc: t("kick_desc") //"Supprime un membre du groupe."
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Ovl_Admin, prenium_id, dev_num, ms } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: t("kick_group_only") }, { quoted: ms });

    if (!(prenium_id || verif_Admin))
      return ovl.sendMessage(ms_org, { text: t("kick_no_permission") }, { quoted: ms });

    const membres = await infos_Groupe.participants;
    const admins = membres.filter(m => m.admin).map(m => m.id);

    const membre =
      auteur_Msg_Repondu ||
      (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: t("kick_bot_not_admin") }, { quoted: ms });

    if (!membre || !membres.find(m => m.id === membre))
      return ovl.sendMessage(ms_org, { text: t("kick_member_not_found") }, { quoted: ms });

    if (admins.includes(membre))
      return ovl.sendMessage(ms_org, { text: t("kick_cant_kick_admin") }, { quoted: ms });

    if (dev_num.includes(membre))
      return ovl.sendMessage(ms_org, { text: t("kick_cant_kick_dev") }, { quoted: ms });

    try {
      await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
      ovl.sendMessage(
        ms_org,
        { text: `@${membre.split("@")[0]} ${t("kick_success")}`, mentions: [membre] },
        { quoted: ms }
      );
    } catch (err) {
      console.error("Erreur kick:", err);
      ovl.sendMessage(ms_org, { text: t("kick_error") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "kickall",
    classe: "Groupe",
    react: "🛑",
    desc: t("kickall_desc") //"Supprime tous les membres non administrateurs du groupe."
  },
  async (ms_org, ovl, cmd_options) => {
    const {
      verif_Groupe,
      verif_Admin,
      verif_Ovl_Admin,
      infos_Groupe,
      prenium_id,
      dev_num,
      ms,
      auteur_Message,
      GroupSettings
    } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: t("kickall_group_only") }, { quoted: ms });

    const membres = infos_Groupe.participants;
    const createur = membres[0]?.id;

    if (!(prenium_id || auteur_Message === createur))
      return ovl.sendMessage(ms_org, { text: t("kickall_no_permission") }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: t("kickall_bot_not_admin") }, { quoted: ms });

    const settings = await GroupSettings.findOne({ where: { id: ms_org } });
    if (settings?.goodbye === "oui")
      return ovl.sendMessage(ms_org, { text: t("kickall_goodbye_on") }, { quoted: ms });

    const nonAdmins = membres.filter(m => !m.admin && !dev_num.includes(m.id)).map(m => m.id);

    if (nonAdmins.length === 0)
      return ovl.sendMessage(ms_org, { text: t("kickall_no_non_admins") }, { quoted: ms });

    for (const membre of nonAdmins) {
      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`Erreur kickall pour ${membre}:`, err);
      }
    }

    ovl.sendMessage(
      ms_org,
      { text: t("kickall_success", { count: nonAdmins.length }) },
      { quoted: ms }
    );
  }
);

ovlcmd(
  {
    nom_cmd: "kickall2",
    classe: "Groupe",
    react: "🛑",
    desc: t("kickall2_desc") //"Supprime tous les membres non administrateurs du groupe en une seule fois."
  },
  async (ms_org, ovl, cmd_options) => {
    const {
      verif_Groupe,
      verif_Ovl_Admin,
      infos_Groupe,
      prenium_id,
      dev_num,
      ms,
      auteur_Message,
      GroupSettings
    } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: t("kickall_group_only") }, { quoted: ms });

    const membres = infos_Groupe.participants;
    const createur = membres[0]?.id;

    if (!(prenium_id || auteur_Message === createur))
      return ovl.sendMessage(ms_org, { text: t("kickall_no_permission") }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: t("kickall_bot_not_admin") }, { quoted: ms });

    const settings = await GroupSettings.findOne({ where: { id: ms_org } });
    if (settings?.goodbye === "oui")
      return ovl.sendMessage(ms_org, { text: t("kickall_goodbye_on") }, { quoted: ms });

    const nonAdmins = membres.filter(m => !m.admin && !dev_num.includes(m.id)).map(m => m.id);

    if (nonAdmins.length === 0)
      return ovl.sendMessage(ms_org, { text: t("kickall_no_non_admins") }, { quoted: ms });

    try {
      await ovl.groupParticipantsUpdate(ms_org, nonAdmins, "remove");
      ovl.sendMessage(
        ms_org,
        { text: t("kickall2_success", { count: nonAdmins.length }) },
        { quoted: ms }
      );
    } catch (err) {
      console.error("Erreur kickall2:", err);
      ovl.sendMessage(ms_org, { text: t("kickall2_error") }, { quoted: ms });
    }
  }
);

/*ovlcmd(
  {
    nom_cmd: "ckick",
    classe: "Groupe",
    react: "🛑",
    desc: t("ckick_desc") // "Supprime tous les membres non administrateurs dont le JID commence par un indicatif spécifique.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, verif_Ovl_Admin, infos_Groupe, arg, dev_num, prenium_id, ms, auteur_Message } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: t("group_only") }, { quoted: ms });

    const membres = infos_Groupe.participants;
    const createur = membres[0]?.id;

    if (!(prenium_id || auteur_Message === createur))
      return ovl.sendMessage(ms_org, { text: t("only_creator_or_premium") }, { quoted: ms });

    if (!arg[0])
      return ovl.sendMessage(ms_org, { text: t("specify_prefix") }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(ms_org, { text: t("bot_must_be_admin") }, { quoted: ms });

    const settings = await GroupSettings.findOne({ where: { id: ms_org } });
    if (settings?.goodbye === "oui")
      return ovl.sendMessage(ms_org, { text: t("goodbye_off_first") }, { quoted: ms });

    const indicatif = arg[0];
    const membresToKick = membres
      .filter(m => m.id.startsWith(indicatif) && !m.admin && !dev_num.includes(m.id))
      .map(m => m.id);

    if (membresToKick.length === 0)
      return ovl.sendMessage(ms_org, { text: t("no_non_admin_with_prefix", { indicatif }) }, { quoted: ms });

    for (const membre of membresToKick) {
      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "remove");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (err) {
        console.error(`Erreur exclusion ${membre} :`, err);
      }
    }

    ovl.sendMessage(ms_org, { text: t("kick_success_count", { count: membresToKick.length, indicatif }) }, { quoted: ms });
  }
);
*/

ovlcmd(
  {
    nom_cmd: "promote",
    classe: "Groupe",
    react: "⬆️",
    desc: t("promote_desc") //"Promouvoir un membre comme administrateur.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: t("group_only") }, { quoted: ms });
    if (verif_Admin || prenium_id) {
      const membres = await infos_Groupe.participants;
      const admins = membres.filter((m) => m.admin).map((m) => m.id);
      const membre = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

      if (!verif_Ovl_Admin)
        return ovl.sendMessage(ms_org, { text: t("bot_must_be_admin") }, { quoted: ms });
      if (!membre) return ovl.sendMessage(ms_org, { text: t("mention_member_promote") }, { quoted: ms });
      if (!membres.find((m) => m.id === membre))
        return ovl.sendMessage(ms_org, { text: t("member_not_found") }, { quoted: ms });
      if (admins.includes(membre))
        return ovl.sendMessage(ms_org, { text: t("already_admin") }, { quoted: ms });

      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "promote");
        ovl.sendMessage(ms_org, { text: `@${membre.split("@")[0]} ${t("promote_success")}`, mentions: [membre] }, { quoted: ms });
      } catch (err) {
        console.error("Erreur :", err);
        ovl.sendMessage(ms_org, { text: t("promote_error") }, { quoted: ms });
      }
    } else {
      return ovl.sendMessage(ms_org, { text: t("no_permission") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "demote",
    classe: "Groupe",
    react: "⬇️",
    desc: t("demote_desc") //"Retirer le rôle d'administrateur à un membre.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, auteur_Msg_Repondu, arg, infos_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, dev_num, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(ms_org, { text: t("group_only") }, { quoted: ms });
    if (verif_Admin || prenium_id) {
      const membres = await infos_Groupe.participants;
      const admins = membres.filter((m) => m.admin).map((m) => m.id);
      const membre = auteur_Msg_Repondu || (arg[0]?.includes("@") && `${arg[0].replace("@", "")}@lid`);

      if (!verif_Ovl_Admin)
        return ovl.sendMessage(ms_org, { text: t("bot_must_be_admin") }, { quoted: ms });
      if (!membre) return ovl.sendMessage(ms_org, { text: t("mention_member_demote") }, { quoted: ms });
      if (!membres.find((m) => m.id === membre))
        return ovl.sendMessage(ms_org, { text: t("member_not_found") }, { quoted: ms });
      if (!admins.includes(membre))
        return ovl.sendMessage(ms_org, { text: t("not_admin") }, { quoted: ms });

      if (dev_num.includes(membre)) {
        return ovl.sendMessage(ms_org, { text: t("cant_demote_dev") }, { quoted: ms });
      }

      try {
        await ovl.groupParticipantsUpdate(ms_org, [membre], "demote");
        ovl.sendMessage(ms_org, { text: `@${membre.split("@")[0]} ${t("demote_success")}`, mentions: [membre] }, { quoted: ms });
      } catch (err) {
        console.error("Erreur :", err);
        ovl.sendMessage(ms_org, { text: t("demote_error") }, { quoted: ms });
      }
    } else {
      return ovl.sendMessage(ms_org, { text: t("no_permission") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "del",
    classe: "Groupe",
    react: "🗑️",
    desc: t("del_desc") // "Supprimer un message.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { msg_Repondu, ms, auteur_Msg_Repondu, verif_Admin, verif_Ovl_Admin, verif_Groupe, dev_num, repondre, id_Bot, prenium_id } = cmd_options;

    if (!msg_Repondu) return repondre(t("reply_to_delete"));

    if (dev_num.includes(auteur_Msg_Repondu) && !id_Bot)
      return repondre(t("cant_delete_dev"));

    if (verif_Groupe) {
      if (!verif_Admin) return repondre(t("admin_required_delete"));
      if (!verif_Ovl_Admin) return repondre(t("bot_must_be_admin"));
    } else {
      if (!prenium_id) return repondre(t("premium_only_private"));
    }

    try {
      const key = {
        remoteJid: ms_org,
        fromMe: auteur_Msg_Repondu === id_Bot,
        id: ms.message.extendedTextMessage?.contextInfo?.stanzaId,
        participant: auteur_Msg_Repondu,
      };

      if (!key.id) return repondre(t("msg_id_not_found"));

      await ovl.sendMessage(ms_org, { delete: key });
    } catch (error) {
      repondre(`${t("error_occurred")}: ${error.message}`);
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gcreate",
    classe: "Groupe",
    react: "✅",
    desc: t("gcreate_desc") // "Crée un groupe avec juste toi comme membre.",
  },
  async (jid, ovl, { arg, prenium_id, ms }) => {
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: t("no_permission_create_group") }, { quoted: ms });
    }

    if (arg.length === 0) {
      return ovl.sendMessage(jid, { text: t("provide_group_name") }, { quoted: ms });
    }

    const name = arg.join(" ");

    try {
      const group = await ovl.groupCreate(name, []);
      await ovl.sendMessage(group.id, { text: t("group_created", { name }) }, { quoted: ms });
    } catch (err) {
      console.error("❌ Erreur lors de la création du groupe :", err);
      await ovl.sendMessage(jid, { text: t("group_creation_error") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gdesc",
    classe: "Groupe",
    react: "🔤",
    desc: t("gdesc_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, msg_Repondu, arg, ms, repondre } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (verif_Admin && verif_Ovl_Admin) {
      let desc;
      if (msg_Repondu) {
        desc = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
      } else if (arg.length) {
        desc = arg.join(' ');
      } else {
        return ovl.sendMessage(jid, { text: t("enter_new_desc") }, { quoted: ms });
      }

      await ovl.groupUpdateDescription(jid, desc);
    } else {
      ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "gname",
    classe: "Groupe",
    react: "🔤",
    desc: t("gname_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, msg_Repondu, arg, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (verif_Admin && verif_Ovl_Admin) {
      let name;
      if (msg_Repondu) {
        name = msg_Repondu.conversation || msg_Repondu.extendedTextMessage?.text;
      } else if (arg.length) {
        name = arg.join(' ');
      } else {
        return ovl.sendMessage(jid, { text: t("enter_new_name") }, { quoted: ms });
      }

      await ovl.groupUpdateSubject(jid, name);
    } else {
      ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "close",
    classe: "Groupe",
    react: "✅",
    desc: t("close_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "announcement");
    return ovl.sendMessage(jid, { text: t("close_mode_set") }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "open",
    classe: "Groupe",
    react: "✅",
    desc: t("open_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "not_announcement");
    return ovl.sendMessage(jid, { text: t("open_mode_set") }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "lock",
    classe: "Groupe",
    react: "✅",
    desc: t("lock_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "unlocked");
    return ovl.sendMessage(jid, { text: t("lock_mode_set") }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "unlock",
    classe: "Groupe",
    react: "✅",
    desc: t("unlock_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;

    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (!verif_Admin || !verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });

    await ovl.groupSettingUpdate(jid, "locked");
    return ovl.sendMessage(jid, { text: t("unlock_mode_set") }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "leave",
    classe: "Groupe",
    react: "😐",
    desc: t("leave_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { prenium_id, ms } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: t("leave_no_permission") }, { quoted: ms });
    }
    await ovl.sendMessage(jid, { text: t("leave_bye") }, { quoted: ms });
    await ovl.groupLeave(jid);
  }
);

ovlcmd(
  {
    nom_cmd: "link",
    classe: "Groupe",
    react: "🔗",
    desc: t("link_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });
    if (verif_Admin && verif_Ovl_Admin) {
      const code = await ovl.groupInviteCode(jid);
      await ovl.sendMessage(jid, { text: t("invite_link", { code }) }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "revoke",
    classe: "Groupe",
    react: "🔗",
    desc: t("revoke_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, verif_Ovl_Admin, ms } = cmd_options;
    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });
    if (verif_Admin && verif_Ovl_Admin) {
      await ovl.groupRevokeInvite(jid);
      await ovl.sendMessage(jid, { text: t("invite_reset") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "ginfo",
    classe: "Groupe",
    react: "🔎",
    desc: t("ginfo_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const metadata = await ovl.groupMetadata(jid);
    await ovl.sendMessage(jid, { text: t("ginfo_text", { id: metadata.id, name: metadata.subject, desc: metadata.desc || "-" }) }, { quoted: cmd_options.ms });
  }
);

ovlcmd(
  {
    nom_cmd: "join",
    classe: "Groupe",
    react: "😶‍🌫",
    desc: t("join_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { prenium_id, arg, ms } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(jid, { text: t("join_no_permission") }, { quoted: ms });
    }
    if (!arg.length) return ovl.sendMessage(jid, { text: t("join_no_link") }, { quoted: ms });
    const invite = arg.join("");
    const code = invite.split('/')[3];
    await ovl.groupAcceptInvite(code);
    await ovl.sendMessage(jid, { text: t("join_success") }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "acceptall",
    classe: "Groupe",
    react: "✅",
    desc: t("acceptall_desc"),
  },
  async (jid, ovl, { verif_Admin, prenium_id, verif_Ovl_Admin, verif_Groupe, ms }) => {
    if (!verif_Groupe) return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });
    if (!verif_Admin && !prenium_id) return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });
    if (!verif_Ovl_Admin) return ovl.sendMessage(jid, { text: t("bot_must_be_admin") }, { quoted: ms });

    try {
      const demandes = await ovl.groupRequestParticipantsList(jid);
      if (!demandes || demandes.length === 0)
        return ovl.sendMessage(jid, { text: t("no_pending_requests") }, { quoted: ms });

      const numeros = demandes.map(d => d.phone_number);
      await ovl.groupRequestParticipantsUpdate(jid, numeros, "approve");

      ovl.sendMessage(jid, { text: t("acceptall_success", { count: numeros.length }) }, { quoted: ms });
    } catch (err) {
      console.error(err);
      ovl.sendMessage(jid, { text: t("acceptall_fail") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "rejectall",
    classe: "Groupe",
    react: "❌",
    desc: t("rejectall_desc"),
  },
  async (jid, ovl, { verif_Admin, prenium_id, verif_Ovl_Admin, verif_Groupe, ms }) => {
    if (!verif_Groupe)
      return ovl.sendMessage(jid, { text: t("group_only") }, { quoted: ms });

    if (!verif_Admin && !prenium_id)
      return ovl.sendMessage(jid, { text: t("no_permission") }, { quoted: ms });

    if (!verif_Ovl_Admin)
      return ovl.sendMessage(jid, { text: t("bot_must_be_admin") }, { quoted: ms });

    try {
      const demandes = await ovl.groupRequestParticipantsList(jid);
      if (!demandes || demandes.length === 0)
        return ovl.sendMessage(jid, { text: t("no_pending_requests") }, { quoted: ms });

      const numeros = demandes.map(d => d.phone_number);
      await ovl.groupRequestParticipantsUpdate(jid, numeros, "reject");

      ovl.sendMessage(jid, { text: t("rejectall_success", { count: numeros.length }) }, { quoted: ms });
    } catch (err) {
      console.error(err);
      ovl.sendMessage(jid, { text: t("rejectall_fail") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "getpp",
    classe: "Groupe",
    react: "🔎",
    desc: t("getpp_desc"),
    alias: ["gpp"]
  },
  async (jid, ovl, cmd_options) => {
    try {
      const ppgroup = await ovl.profilePictureUrl(jid, 'image');
      await ovl.sendMessage(jid, { image: { url: ppgroup } }, { quoted: cmd_options.ms });
    } catch (error) {
      console.error("Erreur lors de l'obtention de la photo de profil :", error);
      await ovl.sendMessage(jid, { text: t("getpp_fail") }, { quoted: cmd_options.ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "updatepp",
    classe: "Groupe",
    react: "🎨",
    desc: t("updatepp_desc"),
    alias: ["upp"]
  },
  async (jid, ovl, cmd_options) => {
    const { arg, verif_Groupe, msg_Repondu, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;

    if (!(verif_Admin || prenium_id)) {
      return ovl.sendMessage(jid, { text: t("updatepp_no_permission") }, { quoted: ms });
    }

    if (!verif_Ovl_Admin) {
      return ovl.sendMessage(jid, { text: t("bot_must_be_admin") }, { quoted: ms });
    }

    if (!msg_Repondu || !msg_Repondu.imageMessage) {
      return ovl.sendMessage(jid, { text: t("updatepp_mention_image") }, { quoted: ms });
    }

    try {
      const img = await ovl.dl_save_media_ms(msg_Repondu.imageMessage);
      await ovl.updateProfilePicture(jid, { url: img });
      ovl.sendMessage(jid, { text: t("updatepp_success") }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors du changement de PP :", error);
      ovl.sendMessage(jid, { text: t("updatepp_fail") }, { quoted: ms });
    }
  }
);

ovlcmd(
  {
    nom_cmd: "removepp",
    classe: "Groupe",
    react: "🗑️",
    desc: t("removepp_desc"),
    alias: ["rpp"]
  },
  async (jid, ovl, cmd_options) => {
    const { verif_Groupe, verif_Admin, prenium_id, verif_Ovl_Admin, ms } = cmd_options;

    if (!(verif_Admin || prenium_id)) {
      return ovl.sendMessage(jid, { text: t("removepp_no_permission") }, { quoted: ms });
    }

    if (!verif_Ovl_Admin) {
      return ovl.sendMessage(jid, { text: t("bot_must_be_admin") }, { quoted: ms });
    }

    try {
      await ovl.removeProfilePicture(jid);
      ovl.sendMessage(jid, { text: t("removepp_success") }, { quoted: ms });
    } catch (error) {
      console.error("Erreur lors de la suppression de la PP :", error);
      ovl.sendMessage(jid, { text: t("removepp_fail") }, { quoted: ms });
    }
  }
);
 
/*ovlcmd(
  {
    nom_cmd: "vcf",
    classe: "Groupe",
    react: "📇",
    desc: t("vcf_desc"),
  },
  async (ms_org, ovl, cmd_options) => {
    const { verif_Groupe, ms } = cmd_options;

    if (!verif_Groupe)
      return ovl.sendMessage(ms_org, { text: t("group_only") }, { quoted: ms });

    try {
      const groupMetadata = await ovl.groupMetadata(ms_org);
      if (!groupMetadata?.participants)
        return ovl.sendMessage(ms_org, { text: t("vcf_no_metadata") }, { quoted: ms });

      const participants = groupMetadata.participants;
      const vcfData = participants.map(participant => {
        const number = participant.id.split('@')[0];
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${number}\nTEL;TYPE=CELL:${number}\nEND:VCARD`;
      });

      const groupName = groupMetadata.subject || `Groupe_${ms_org.split('@')[0]}`;
      const vcfFileName = `contacts_groupe_${groupName}.vcf`;
      const vcfFilePath = `./${vcfFileName}`;

      fs.writeFileSync(vcfFilePath, vcfData.join('\n'));

      const message = t("vcf_caption", { groupName, count: participants.length });

      const vcfFile = fs.readFileSync(vcfFilePath);
      await ovl.sendMessage(ms_org, {
        document: vcfFile,
        mimetype: 'text/vcard',
        filename: vcfFileName,
        caption: message
      }, { quoted: ms });

      fs.unlinkSync(vcfFilePath);

    } catch (error) {
      console.error('Erreur lors du traitement de la commande vcf:', error);
      return ovl.sendMessage(ms_org, { text: t("vcf_error") }, { quoted: ms });
    }
  }
);
*/

ovlcmd(
  {
    nom_cmd: "antilink",
    classe: "Groupe",
    react: "🔗",
    desc: t("antilink_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      if (!verif_Groupe) return repondre(t("group_only"));
      if (!verif_Admin) return repondre(t("admin_only"));

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antilink.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode)
          return repondre(t("antilink_already_mode", { mode: sousCommande }));
        settings.mode = newMode;
        await settings.save();
        return repondre(t("antilink_mode_changed", { mode: sousCommande }));
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui')
          return repondre(t("antilink_enable_first"));
        if (settings.type === sousCommande)
          return repondre(t("antilink_already_action", { action: sousCommande }));
        settings.type = sousCommande;
        await settings.save();
        return repondre(t("antilink_action_changed", { action: sousCommande }));
      }

      return repondre(t("antilink_usage"));
    } catch (error) {
      console.error("Erreur lors de la configuration d'antilink :", error);
      repondre(t("command_error"));
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antitag",
    classe: "Groupe",
    react: "🔗",
    desc: t("antitag_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      if (!verif_Groupe) return repondre(t("group_only"));
      if (!verif_Admin) return repondre(t("admin_only"));

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antitag.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode)
          return repondre(t("antitag_already_mode", { mode: sousCommande }));
        settings.mode = newMode;
        await settings.save();
        return repondre(t("antitag_mode_changed", { mode: sousCommande }));
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui')
          return repondre(t("antitag_enable_first"));
        if (settings.type === sousCommande)
          return repondre(t("antitag_already_action", { action: sousCommande }));
        settings.type = sousCommande;
        await settings.save();
        return repondre(t("antitag_action_changed", { action: sousCommande }));
      }

      return repondre(t("antitag_usage"));
    } catch (error) {
      console.error("Erreur lors de la configuration d'antitag :", error);
      repondre(t("command_error"));
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antibot",
    classe: "Groupe",
    react: "🔗",
    desc: t("antibot_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      if (!verif_Groupe) return repondre(t("group_only"));
      if (!verif_Admin) return repondre(t("admin_only"));

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ["on", "off"];
      const validTypes = ["supp", "warn", "kick"];

      const [settings] = await Antibot.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: "non", type: "supp" },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === "on" ? "oui" : "non";
        if (settings.mode === newMode)
          return repondre(t("antibot_already_mode", { mode: sousCommande }));
        settings.mode = newMode;
        await settings.save();
        return repondre(t("antibot_mode_changed", { mode: sousCommande }));
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== "oui")
          return repondre(t("antibot_enable_first"));
        if (settings.type === sousCommande)
          return repondre(t("antibot_already_action", { action: sousCommande }));
        settings.type = sousCommande;
        await settings.save();
        return repondre(t("antibot_action_changed", { action: sousCommande }));
      }

      return repondre(t("antibot_usage"));
    } catch (error) {
      console.error("Erreur lors de la configuration d'antibot :", error);
      repondre(t("command_error"));
    }
  }
);

ovlcmd(
  {
    nom_cmd: "antimentiongc",
    classe: "Groupe",
    react: "📢",
    desc: t("antimention_desc"),
  },
  async (jid, ovl, cmd_options) => {
    const { ms, repondre, arg, verif_Groupe, verif_Admin } = cmd_options;
    try {
      if (!verif_Groupe) return repondre(t("group_only"));
      if (!verif_Admin) return repondre(t("admin_only"));

      const sousCommande = arg[0]?.toLowerCase();
      const validModes = ['on', 'off'];
      const validTypes = ['supp', 'warn', 'kick'];

      const [settings] = await Antimention.findOrCreate({
        where: { id: jid },
        defaults: { id: jid, mode: 'non', type: 'supp' },
      });

      if (validModes.includes(sousCommande)) {
        const newMode = sousCommande === 'on' ? 'oui' : 'non';
        if (settings.mode === newMode)
          return repondre(t("antimention_already_mode", { mode: sousCommande }));
        settings.mode = newMode;
        await settings.save();
        return repondre(t("antimention_mode_changed", { mode: sousCommande }));
      }

      if (validTypes.includes(sousCommande)) {
        if (settings.mode !== 'oui')
          return repondre(t("antimention_enable_first"));
        if (settings.type === sousCommande)
          return repondre(t("antimention_already_action", { action: sousCommande }));
        settings.type = sousCommande;
        await settings.save();
        return repondre(t("antimention_action_changed", { action: sousCommande }));
      }

      return repondre(t("antimention_usage"));
    } catch (error) {
      console.error("Erreur lors de la configuration d'antimention :", error);
      repondre(t("command_error"));
    }
  }
);

const commands = [
  { nom_cmd: "welcome", react: "👋", desc_key: "welcome_desc" },
  { nom_cmd: "goodbye", react: "👋", desc_key: "goodbye_desc" },
  { nom_cmd: "antipromote", react: "🛑", desc_key: "antipromote_desc" },
  { nom_cmd: "antidemote", react: "🛑", desc_key: "antidemote_desc" },
];

commands.forEach(({ nom_cmd, react, desc_key }) => {
  ovlcmd(
    {
      nom_cmd,
      classe: "Groupe",
      react,
      desc: t(desc_key),
    },
    async (jid, ovl, cmd_options) => {
      const { repondre, arg, verif_Groupe, verif_Admin, t } = cmd_options;

      try {
        if (!verif_Groupe) {
          return repondre(t("group_only_command"));
        }

        if (!verif_Admin) {
          return repondre(t("admin_only_command"));
        }

        const sousCommande = arg[0]?.toLowerCase();
        const validModes = ["on", "off"];

        const [settings] = await GroupSettings.findOrCreate({
          where: { id: jid },
          defaults: { id: jid, [nom_cmd]: "non" },
        });

        if (validModes.includes(sousCommande)) {
          const newMode = sousCommande === "on" ? "oui" : "non";
          if (settings[nom_cmd] === newMode) {
            return repondre(t("already_set", { cmd: nom_cmd, mode: sousCommande }));
          }
          settings[nom_cmd] = newMode;
          await settings.save();
          return repondre(t("set_success", { cmd: nom_cmd, mode: sousCommande }));
        }

        return repondre(t("usage_simple", { cmd: nom_cmd, desc: t(desc_key).toLowerCase() }));
      } catch (error) {
        console.error(`Erreur configuration ${nom_cmd}:`, error);
        return repondre(t("generic_error"));
      }
    }
  );
});
