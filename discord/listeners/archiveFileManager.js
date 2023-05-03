const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const api = require("../../api/index");
const {cache, temporaryMessage} = require("../commands/archive");

const fs = require("fs");
const path = require('path');

const mime = require("mime-types");
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const DIRECTORY = "./files/";
const TEMP_DIRECTORY = DIRECTORY + "temp/";
const DELETED_DIRECTORY = DIRECTORY + "deleted/";

try {
    fs.mkdirSync(DIRECTORY);
} catch (e) {}
try {
    fs.mkdirSync(TEMP_DIRECTORY, true);
} catch (e) {}
try {
    fs.mkdirSync(DELETED_DIRECTORY, true);
} catch (e) {}

try {
fs.readdir(TEMP_DIRECTORY, (err, files) => {
    if (!err) {
        for (const file of files) {
            fs.unlink(path.join(TEMP_DIRECTORY, file), err => {
                if (err) global.api.Logger.warning(err);
            });
        }
    } else global.api.Logger.warning(err);
});
} catch (e) {}

const parseFileMessage = fileData => {
    const isFile = fileData.type === "file";

    const embed = new MessageEmbed()
        .setTitle(isFile ? "File was downloaded!" : "Link was added!");

    if (isFile) embed.setDescription("```\nLabel: " + (fileData.label ? fileData.label : (fileData.name ? fileData.name : fileData.remote_path)) + "\nFile name/Remote Path: " + fileData.remote_path + "\nContent Type: " + fileData.content_type + "```");
    if (!isFile) embed.setDescription("```\nLabel: " + (fileData.label ? fileData.label : (fileData.name ? fileData.name : fileData.remote_path)) + "\nURL: " + fileData.remote_path +  "```");

    const setLabelButton = new MessageButton()
        .setCustomId("set-label")
        .setStyle("PRIMARY")
        .setLabel("Set Label");

    const removeButton = new MessageButton()
        .setCustomId("remove-file")
        .setStyle("DANGER")
        .setLabel("Remove " + (isFile ? "File" : "Link"));

    const row = new MessageActionRow()
        .addComponents(setLabelButton, removeButton);
    
    return {content: " ", embeds: [embed], components: [row]};
}

const addFile = (identityId, fileData) => {
    if (!cache.hasOwnProperty(identityId) || !cache[identityId].hasOwnProperty("thread")) throw "Unknown Identity ID";

    cache[identityId].thread.send(parseFileMessage(fileData)).then(message => {
        if (!cache[identityId].hasOwnProperty("files")) cache[identityId].files = [];

        fileData.message = message;
        cache[identityId].files = [
            ...cache[identityId].files,
            fileData,
        ];
    });
}

const downloadFile = (identityId, contentType, result, remote_path = null) => {
    let name = api.stringGenerator(32) + (mime.extension(contentType) ? "." + mime.extension(contentType) : "");

    addFile(identityId, {
        type: "file",
        name: name,
        content_type: contentType,
        local_path: TEMP_DIRECTORY + name,
        remote_path: remote_path,
    });
    
    result.body.pipe(fs.createWriteStream(TEMP_DIRECTORY + name));
}

const DOWNLOADABLE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const listener = {
    name: 'archiveFileManager',
    eventName: 'messageCreate',
    eventType: 'on',
    DIRECTORY: DIRECTORY,
    TEMP_DIRECTORY: TEMP_DIRECTORY,
    DELETED_DIRECTORY: DELETED_DIRECTORY,
    DOWNLOADABLE_TYPES: DOWNLOADABLE_TYPES,
    parseFileMessage: parseFileMessage,
    listener (message) {
        if (message.channel.isThread()) {
            api.Discord.getUserById(message.author.id).then(async user => {
                if (user.identity?.id && cache.hasOwnProperty(user.identity.id)) {
                    let entry = cache[user.identity.id];

                    if (message.attachments.size > 0) {
                        message.attachments.each(async attachment => {
                            const result = await fetch(attachment.url);
    
                            let type = result.headers.get("Content-Type").toLowerCase();
    
                            downloadFile(user.identity.id, type, result, attachment.name);
                        });
                    } else {
                        try {
                            let url = new URL(message.content);
    
                            if (url.protocol !== "http:" && url.protocol !== "https:") throw "Invalid protocol";
    
                            const result = await fetch(url);
    
                            let type = result.headers.get("Content-Type").toLowerCase();
    
                            if (DOWNLOADABLE_TYPES.includes(type)) {
                                downloadFile(user.identity.id, type, result, message.content);
                            } else {
                                addFile(user.identity.id, {
                                    type: "link",
                                    name: message.content,
                                    content_type: type,
                                    remote_path: message.content,
                                });
                            }
                        } catch (err) {
                            global.api.Logger.warning(err);
                            temporaryMessage(message.channel, "send", "Message should either contain an attachment or a URL message content", 5000);
                        }
                    }
                    message.delete();
                }
            });
        }
    }
};

module.exports = listener;