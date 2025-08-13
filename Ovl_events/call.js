const { WA_CONF2 } = require("../DataBase/wa_conf");

async function call(ovl, callEvent) {
  try {
    const call = callEvent[0];
    const caller = call?.from;
    const callId = call?.id;

    if (!caller) return;

    const config = await WA_CONF2.findOne({ where: { id: "1" } });
    if (!config || config.anticall !== "oui") return;

    await ovl.rejectCall(callId);

    await ovl.sendMessage(ovl.user.id, {
      text: `Appel de @${caller.split("@")[0]} bloqué.`,
      mentions: [caller]
    });

  } catch (error) {
    console.error("Erreur lors du traitement de l’appel :", error);
  }
}

module.exports = call;
