const Cachable = require("./Cachable");

/**
 * How often, per specified expiration time interval, the cache will expire records.
 */
const CHECKS_PER_INTERVAL = 10;

/**
 * Manages Cachable objects
 * 
 * See also: {@link Cachable}
 */
class Cache {

    /**
     * Time (in milliseconds) to expire a specific record
     */
    expirationTime;

    /**
     * Object store. Stores the objects in the cache
     * 
     * @type {Cachable[]}
     */
    objectStore;

    /**
     * Constructor for a Cache object
     * 
     * @param {number} expirationTime Default: 120,000 milliseconds (120 seconds)
     */
    constructor(expirationTime = 120000) {
        this.expirationTime = expirationTime;
        this.objectStore = {};

        setInterval(() => {
            let curTime = new Date().getTime();

            let res = {};
            for (let key in this.objectStore) {
                if (curTime <= this.objectStore[key].retrieved + this.expirationTime) {
                    res[key] = this.objectStore[key];
                }
            }
            this.objectStore = res;
        }, expirationTime / CHECKS_PER_INTERVAL);
    }

    async get(key, retrieve, overrideCache = false, attemptInt = true) {
        if (attemptInt && typeof(key) !== "number") {
            try {
                let pikey = parseInt(key);
                key = pikey;
            } catch(e) {}
        }
        if (!overrideCache && this.objectStore.hasOwnProperty(key)) {
            return this.objectStore[key];
        } else {
            let item = await new Promise(retrieve);
            this.put(key, item);
            return item;
        }
    }

    put(key, item) {
        this.objectStore[key] = item;
    }

    remove(key) {
        delete this.objectStore[key];

        try {
            delete this.objectStore[parseInt(key)];
        } catch (e) {}
    }

}

module.exports = Cache;