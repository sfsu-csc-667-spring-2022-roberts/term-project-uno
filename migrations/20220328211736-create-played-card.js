'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PlayedCards', {
      order: {
        type: Sequelize.INTEGER,
        validate: {
          min: 0,
          max: 111
        },
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PlayedCards');
  }
};