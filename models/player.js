'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Player.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
      Player.belongsTo(models.Game, {
        foreignKey: 'gameId',
        onDelete: 'CASCADE'
      });
      Player.belongsToMany(models.Card, {
        through: 'PlayerCards'
      });
    }
  }
  Player.init({
    turnIndex: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Player',
  });
  return Player;
};