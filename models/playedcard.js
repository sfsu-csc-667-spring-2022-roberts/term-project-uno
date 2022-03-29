'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PlayedCard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      PlayedCard.belongsTo(models.Game, {
        foreignKey: 'gameId',
        onDelete: 'CASCADE'
      });
      PlayedCard.belongsTo(models.Card, {
        foreignKey: 'cardId',
        onDelete: 'CASCADE'
      });
    }
  }
  PlayedCard.init({
    order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'PlayedCard',
  });
  return PlayedCard;
};