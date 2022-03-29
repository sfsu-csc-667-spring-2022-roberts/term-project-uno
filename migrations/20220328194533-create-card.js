'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      color: {
        type: Sequelize.ENUM('blue', 'red', 'green', 'yellow', 'wild')
      },
      value: {
        type: Sequelize.STRING
      },
      special: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cards');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Cards_color";');
  }
};