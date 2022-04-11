'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lobby extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // host
      Lobby.belongsTo(models.User, {
        foreignKey: 'hostId',
        onDelete: 'CASCADE'
      });
      // guests
      Lobby.hasMany(models.LobbyGuest, {
        foreignKey: 'lobbyId'
      });
      // messages
      Lobby.hasMany(models.LobbyMessage, {
        foreignKey: 'lobbyId'
      });
    }
  }
  Lobby.init({
    hostId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    playerCapacity: DataTypes.INTEGER,
    busy: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Lobby',
  });
  return Lobby;
};