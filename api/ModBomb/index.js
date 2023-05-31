const con = require("../../database");
const Event = require("./Event");

class ModBomb {

    /**
     * All ModBomb events
     * @type {Event[]}
     */
    events = [];

    /**
     * The current ModBomb event
     * @type {Event?}
     */
    current = null;

    /**
     * Updates all ModBomb events
     * @returns {Promise<Event[]>}
     */
    updateEvents() {
        return new Promise(async (resolve, reject) => {
            try {
                let events = [];
                let current = null;
                const eventsQuery = await con.pquery("select id, start_time, end_time, small_bombs, big_bombs from modbomb;");
                for (let i = 0; i < eventsQuery.length; i++) {
                    const event = new Event(
                        eventsQuery[i].id,
                        new Date(eventsQuery[i].start_time),
                        new Date(eventsQuery[i].end_time),
                        eventsQuery[i].small_bombs,
                        eventsQuery[i].big_bombs
                    );
                    try {
                        await event.updateBombs();
                        events.push(event);
                    } catch(err) {
                        global.api.Logger.severe(err);
                    }
                }
                current = events.find(x => 
                    x.startTime.getTime() <= Date.now() &&
                    x.endTime.getTime() >= Date.now()
                );
                if (!current) current = null;

                this.events = events;
                this.current = current;

                resolve(events);
            } catch(err) {
                reject(err);
            }
        });
    }

    async init() {
        try {
            await this.updateEvents();
            global.api.Logger.info(`Loaded ${this.events.length} event(s)${this.current ? " and current event" : ""}`);
            setInterval(() => {
                this.updateEvents().catch(global.api.Logger.severe);
            }, 120000);
        } catch(err) {
            global.api.Logger.severe(err);
        }
    }

    
}

module.exports = ModBomb;
