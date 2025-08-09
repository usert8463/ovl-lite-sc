const axios = require("axios");
const cheerio = require("cheerio");
const cookie = require("cookie");
const crypto = require('crypto');

const ytdl = async (input, format = 'video', limit = 5) => {
  const isValidUrl = input.startsWith('http://') || input.startsWith('https://');

  const ytSearchInfos = async (query, max = 5) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`;

    const res = await fetch(url);
    const html = await res.text();

    const jsonData = JSON.parse(
      html.split('var ytInitialData = ')[1].split(';</script>')[0]
    );

    const videoItems =
      jsonData.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents
        .flatMap(section => section.itemSectionRenderer?.contents || [])
        .filter(item => item.videoRenderer)
        .slice(0, max);

    return videoItems.map(v => {
      const video = v.videoRenderer;
      return {
        title: video.title.runs[0].text,
        duration: video.lengthText?.simpleText || 'Live',
        views: video.viewCountText?.simpleText || 'N/A',
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        thumbnail: video.thumbnail?.thumbnails?.pop()?.url || null
      };
    });
  };

  const results = isValidUrl ? [] : await ytSearchInfos(input, limit);
  const url = isValidUrl ? input : results[0]?.url;

  if (!url) return null;

  const API = {
    base: "https://media.savetube.me/api",
    cdn: "/random-cdn",
    info: "/v2/info",
    download: "/download"
  };

  const headers = {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://yt.savetube.me',
    'referer': 'https://yt.savetube.me/',
    'user-agent': 'Postify/1.0.0'
  };

  const hexToBuffer = (hexString) => {
    const matches = hexString.match(/.{1,2}/g);
    return Buffer.from(matches.join(''), 'hex');
  };

  const decrypt = async (enc) => {
    const secretKey = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
    const data = Buffer.from(enc, 'base64');
    const iv = data.slice(0, 16);
    const content = data.slice(16);
    const key = hexToBuffer(secretKey);
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(content);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  };

  const request = async (endpoint, data = {}, method = 'post') => {
    const axiosOptions = {
      method,
      url: `${endpoint.startsWith('http') ? '' : API.base}${endpoint}`,
      headers,
    };
    if (method === 'post') axiosOptions.data = data;
    else axiosOptions.params = data;
    const { data: res } = await axios(axiosOptions);
    return res;
  };

  const { cdn } = await request(API.cdn, {}, 'get');
  const videoData = await request(`https://${cdn}${API.info}`, { url });
  const decrypted = await decrypt(videoData.data);

  const dl = await request(`https://${cdn}${API.download}`, {
    downloadType: format,
    key: decrypted.key,
    quality: format === 'audio' ? '128' : '720',
  });

  return {
    yts: results,
    ytdl: {
      title: decrypted.title,
      duration: decrypted.duration,
      views: decrypted.viewCount,
      url,
      thumbnail: decrypted.thumbnail,
      download: dl.data.downloadUrl
    }
  };
};

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
      const response = await fetch("https://ttdownloader.com", {
        redirect: 'follow'
      });

      const rawCookies = response.headers.raw()['set-cookie'] || [];
      const initialCookies = rawCookies
        .map(cookieStr => cookie.parse(cookieStr))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const html = await response.text();
      const $ = cheerio.load(html);
      const token = $('#token').attr('value');

      const sessionCookies = Object.entries({
        __cfduid: initialCookies.__cfduid || "",
        PHPSESSID: initialCookies.PHPSESSID || "",
      })
        .map(([key, value]) => cookie.serialize(key, value))
        .join("; ");

      const body = new URLSearchParams({
        url: url,
        format: "",
        token: token,
      });

      const downloadResponse = await fetch("https://ttdownloader.com/search/", {
        method: 'POST',
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "cookie": sessionCookies
        },
        body
      });

      const downloadHtml = await downloadResponse.text();
      const ch = cheerio.load(downloadHtml);
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

async function apkdl(query, limit = 1) {
  const { data } = await axios.get('https://ws75.aptoide.com/api/7/apps/search', {
    params: { query, limit }
  });
  const list = data?.datalist?.list || [];
  return list.map(app => ({
    name: app.name,
    icon: app.icon,
    size: formatSize(app.file?.filesize),
    dllink: app.file?.path,
  }));
}

function formatSize(bytes) {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + " MB";
}

module.exports = { fbdl, ttdl, igdl, twitterdl, ytdl, apkdl };
