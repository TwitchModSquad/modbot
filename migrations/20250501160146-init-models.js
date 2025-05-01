'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes("discord__channels")) {
      await queryInterface.createTable("discord__channels", {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        guildId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        twitchBanSettings: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        twitchLiveStartSettings: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });
    }

    if (!tables.includes("identities")) {
      await queryInterface.createTable("identities", {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        role: {
          type: Sequelize.ENUM,
          values: ["non-member", "member", "moderator", "admin"],
          defaultValue: "non-member",
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });
    }
    
    if (!tables.includes("discord__users")) {
      await queryInterface.createTable("discord__users", {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        username: {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        discriminator: {
          type: Sequelize.STRING(4),
          allowNull: false,
        },
        globalName: {
          type: Sequelize.STRING(32),
          allowNull: true,
        },
        displayName: {
          type: Sequelize.STRING(32),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        identity: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: "identities",
            key: "id",
          },
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });

      const indexes = await queryInterface.showIndex("discord__users");
      if (!indexes.find(i => i.name === "idx_username_exact")) {
        await queryInterface.addIndex("discord__users", {
          name: "idx_username_exact",
          fields: ["username"],
        });
      }
      if (!indexes.find(i => i.name === "idx_username_prefix")) {
        await queryInterface.addIndex("discord__users", {
          name: "idx_username_prefix",
          fields: ["username"],
          using: "BTREE",
        });
      }
    }

    if (!tables.includes("twitch__users")) {
      await queryInterface.createTable("twitch__users", {
        id: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        login: {
          type: Sequelize.STRING(25),
          allowNull: false,
        },
        display_name: {
          type: Sequelize.STRING(25),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        profile_image_url: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        offline_image_url: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        follower_count: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        },
        type: {
          type: Sequelize.ENUM,
          values: ["", "admin", "global_mod", "staff"],
          defaultValue: "",
          allowNull: false,
        },
        broadcaster_type: {
          type: Sequelize.ENUM,
          values: ["", "affiliate", "partner"],
          defaultValue: "",
          allowNull: false,
        },
        identity: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: "identities",
            key: "id",
          },
        },
        listen_setting: {
          type: Sequelize.ENUM,
          values: ["none", "bans", "bans_cached", "all"],
          defaultValue: "none",
          allowNull: false,
        },
        rolesLastUpdatedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });

      const indexes = await queryInterface.showIndex("twitch__users");
      if (!indexes.find(i => i.name === "idx_login_exact")) {
        await queryInterface.addIndex("twitch__users", {
          name: "idx_login_exact",
          fields: ["login"],
        });
      }
      if (!indexes.find(i => i.name === "idx_login_prefix")) {
        await queryInterface.addIndex("twitch__users", {
          name: "idx_login_prefix",
          fields: ["login"],
          using: "BTREE",
        });
      }
      if (!indexes.find(i => i.name === "idx_listen_setting")) {
        await queryInterface.addIndex("twitch__users", {
          name: "idx_listen_setting",
          fields: ["listen_setting"],
        });
      }
    }

    if (!tables.includes("twitch__bans")) {
      await queryInterface.createTable("twitch__bans", {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        streamerId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
          allowNull: false,
        },
        chatterId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        moderatorId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
          allowNull: true,
        },
        reason: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        startTime: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        endTime: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      const indexes = await queryInterface.showIndex("twitch__bans");
      if (!indexes.find(i => i.name === "idx_streamer")) {
        await queryInterface.addIndex("twitch__bans", {
          name: "idx_streamer",
          fields: ["streamerId"],
        });
      }
      if (!indexes.find(i => i.name === "idx_chatter")) {
        await queryInterface.addIndex("twitch__bans", {
          name: "idx_chatter",
          fields: ["chatterId"],
        });
      }
    }

    if (!tables.includes("twitch_timeouts")) {
      await queryInterface.createTable("twitch__timeouts", {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          autoIncrement: true,
        },
        streamerId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        chatterId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        moderatorId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
          allowNull: true,
        },
        reason: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        duration: {
          type: Sequelize.INTEGER.UNSIGNED,
        },
        startTime: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        endTime: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      const indexes = await queryInterface.showIndex("twitch__timeouts");
      if (!indexes.find(i => i.name === "idx_streamer")) {
        await queryInterface.addIndex("twitch__timeouts", {
          name: "idx_streamer",
          fields: ["streamerId"],
        });
      }
      if (!indexes.find(i => i.name === "idx_chatter")) {
        await queryInterface.addIndex("twitch__timeouts", {
          name: "idx_chatter",
          fields: ["chatterId"],
        });
      }
    }

    if (!tables.includes("twitch__chats")) {
      await queryInterface.createTable("twitch__chats", {
        id: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        streamerId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        chatterId: {
          type: Sequelize.STRING,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        color: {
          type: Sequelize.STRING(7),
          allowNull: false,
        },
        badges: {
          type: Sequelize.STRING(256),
          defaultValue: "",
        },
        emotes: {
          type: Sequelize.TEXT,
          defaultValue: "",
        },
        message: {
          type: Sequelize.TEXT,
        },
        deleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        percent_caps: {
          type: Sequelize.DECIMAL(5, 4),
        },
        percent_emotes: {
          type: Sequelize.DECIMAL(5, 4),
        },
        automod_reason: {
          type: Sequelize.ENUM,
          values: ["automod", "blocked_term"],
          allowNull: true,
        },
        automod_result: {
          type: Sequelize.ENUM,
          values: ["approved", "denied", "expired"],
          allowNull: true,
        },
        automod_level: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      const indexes = await queryInterface.showIndex("twitch__chats");
      if (!indexes.find(i => i.name === "streamer_chatter_createdAt_idx")) {
        await queryInterface.addIndex("twitch__chats", {
          name: "streamer_chatter_createdAt_idx",
          fields: ["streamerId", "chatterId", "createdAt"],
        });
      }
      if (!indexes.find(i => i.name === "chatter_createdAt_idx")) {
        await queryInterface.addIndex("twitch__chats", {
          name: "chatter_createdAt_idx",
          fields: ["chatterId", "createdAt"],
        });
      }
      if (!indexes.find(i => i.name === "streamer_createdAt_idx")) {
        await queryInterface.addIndex("twitch__chats", {
          name: "streamer_createdAt_idx",
          fields: ["streamerId", "createdAt"],
        });
      }
      if (!indexes.find(i => i.name === "createdAt_idx")) {
        await queryInterface.addIndex("twitch__chats", {
          name: "createdAt_idx",
          fields: ["createdAt"],
        });
      }
    }

    if (!tables.includes("twitch__roles")) {
      await queryInterface.createTable("twitch__roles", {
        userId: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: "twitch__users",
            key: "id",
          }
        },
        streamerId: {
          type: Sequelize.STRING,
          primaryKey: true,
          references: {
            model: "twitch__users",
            key: "id",
          },
        },
        type: {
          type: Sequelize.ENUM,
          values: ["moderator", "editor"],
          allowNull: false,
        },
        confirmed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      })
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("twitch__roles");
    await queryInterface.dropTable("twitch__chats");
    await queryInterface.dropTable("twitch__timeouts");
    await queryInterface.dropTable("twitch__bans");
    await queryInterface.dropTable("discord__users");
    await queryInterface.dropTable("twitch__users");
    await queryInterface.dropTable("identities");
    await queryInterface.dropTable("discord__channels");
  }
};
