const { ovlcmd } = require("../lib/ovlcmd");
const axios = require("axios");

ovlcmd(
    {
        nom_cmd: "gpt",
        classe: "IA",
        react: "🤖",
        desc: "Utilise l'API gpt pour générer des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://api.shizo.top/ai/gpt?apikey=shizo&query=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.msg || "Erreur de réponse de l\'API.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur GPT :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "dalle",
        classe: "IA",
        react: "🎨",
        desc: "Génère des images avec DALLE-E."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer une description pour générer une image.");
        }

        try {
            const prompt = encodeURIComponent(arg.join(" "));
            const rep = await axios.get(`https://api.shizo.top/ai/imagine?apikey=shizo&prompt=${prompt}`, {
                responseType: 'arraybuffer'
            });

            const buffer = Buffer.from(rep.data);

            return ovl.sendMessage(ms_org, {
                image: buffer,
                caption: "```Powered By OVL-MD```"
            }, { quoted: ms });

        } catch (err) {
            console.error("Erreur DALLE :", err);
            return repondre("Erreur lors de la génération de l'image. Réessayez plus tard.");
        }
    }
);
