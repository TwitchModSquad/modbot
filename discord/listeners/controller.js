const { ButtonInteraction, AnySelectMenuInteraction, ModalSubmitInteraction } = require('discord.js');

const fs = require('fs');
const api = require("../../api");

const grabFiles = path => fs.readdirSync(path).filter(file => file.endsWith('.js'));

const buttonFiles = grabFiles("./discord/listeners/button/")
const modalSubmitFiles = grabFiles("./discord/listeners/modalSubmit/")
const selectMenuFiles = grabFiles("./discord/listeners/selectMenu/")

let buttonHandlers = {};
let modalSubmitHandlers = {};
let selectMenuHandlers = {};

// process listener files
for (const file of buttonFiles) {
    const listener = require(`./button/${file}`);
    if ("name" in listener && "verify" in listener && "listener" in listener) {
        buttonHandlers[listener.name] = listener;
    } else 
        api.Logger.severe("Listener " + file + " is missing an attribute!");
}

for (const file of modalSubmitFiles) {
    const listener = require(`./modalSubmit/${file}`);
    if ("name" in listener && "verify" in listener && "listener" in listener) {
        modalSubmitHandlers[listener.name] = listener;
    } else 
        api.Logger.severe("Listener " + file + " is missing an attribute!");
}

for (const file of selectMenuFiles) {
    const listener = require(`./selectMenu/${file}`);
    if ("name" in listener && "verify" in listener && "listener" in listener) {
        selectMenuHandlers[listener.name] = listener;
    } else 
        api.Logger.severe("Listener " + file + " is missing an attribute!");
}

const listener = {
    name: 'controller',
    eventName: 'interactionCreate',
    eventType: 'on',
    /**
     * Interaction listener
     * @param {ButtonInteraction|ModalSubmitInteraction|AnySelectMenuInteraction} interaction 
     */
    listener (interaction) {
        if (interaction.isButton()) {
            for (const name in buttonHandlers) {
                try {
                    if (buttonHandlers[name].verify(interaction)) {
                        buttonHandlers[name].listener(interaction);
                    }
                } catch(err) {
                    api.Logger.severe(err);
                }
            }
        } else if (interaction.isModalSubmit()) {
            for (const name in modalSubmitHandlers) {
                try {
                    console.log(name);
                    if (modalSubmitHandlers[name].verify(interaction)) {
                        console.log(name);
                        modalSubmitHandlers[name].listener(interaction);
                    }
                } catch(err) {
                    api.Logger.severe(err);
                }
            }
        } else if (interaction.isAnySelectMenu()) {
            for (const name in selectMenuHandlers) {
                try {
                    if (selectMenuHandlers[name].verify(interaction)) {
                        selectMenuHandlers[name].listener(interaction);
                    }
                } catch(err) {
                    api.Logger.severe(err);
                }
            }
        }
    }
};

module.exports = listener;
