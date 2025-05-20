'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('twitch__live')) return;

    await queryInterface.createTable('twitch__live', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      livestreamId: {
        type: Sequelize.CHAR(36),
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gameId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      thumbnailUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      viewers: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
        allowNull: false,
      },
      isMature: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      startedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      queryAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      }
    });

    await queryInterface.addIndex('twitch__live', {
      name: 'idx_streamer',
      fields: ['userId'],
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("twitch__live");
  }
};
