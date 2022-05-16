'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // main lobby
      Game.belongsTo(models.Lobby, {
        foreignKey: 'lobbyId',
        onDelete: 'NO ACTION'
      });
      // players
      Game.hasMany(models.Player, {
        foreignKey: 'gameId'
      });
      // messages
      Game.hasMany(models.GameMessage, {
        foreignKey: 'gameId'
      });
      // draw stack
      Game.hasMany(models.DrawCard, {
        foreignKey: 'gameId'
      });
      // played stack
      Game.hasMany(models.PlayedCard, {
        foreignKey: 'gameId'
      });
    }
  }
  Game.init({
    currentColor: DataTypes.ENUM('blue', 'red', 'green', 'yellow'),
    turnIndex: DataTypes.INTEGER,
    playerOrderReversed: DataTypes.BOOLEAN,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Game',
  });
  return Game;
};