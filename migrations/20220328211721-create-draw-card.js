'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DrawCards', {
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
    await queryInterface.dropTable('DrawCards');
  }
};