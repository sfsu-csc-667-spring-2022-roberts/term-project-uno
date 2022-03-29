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
        type: Sequelize.ENUM('blue', 'red', 'green', 'yellow')
      },
      turnIndex: {
        type: Sequelize.INTEGER
      },
      playerOrderReversed: {
        type: Sequelize.BOOLEAN
      },
      active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Games');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Games_currentColor";');
  }
};