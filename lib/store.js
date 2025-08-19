const { Sequelize, DataTypes, Op } = require("sequelize");
const path = require("path");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "store_msg.db"),
  logging: false,
});

const MessageStore = sequelize.define(
  "MessageStore",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    messageDetails: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "message_store",
    timestamps: false,
  }
);

(async () => {
  await MessageStore.sync();
})();

async function addMessage(id, messageDetails) {
  try {
    const count = await MessageStore.count();
    if (count >= 1000) {
      const oldest = await MessageStore.findAll({
        order: [["id", "ASC"]],
        limit: count - 999,
        attributes: ["id"],
      });
      const idsToDelete = oldest.map(m => m.id);
      await MessageStore.destroy({ where: { id: idsToDelete } });
    }
    await MessageStore.upsert({ id, messageDetails });
  } catch (err) {
    console.error(err);
  }
}

async function getMessage(id) {
  try {
    const entry = await MessageStore.findByPk(id);
    return entry ? entry.messageDetails : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { addMessage, getMessage };
