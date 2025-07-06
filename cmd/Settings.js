const axios = require("axios");
const { ovlcmd } = require("../lib/ovlcmd");
const config = require('../set');
const os = require('os');
const { execSync } = require("child_process");
const RENDER_API_KEY = config.RENDER_API_KEY;
const host = os.hostname();
const SERVICE_ID = host.split("-hibernate")[0]; 
const simpleGit = require("simple-git");
const { exec } = require("child_process");

const git = simpleGit();


const headers = {
  Authorization: `Bearer ${RENDER_API_KEY}`,
  "Content-Type": "application/json",
};

function checkConfig() {
  if (!RENDER_API_KEY) {
    return "*Erreur :* La variable `RENDER_API_KEY` doivent être définies dans la configuration.";
  }
  return null;
}

async function manageEnvVar(action, key, value = null) {
  const configError = checkConfig();
  if (configError) return configError;

  try {
    const response = await axios.get(
      `https://api.render.com/v1/services/${SERVICE_ID}/env-vars`,
      { headers }
    );
    let envVars = response.data.map((v) => ({ key: v.envVar.key, value: v.envVar.value }));

    if (action === "setvar") {
      const existingVar = envVars.find((v) => v.key === key);

      if (existingVar) {
        existingVar.value = value;
      } else {
        envVars.push({ key, value });
      }

      await axios.put(
        `https://api.render.com/v1/services/${SERVICE_ID}/env-vars`,
        envVars,
        { headers }
      );
      return `✨ *Variable définie avec succès !*\n📌 *Clé :* \`${key}\`\n📥 *Valeur :* \`${value}\``;

    } else if (action === "delvar") {
      envVars = envVars.filter((v) => v.key !== key);

      await axios.put(
        `https://api.render.com/v1/services/${SERVICE_ID}/env-vars`,
        envVars,
        { headers }
      );
      return `✅ *Variable supprimée avec succès !*\n📌 *Clé :* \`${key}\``;

    } else if (action === "getvar") {
      if (key === "all") {
        if (envVars.length === 0) return "📭 *Aucune variable disponible.*";

        const allVars = envVars
          .map((v) => `📌 *${v.key}* : \`${v.value}\``)
          .join("\n");
        return `✨ *Liste des variables d'environnement :*\n\n${allVars}`;
      }

      const envVar = envVars.find((v) => v.key === key);
      return envVar
        ? `📌 *${key}* : \`${envVar.value}\``
        : `*Variable introuvable :* \`${key}\``;
    }
  } catch (error) {
    console.error(error);
    return `*Erreur :* ${error.response?.data?.message || error.message}`;
  }
}

async function restartRenderService() {
  const configError = checkConfig();
  if (configError) return configError;

  try {
    await axios.post(
        `https://api.render.com/v1/services/${SERVICE_ID}/deploys`,
        {},
        { headers }
      );
    return "✅ Le service a été redémarré avec succès !";
  } catch (error) {
    console.error(error);
    return `*Erreur :* ${error.response?.data?.message || error.message}`;
  }
}

ovlcmd(
  {
    nom_cmd: "setvar",
    classe: "Render_config",
    desc: "Définit ou met à jour une variable d'environnement sur Render.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms, prenium_id } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(ms_org, {
        text: "Cette commande est réservée aux utilisateurs premium",
        }, { quoted: ms });
    }
    const configError = checkConfig();
    if (configError) {
      return ovl.sendMessage(ms_org, {
        text: configError,
        }, { quoted: ms });
    }
    if (!arg[0] || !arg.includes("=")) {
      return ovl.sendMessage(ms_org, {
        text: "*Utilisation :* `setvar clé = valeur`",
        }, { quoted: ms });
    }
    const [key, ...valueParts] = arg.join(" ").split("=");
    const value = valueParts.join("=").trim();
    const result = await manageEnvVar("setvar", key.trim(), value);
    await ovl.sendMessage(ms_org, {
      text: result,
      }, { quoted: ms });
    const restartResult = await restartRenderService();
    await ovl.sendMessage(ms_org, {
      text: restartResult,
       }, { quoted: ms });
    return;
  }
);

ovlcmd(
  {
    nom_cmd: "getvar",
    classe: "Render_config",
    desc: "Récupère la valeur d'une variable d'environnement sur Render.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms, prenium_id } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(ms_org, {
        text: "Cette commande est réservée aux utilisateurs premium",
       }, { quoted: ms });
    }
    const configError = checkConfig();
    if (configError) {
      return ovl.sendMessage(ms_org, {
        text: configError,
        }, { quoted: ms });
    }
    if (!arg[0]) {
      return ovl.sendMessage(ms_org, {
        text: "*Utilisation :* `getvar clé` ou `getvar all` pour obtenir toutes les variables",
      }, { quoted: ms });
    }
    const key = arg[0];
    const result = await manageEnvVar("getvar", key);
    return ovl.sendMessage(ms_org, {
      text: result
    }, { quoted: ms });
  }
);

ovlcmd(
  {
    nom_cmd: "delvar",
    classe: "Render_config",
    desc: "Supprime une variable d'environnement sur Render.",
  },
  async (ms_org, ovl, cmd_options) => {
    const { arg, ms, prenium_id } = cmd_options;
    if (!prenium_id) {
      return ovl.sendMessage(ms_org, {
        text: "Cette commande est réservée aux utilisateurs premium",
      }, { quoted: ms });
    }
    const configError = checkConfig();
    if (configError) {
      return ovl.sendMessage(ms_org, {
        text: configError
    }, { quoted: ms });
    }
      
    if (!arg[0]) {
      return ovl.sendMessage(ms_org, {
        text: "*Utilisation :* `delvar clé`"
      }, { quoted: ms });
    }
    const key = arg[0];
    const result = await manageEnvVar("delvar", key);
    await ovl.sendMessage(ms_org, {
      text: result
       }, { quoted: ms });
    const restartResult = await restartRenderService();
    await ovl.sendMessage(ms_org, {
      text: restartResult
    }, { quoted: ms });
    return;
  }
);

function formatDateGMTFr(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) + " GMT";
}

ovlcmd(
  {
    nom_cmd: "checkupdate",
    classe: "Système",
    react: "🔍",
    desc: "Vérifie les mises à jour disponibles du bot.",
  },
  async (ms_org, ovl, { repondre }) => {
    try {
      await git.init();
      const remotes = await git.getRemotes();
      if (!remotes.some(r => r.name === "origin")) {
        await git.addRemote("origin", "https://github.com/Ainz-devs/Ovl-dbf");
      }

      await git.fetch();
      const remoteBranch = "origin/main";
      const branches = await git.branch(["-r"]);
      if (!branches.all.includes(remoteBranch)) return repondre("❌ Branche distante introuvable.");

      const logs = await git.log({ from: "main", to: remoteBranch });
      if (logs.total > 0) {
        const changelog = logs.all.map(log =>
          `• ${log.message} - ${formatDateGMTFr(log.date)})`
        ).join("\n");

        return repondre(`🚨 *Mise à jour disponible !*\n\n${changelog}\n\nUtilise *${config.PREFIXE]update* pour lancer la mise à jour.`);
      } else {
        return repondre("✅ Le bot est déjà à jour.");
      }
    } catch (e) {
      console.error(e);
      return repondre("❌ Erreur lors de la vérification des mises à jour.");
    }
  }
);

ovlcmd(
  {
    nom_cmd: "update",
    classe: "Système",
    react: "♻️",
    desc: "Met à jour le bot automatiquement.",
    alias: ["maj"],
  },
  async (ms_org, ovl, { repondre }) => {
    try {
      await git.init();
      const remotes = await git.getRemotes();
      if (!remotes.some(r => r.name === "origin")) {
        await git.addRemote("origin", "https://github.com/Ainz-devs/Ovl-dbf");
      }

      await git.fetch();
      const remoteBranch = "origin/main";
      const branches = await git.branch(["-r"]);
      if (!branches.all.includes(remoteBranch)) {
        return repondre("❌ Branche distante introuvable.");
      }

      const logs = await git.log({ from: "main", to: remoteBranch });
      if (!(logs.total > 0)) {
        return repondre("✅ Le bot est déjà à jour.");
      }

      await repondre("⏳ Téléchargement des dernières modifications...");
      await git.checkout("main");
      await git.pull("origin", "main");

      await repondre("✅ Mise à jour réussie ! Redémarrage...");
      exec("pm2 restart all", (err) => {
        if (err) {
          console.error("❌ Erreur PM2 :", err);
        } else {
          console.log("La Mise à jour est terminée.");
        }
      });
    } catch (err) {
      console.error("❌ Erreur de mise à jour :", err);
      await repondre("❌ Mise à jour échouée.");
    }
  }
);
