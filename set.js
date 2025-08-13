const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PREFIXE: process.env.PREFIXE || "",
  NOM_OWNER: process.env.NOM_OWNER || "Ainz",
  NUMERO_OWNER: process.env.NUMERO_OWNER || "22651463203",
  MODE: process.env.MODE || "public",
  SESSION_ID: process.env.SESSION_ID || "ovl",
  STICKER_PACK_NAME: process.env.STICKER_PACK_NAME || "ᴀɪɴᴢ🔅✨",
  STICKER_AUTHOR_NAME: process.env.STICKER_AUTHOR_NAME || "ᴏᴠʟ-ᴍᴅ-ᴠ𝟸",
  DATABASE: process.env.DATABASE,
  RENDER_API_KEY: process.env.RENDER_API_KEY,
};
