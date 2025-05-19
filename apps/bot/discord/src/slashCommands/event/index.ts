import {TwineCommandWithSubcommands} from "../../interfaces";
import {PermissionsBitField, SlashCommandBuilder, InteractionContextType} from "discord.js";
import BindSubcommand from "./bind";
import ListSubcommand from "./list";
import UnbindSubcommand from "./unbind";

export default class EventCommand extends TwineCommandWithSubcommands {

    constructor() {
        super(new SlashCommandBuilder()
                .setName("event")
                .setDescription("All commands related to events")
                .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
                .setContexts(InteractionContextType.Guild),
            [
                new BindSubcommand(),
                new ListSubcommand(),
                new UnbindSubcommand(),
            ]);
    }

}