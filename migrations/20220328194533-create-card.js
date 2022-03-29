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
        type: Sequelize.ENUM('blue', 'red', 'green', 'yellow', 'wild'),
        allowNull: false
      },
      value: {
        type: Sequelize.ENUM('0','1','2','3','4','5','6','7','8','9','skip','reverse','plus2','plus4choose','choose','swap'),
        allowNull: false
      },
      special: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cards');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Cards_color";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Cards_value";');
  }
};