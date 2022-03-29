'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LobbyMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      LobbyMessage.belongsTo(models.Lobby, {
        foreignKey: 'lobbyId',
        onDelete: 'CASCADE'
      });
      LobbyMessage.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'SET NULL'
      });
    }
  }
  LobbyMessage.init({
    message: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'LobbyMessage',
  });
  return LobbyMessage;
};