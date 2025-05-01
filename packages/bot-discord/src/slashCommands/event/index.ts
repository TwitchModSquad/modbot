import {TwineCommandWithSubcommands} from "../../interfaces";
import {PermissionsBitField, SlashCommandBuilder, InteractionContextType} from "discord.js";
import BindSubcommand from "./bind";

export default class EventCommand extends TwineCommandWithSubcommands {

    constructor() {
        super(new SlashCommandBuilder()
                .setName("event")
                .setDescription("All commands related to events")
                .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
                .setContexts(InteractionContextType.Guild),
            [
                new BindSubcommand(),
            ]);
    }

}