import {TwineCommand} from "../interfaces";

import PingCommand from "./PingCommand";

const slashCommands: TwineCommand[] = [
    new PingCommand(),
]

export default slashCommands;
