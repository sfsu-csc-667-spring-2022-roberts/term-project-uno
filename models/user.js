'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // as host
      User.hasMany(models.Lobby, {
        foreignKey: 'hostId'
      });
      // as guest
      User.hasMany(models.LobbyGuest, {
        foreignKey: 'userId'
      });
      // as player
      User.hasMany(models.Player, {
        foreignKey: 'userId'
      });
      // as lobbyMessage author
      User.hasMany(models.LobbyMessage, {
        foreignKey: 'userId'
      });
      // as gameMessage author
      User.hasMany(models.GameMessage, {
        foreignKey: 'userId'
      });
      User.hasMany(models.LobbyInvitation, {
        foreignKey: 'userId'
      });
      // profile picture
      User.hasOne(models.Avatar, {
        foreignKey: 'userId'
      });
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    pictureUrl: DataTypes.STRING,
    gamesWon: DataTypes.INTEGER,
    gamesPlayed: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};