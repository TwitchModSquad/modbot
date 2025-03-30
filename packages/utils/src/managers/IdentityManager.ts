import CacheManager from "../classes/CacheManager";

import {Identity, RawIdentity} from "../models";

class IdentityManager extends CacheManager<RawIdentity> {
    constructor() {
        super({
            model: Identity,
            cachePrefix: "identity",
            cacheTTL: 3600,
        });
    }
}

export default new IdentityManager();
