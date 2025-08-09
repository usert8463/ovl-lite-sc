const axios = require('axios');
const { ChatbotConf } = require('../../DataBase/chatbot');

async function chatbot(ms_org, verif_Groupe, texte, repondre, mention_JID, id_Bot) {
  try {
    if (mention_JID && mention_JID.includes(id_Bot)) {
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

    if (localActif || globalActif) {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAk9Mtmnk8SuuCf7T9z8Hkw5dPxiAMVc8U',
        {
          contents: [
            {
              parts: [{ text: texte }],
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
    }
  } catch (err) {
    console.error("Erreur dans chatbot :", err);
  }
}

module.exports = chatbot;
