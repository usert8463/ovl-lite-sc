const ACRCloud = require('acrcloud');
const fs = require('fs');

const acr = new ACRCloud({
  host: 'identify-eu-west-1.acrcloud.com',
  accessKey: '9fd8f6925597d096c5cb9a90ba29a491',
  accessSecret: 'qJkPlGPl6bS6NbohMM7Q6HOWdMPH74ccg4AwyEBw'
});

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const time = [
    hours > 0 ? `${hours}h` : '',
    minutes > 0 ? `${minutes}min` : '',
    `${seconds}s`
  ].filter(Boolean).join(' ');
  return time;
}

async function shazam(aud) {
  try {
    const buffer = fs.readFileSync(aud);
    const result = await acr.identify(buffer);

    if (result.status.code === 0) {
      const metadata = result.metadata.music[0];
      return {
        titre: metadata.title,
        artiste: metadata.artists?.map(a => a.name).join(', '),
        album: metadata.album?.name,
        genres: metadata.genres?.map(g => g.name).join(', '),
        duree: formatDuration(metadata.duration_ms),
        date: metadata.release_date,
        label: metadata.label,
        score: metadata.score,
        spotify: metadata.external_metadata?.spotify?.track?.external_urls?.spotify,
        youtube: metadata.external_metadata?.youtube?.vid,
        deezer: metadata.external_metadata?.deezer?.track?.link,
        apple: metadata.external_metadata?.itunes?.track?.url
      };
    } else {
      return { erreur: '🎶 Aucune chanson reconnue.' };
    }
  } catch (e) {
    return { erreur: e.message };
  }
}

module.exports = shazam;
