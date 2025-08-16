const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.db",
  logging: false,
});

const Message = sequelize.define(
  "messages",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "messages",
    timestamps: false,
  }
);

(async () => {
  await Message.sync();
})();

async function getMessage(id) {
  const record = await Message.findByPk(id);
  return record ? JSON.parse(record.data) : null;
}

async function addMessage(id, messageDetails) {
  await Message.upsert({
    id,
    data: JSON.stringify(messageDetails),
  });

  const count = await Message.count();
  if (count > 10000) {
    await Message.destroy({
      where: {},
      limit: 1000,
    });
    console.log("⚠️ Nettoyage : 1000 anciens messages supprimés");
  }
}

module.exports = { getMessage, addMessage };
