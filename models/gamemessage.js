'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      GameMessage.belongsTo(models.Game, {
        foreignKey: 'gameId',
        onDelete: 'CASCADE'
      });
      GameMessage.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'SET NULL'
      });
    }
  }
  GameMessage.init({
    message: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'GameMessage',
  });
  return GameMessage;
};