"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class feed extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.feed.belongsTo(models.user);
    }
  }
  feed.init(
    {
      userId: DataTypes.INTEGER,
      post: DataTypes.TEXT,
      date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "feed",
    }
  );
  return feed;
};
