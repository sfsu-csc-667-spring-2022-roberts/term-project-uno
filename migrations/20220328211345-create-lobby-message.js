'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LobbyMessages', {
      message: {
        type: Sequelize.TEXT,
        notEmpty: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LobbyMessages');
  }
};