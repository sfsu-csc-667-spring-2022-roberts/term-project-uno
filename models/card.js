'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // draw stack
      Card.hasMany(models.DrawCard, {
        foreignKey: 'cardId'
      });
      // played stack
      Card.hasMany(models.PlayedCard, {
        foreignKey: 'cardId'
      });
      // player card
      Card.belongsToMany(models.Player, {
        through: 'PlayerCards'
      });
    }
  }
  Card.init({
    color: DataTypes.ENUM('blue', 'red', 'green', 'yellow', 'wild'),
    value: DataTypes.STRING,
    special: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Card',
  });
  return Card;
};