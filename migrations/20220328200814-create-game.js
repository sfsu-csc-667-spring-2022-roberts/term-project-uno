'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      currentColor: {
        type: Sequelize.ENUM('blue', 'red', 'green', 'yellow'),
        allowNull: false
      },
      turnIndex: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 9
        }
      },
      playerOrderReversed: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Games');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Games_currentColor";');
  }
};