import {TwineCommand} from "../interfaces";

import EventCommand from "./event";
import PingCommand from "./PingCommand";

const slashCommands: TwineCommand[] = [
    new EventCommand(),
    new PingCommand(),
]

export default slashCommands;
