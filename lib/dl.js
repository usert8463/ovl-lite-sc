const axios = require("axios");
const cheerio = require("cheerio");
const cookie = require("cookie");

async function ytdl(videoUrl, type = 'mp3') {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(
        'https://s47.notube.lol/recover_weight.php',
        {
          url: videoUrl,
          format: type,
          lang: 'fr',
          subscribed: false
        },
        {
          headers: {
            'User-Agent': 'GoogleBot',
            'Content-Type': 'application/json'
          }
        }
      );

      const token = response.data.token;
      if (!token) throw new Error('❌ Token non trouvé dans la réponse.');

      const downloadPage = await axios.get(
        `https://notube.lol/fr/download?token=${token}`,
        {
          headers: {
            'User-Agent': 'GoogleBot'
          }
        }
      );

      const $ = cheerio.load(downloadPage.data);
      const downloadLink = $('#downloadButton').attr('href');
      if (!downloadLink) throw new Error('❌ Lien de téléchargement introuvable.');

      return downloadLink;

    } catch (e) {
      console.warn(`⚠️ Tentative ${attempt} échouée : ${e.message}`);
      if (attempt === maxAttempts) {
        console.error("❌ Toutes les tentatives ont échoué.");
        return null;
      }
    }
  }
}

async function fbdl(url) {
  try {
    const payload = {
      id: url,
      locale: 'en'
    };

    const response = await axios.post('https://getmyfb.com/process', new URLSearchParams(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GoogleBot'
      }
    });

    const $ = cheerio.load(response.data);
 
    const firstDownloadLink = $('.results-list-item a').first().attr('href');

    if (firstDownloadLink) {
      return firstDownloadLink;
    } else {
      return "Aucun lien de téléchargement trouvé.";
    }
  } catch (err) {
    return `Erreur : ${err.message}`;
  }
}

async function ttdl(url, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get("https://ttdownloader.com", {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9,id;q=0.8",
          "user-agent": "GoogleBot",
        },
        maxRedirects: 5,
      });

      const cookies = response.headers["set-cookie"];
      const initialCookies = cookies
        .map(cookieStr => cookie.parse(cookieStr))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const $ = cheerio.load(response.data);
      const token = $('#token').attr('value');

      const sessionCookies = Object.entries({
        __cfduid: initialCookies.__cfduid || "",
        PHPSESSID: initialCookies.PHPSESSID || "",
      })
        .map(([key, value]) => cookie.serialize(key, value))
        .join("; ");

      const downloadResponse = await axios.post(
        "https://ttdownloader.com/search/",
        new URLSearchParams({
          url: url,
          format: "",
          token: token,
        }),
        {
          headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,id;q=0.8",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "user-agent": "GoogleBot",
            "cookie": sessionCookies,
          },
        }
      );

      const ch = cheerio.load(downloadResponse.data);
      const result = {
        status: downloadResponse.status,
        result: {
          nowatermark: ch('.result .download-link[href*="dl.php"]')?.attr('href'),
          audio: ch('.result .download-link[href*="mp3.php"]')?.attr('href'),
        },
      };

      if (result.result.nowatermark || result.result.audio) {
        return result;
      } else {
        throw new Error("Liens de téléchargement non trouvés.");
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function igdl(url, maxRetries = 5) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;
      const response = await axios.get("https://downloadgram.org/", {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9,id;q=0.8",
          "user-agent": "GoogleBot",
        },
        maxRedirects: 5,
      });

      const cookies = response.headers["set-cookie"] || [];
      const initialCookies = cookies
        .map((cookieStr) => cookie.parse(cookieStr))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const $ = cheerio.load(response.data);
      const token = $("#token").attr("value");

      const sessionCookies = Object.entries({
        __cfduid: initialCookies.__cfduid || "",
        PHPSESSID: initialCookies.PHPSESSID || "",
      })
        .map(([key, value]) => cookie.serialize(key, value))
        .join("; ");

      const videoResponse = await axios.post(
        "https://api.downloadgram.org/media",
        new URLSearchParams({
          url: url,
          v: "3",
          lang: "en",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "GoogleBot",
            "cookie": sessionCookies,
          },
        }
      );

      const videoPage = cheerio.load(videoResponse.data);
      let videoLink = videoPage("video source").attr("src");

      if (videoLink) {
        videoLink = videoLink.replace(/^\\\"|\\\"$/g, "");
        return { status: videoResponse.status, result: { video: videoLink } };
      } else {
        throw new Error("Lien de vidéo introuvable.");
      }
    } catch (error) {
      if (attempts >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function twitterdl(url, maxRetries = 5) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;
       const response = await axios.get(`https://twitsave.com/info?url=${url}`, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9,id;q=0.8",
          "user-agent": "GoogleBot",
        },
      });

      const $ = cheerio.load(response.data);
      const videoLink = $("video").attr("src");

      if (videoLink) {
        return { status: response.status, result: { video: videoLink } };
      } else {
        throw new Error("Lien vidéo introuvable.");
      }
    } catch (error) {
      if (attempts >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};


module.exports = { fbdl, ttdl, igdl, twitterdl, ytdl };
