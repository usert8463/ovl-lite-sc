const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const PLUGIN_DIR = "../cmd";

function extractRequires(code) {
  const regex = /require\(["'`]([^"'`]+)["'`]\)/g;
  const modules = new Set();
  let match;
  while ((match = regex.exec(code))) {
    if (!match[1].startsWith(".")) modules.add(match[1]);
  }
  return [...modules];
}

function isInstalled(mod) {
  try {
    require.resolve(mod);
    return true;
  } catch {
    return false;
  }
}

function installModules(mods) {
  const toInstall = mods.filter(m => !isInstalled(m));
  if (toInstall.length) execSync(`npm install ${toInstall.join(" ")}`, { stdio: "inherit" });
}

function savePlugin(name, content) {
  const file = path.join(PLUGIN_DIR, `${name}.js`);
  fs.writeFileSync(file, content);
}

function deletePlugin(name) {
  const file = path.join(PLUGIN_DIR, `${name}.js`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function listInstalled() {
  return fs.existsSync(PLUGIN_DIR)
    ? fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith(".js")).map(f => f.replace(".js", ""))
    : [];
}

async function fetchGistPlugins(gist_url) {
  const res = await axios.get(gist_url);
  return Object.entries(res.data.files).map(([filename, file]) => ({
    name: filename.replace(".js", ""),
    content: file.content,
  }));
}

module.exports = {
  extractRequires,
  isInstalled,
  installModules,
  savePlugin,
  deletePlugin,
  listInstalled,
  fetchGistPlugins
};
