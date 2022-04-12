'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LobbyInvitation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      LobbyInvitation.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
      LobbyInvitation.belongsTo(models.Lobby, {
        foreignKey: 'lobbyId',
        onDelete: 'CASCADE'
      });
    }
  }
  LobbyInvitation.init({
    userId: DataTypes.INTEGER,
    lobbyId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'LobbyInvitation',
  });
  return LobbyInvitation;
};