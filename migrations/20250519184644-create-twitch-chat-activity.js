'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('twitch__chat_activity')) return;

    await queryInterface.createTable('twitch__chat_activity', {
      streamerId: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {
          model: 'twitch__users',
          key: 'id',
        },
      },
      chatterId: {
        type: Sequelize.STRING,
        primaryKey: true,
        references: {
          model: 'twitch__users',
          key: 'id',
        },
      },
      lastMessageDate: {
        type: Sequelize.DATE,
      },
      count: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0,
      }
    });

    await queryInterface.addIndex('twitch__chat_activity', {
      name: 'chatter_idx',
      fields: ['chatterId'],
    });

    await queryInterface.addIndex('twitch__chat_activity', {
      name: 'streamer_idx',
      fields: ['streamerId'],
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("twitch__chat_activity");
  }
};
