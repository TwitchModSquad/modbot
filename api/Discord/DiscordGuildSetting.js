class DiscordGuildSetting {
    /**
     * Name of the setting
     * 
     * @type {string}
     */
    setting;

    /**
     * Value of the setting
     * 
     * @type {any}
     */
    value;

    /**
     * The type of the setting
     * 
     * @type {string}
     */
    type;

    /**
     * Constructor for a DiscordGuildSetting
     * @param {string} setting 
     * @param {any} value 
     * @param {string} type
     */
    constructor(setting, value, type) {
        this.setting = setting;
        this.value = value;
        this.type = type;
    }
}

module.exports = DiscordGuildSetting;