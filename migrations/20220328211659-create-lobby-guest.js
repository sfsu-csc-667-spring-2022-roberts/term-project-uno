'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LobbyGuests', {
      userReady: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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