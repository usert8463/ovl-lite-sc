const axios = require("axios");
const cheerio = require("cheerio");
const cookie = require("cookie");
const baseURL = "http://ws75.aptoide.com/api/7";
const { Innertube } = require('youtubei.js');

const isYoutubeUrl = (text) => /^https:\/\/(www\.)?youtube\.com|youtu\.be/.test(text);

async function ytdl(term, type = 'audio') {
  const yt = await Innertube.create();
  let video;

  if (isYoutubeUrl(term)) {
    video = await yt.getInfo(term);
  } else {
    const search = await yt.search(term);
    video = await yt.getInfo(`https://www.youtube.com/watch?v=${search.videos[0].id}`);
  }

  const streamingData = video.basic_info.streaming_data;
  let format;
  if (type === 'audio') {
    format = streamingData.adaptive_formats.find(f => f.mime_type.includes('audio/mp4'));
  } else {
    format = streamingData.formats.find(f => f.mime_type.includes('video/mp4'));
  }

  if (!format) throw new Error('Aucun format disponible');

  if (isYoutubeUrl(term)) {
    return { url: format.url };
  }

  return {
    url: `https://www.youtube.com/watch?v=${video.basic_info.id}`,
    title: video.basic_info.title,
    views: video.basic_info.view_count,
    duration: video.basic_info.duration,
    thumbnail: video.basic_info.thumbnail?.[0]?.url || '',
    download: format.url
  };
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

      console.log(result.result.nowatermark);
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

const formatSize = (bytes) => {
  if (!bytes) return 'N/A';
  return `${(bytes / 1048576).toFixed(2)} MB`;
};

const getFileSize = async (url) => {
  const { headers } = await axios.head(url);
  return parseInt(headers['content-length'] || 0, 10);
};

const apkdl = {
  search: async (query) => {
    const res = await axios.get(`${baseURL}/apps/search`, {
      params: { query, limit: 1000 }
    });
    return res.data.datalist.list.map(v => ({
      name: v.name,
      id: v.package
    }));
  },

  download: async (id) => {
    const res = await axios.get(`${baseURL}/apps/search`, {
      params: { query: id, limit: 1 }
    });
    const app = res.data.datalist.list[0];
    const size = formatSize(await getFileSize(app.file.path));
    return {
      name: app.name,
      lastup: app.updated,
      package: app.package,
      size,
      icon: app.icon,
      dllink: app.file.path
    };
  }
};

module.exports = { fbdl, ttdl, igdl, twitterdl, ytdl, apkdl };
