'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DrawCards', {
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DrawCards');
  }
};