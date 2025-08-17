const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "store_msg.json");

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]));
}

function readMessages() {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

function writeMessages(messages) {
  fs.writeFileSync(filePath, JSON.stringify(messages));
}

async function getMessage(id) {
  const messages = readMessages();
  const record = messages.find(m => m.id === id);
  return record ? JSON.parse(record.data) : null;
}

async function addMessage(id, messageDetails) {
  let messages = readMessages();
  const existingIndex = messages.findIndex(m => m.id === id);

  if (existingIndex !== -1) {
    messages[existingIndex].data = JSON.stringify(messageDetails);
  } else {
    messages.push({ id, data: JSON.stringify(messageDetails), createdAt: Date.now() });
  }

  writeMessages(messages);
}

function checkFileSize() {
  if (!fs.existsSync(filePath)) return;
  const stats = fs.statSync(filePath);
  const fileSizeInMB = stats.size / (1024 * 1024);
  if (fileSizeInMB > 5) {
    writeMessages([]);
  }
}

setInterval(checkFileSize, 5 * 60 * 1000);

module.exports = { getMessage, addMessage };
