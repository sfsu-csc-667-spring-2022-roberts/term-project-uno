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
      hostId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION'
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
      },
      busy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Lobbies');
  }
};