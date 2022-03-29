'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Lobbies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        notEmpty: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
        notEmpty: true
      },
      playerCapacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
        validate: {
          min: 2,
          max: 10
        }
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Lobbies');
  }
};