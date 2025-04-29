import {Listener} from "../../interfaces";

import {ReadyListener} from "./ReadyListener";

export const rawListeners: Listener<any>[] = [
    new ReadyListener(),
];