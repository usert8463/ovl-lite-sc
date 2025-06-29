const langs = require('./lang.json');
const config = require('../set');

function t(key, vars = {}) {
  const lang = config.OVL_LANGUE || 'fr';
  const text = langs?.[lang]?.[key] || langs?.['fr']?.[key] || '';
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

module.exports = { t };
