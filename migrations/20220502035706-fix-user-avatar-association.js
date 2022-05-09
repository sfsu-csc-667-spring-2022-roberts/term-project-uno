'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'avatar');
    await queryInterface.addColumn('Avatars', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Avatars', 'userId');
    await queryInterface.addColumn('Users', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Avatars',
        key: 'location'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};
