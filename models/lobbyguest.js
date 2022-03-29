'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LobbyGuest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      LobbyGuest.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
      LobbyGuest.belongsTo(models.Lobby, {
        foreignKey: 'lobbyId',
        onDelete: 'CASCADE'
      });
    }
  }
  LobbyGuest.init({
    userReady: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'LobbyGuest',
  });
  return LobbyGuest;
};