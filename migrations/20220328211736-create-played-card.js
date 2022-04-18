'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PlayedCards', {
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PlayedCards');
  }
};