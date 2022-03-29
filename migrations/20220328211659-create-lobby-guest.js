'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LobbyGuests', {
      userReady: {
        type: Sequelize.BOOLEAN
      },
      joinedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LobbyGuests');
  }
};