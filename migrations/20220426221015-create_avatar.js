'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('Avatars', {
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        isUrl: true
      }, 
      height: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      }
    });
    await queryInterface.removeColumn('Users', 'pictureUrl');
    await queryInterface.addColumn('Users', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
      references: {
        model: 'Avatars',
        key: 'location'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users', 'avatar');
    await queryInterface.addColumn('Users', 'pictureUrl', {
      type: Sequelize.STRING,
      allowNull: true,
      isUrl: true
    });
    await queryInterface.dropTable('Avatars');
  }
};
