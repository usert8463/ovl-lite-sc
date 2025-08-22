const axios = require('axios');
const { ChatbotConf } = require('../../DataBase/chatbot');

async function chatbot(ms_org, verif_Groupe, texte, repondre, mention_JID, id_Bot, auteur_Msg_Repondu, auteur_Message) {
  try {
    if (verif_Groupe) {
      if (!mention_JID.includes(id_Bot) && auteur_Msg_Repondu !== id_Bot) return;
    } else {
      if (!texte) return;
    }
    if (!texte) return;

    const config = await ChatbotConf.findByPk('1');
    if (!config) return;

    let enabledIds = [];
    try {
      enabledIds = JSON.parse(config.enabled_ids || '[]');
    } catch {
      enabledIds = [];
    }

    const localActif = enabledIds.includes(ms_org);
    const globalActif = verif_Groupe ? config.chatbot_gc === 'oui' : config.chatbot_pm === 'oui';

    if (!(localActif || globalActif)) return;

    const promptSystem = `Tu es un assistant intelligent appelé OVL-CHAT-BOT.
Réponds de manière claire, précise et concise, mais avec un ton naturel et chaleureux.
Ne fais pas de longs paragraphes, mais développe un peu plus qu’un simple mot.
L'utilisateur qui te parle a pour identifiant WhatsApp : ${auteur_Message}.
Son identifiant est : ${auteur_Message}.
Ce message vient d'un ${verif_Groupe ? "groupe" : "message privé"} (${ms_org}).
Répond toujours dans la langue du message reçu, quelle que soit cette langue.
Voici le message de l'utilisateur :`;

    const fullText = `${promptSystem}\n"${texte}"`;

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAk9Mtmnk8SuuCf7T9z8Hkw5dPxiAMVc8U',
      {
        contents: [
          {
            parts: [{ text: fullText }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    if (data.candidates && data.candidates.length > 0) {
      let reponseTexte = data.candidates[0]?.content?.parts?.[0]?.text || "";

      reponseTexte = reponseTexte
        .replace(/Google/gi, 'AINZ')
        .replace(/un grand modèle linguistique/gi, 'OVL-CHAT-BOT');

      if (reponseTexte) {
        repondre(reponseTexte);
      }
    } else {
      repondre("Aucune réponse adaptée de l'API.");
    }
  } catch (err) {
    console.error("Erreur dans chatbot :", err);
  }
}

module.exports = chatbot;
