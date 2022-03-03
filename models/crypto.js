"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class crypto extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.crypto.belongsTo(models.user);
    }
  }
  crypto.init(
    {
      userId: DataTypes.INTEGER,
      symbol: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "crypto",
    }
  );
  return crypto;
};
