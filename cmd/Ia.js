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

ovlcmd(
    {
        nom_cmd: "blackbox",
        classe: "IA",
        react: "🖤",
        desc: "Utilise Blackbox pour répondre aux questions."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un texte ou une question.");
        }

        const prompt = arg.join(" ");
        const apiUrl = "https://nexra.aryahcr.cc/api/chat/complements";

        try {
            const result = await axios.post(apiUrl, {
                messages: [{ role: "user", content: prompt }],
                prompt: "Répondre à l'utilisateur.",
                websearch: false,
                stream: false,
                markdown: false,
                model: "blackbox"
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            const id = result.data.id;
            let data = true;

            while (data) {
                const response = await axios.get(`https://nexra.aryahcr.cc/api/chat/task/${encodeURIComponent(id)}`);
                switch (response.data.status) {
                    case "pending":
                        data = true;
                        break;
                    case "error":
                        data = false;
                        return repondre(" Une erreur est survenue lors du traitement de la requête.");
                    case "completed":
                        data = false;
                        return repondre(response.data.message || "Aucune réponse générée.");
                    case "not_found":
                        data = false;
                        return repondre("Tâche introuvable. Veuillez réessayer.");
                }
            }
        } catch (error) {
            console.error("Erreur Blackbox :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "lenna",
        classe: "IA",
        react: "🤖",
        desc: "Utilise l'API Lenna pour générer des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://fgsi.koyeb.app/api/ai/lenna?text=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.message || "Erreur de réponse de l\'API.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Lenna :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "copilot",
        classe: "IA",
        react: "🤖",
        desc: "Utilise l'API Copilot pour générer des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://fgsi.koyeb.app/api/ai/copilot?text=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.data?.answer || "Erreur de réponse de l\'API.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Copilot :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "gemini",
        classe: "IA",
        react: "🤖",
        desc: "Utilise l'API Gemini-Pro pour générer des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, ms, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://bk9.fun/ai/gemini?q=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.BK9 || "Erreur de réponse de l\'API Gemini-Pro.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Gemini-Pro :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "llama",
        classe: "IA",
        react: "🤖",
        desc: "Utilise l'API Llama pour générer des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://api.gurusensei.workers.dev/llama?prompt=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.response?.response || "Erreur de réponse de l\'API Llama.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Llama :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "bard",
        classe: "IA",
        react: "🤖",
        desc: "Faites appel à l'API Bard pour obtenir des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://api.diioffc.web.id/api/ai/bard?query=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.result?.message || "Erreur de réponse de l\'API Bard.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Bard :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "mixtral",
        classe: "IA",
        react: "🤖",
        desc: "Faites appel à l'API Mistral pour obtenir des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://api.kenshiro.cfd/api/ai/mixtral?text=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.data?.response || "Erreur de réponse de l\'API Mixtral.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Mixtral :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);

ovlcmd(
    {
        nom_cmd: "groq",
        classe: "IA",
        react: "🤖",
        desc: "Faites appel à l'API Groq pour obtenir des réponses."
    },
    async (ms_org, ovl, cmd_options) => {
        const { arg, repondre } = cmd_options;

        if (!arg.length) {
            return repondre("Veuillez entrer un prompt pour générer une réponse.");
        }

        const prompt = arg.join(" ");
        const apiUrl = `https://api.kenshiro.cfd/api/ai/groq?text=${encodeURIComponent(prompt)}`;

        try {
            const result = await axios.get(apiUrl);
            const responseText = result.data?.data?.response || "Erreur de réponse de l\'API Groq.";
            return repondre(responseText);
        } catch (error) {
            console.error("Erreur Groq :", error);
            return repondre("Une erreur est survenue lors de l\'appel à l\'API.");
        }
    }
);
