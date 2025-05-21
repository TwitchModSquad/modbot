'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('discord__messages')) return;

    await queryInterface.createTable('discord__messages', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      twitchBanId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'twitch__bans',
          key: 'id',
        },
      },
      twitchLiveUserId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'twitch__users',
          key: 'id',
        },
      },
      twitchLiveActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('discord__messages', {
      name: 'idx_twitch_ban_id',
      fields: ['twitchBanId'],
    });
    await queryInterface.addIndex('discord__messages', {
      name: 'idx_twitch_live_user',
      fields: ['twitchLiveUserId', 'twitchLiveActive'],
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("discord__messages");
  }
};
