const TwitchUser = require("./TwitchUser");

const Assumption = require("../Assumption");

class AssumedTwitchUser extends TwitchUser {

    /**
     * Contains assumptions that were used to obtain the TwitchUser.
     * 
     * @type {Assumption[]}
     */
    assumptions;

    /**
     * Constructor for a Discord user
     * @param {TwitchUser} user
     * @param {Assumption[]} assumptions
     */
     constructor(user, assumptions) {
        super(user.id, user.identity, user.login, user.display_name, user.email, user.profile_image_url, user.offline_image_url, user.description, user.view_count, user.follower_count, user.affiliation);
        this.assumptions = assumptions;
    }

    /**
     * Get assumptions where actual value is not the same as the query value
     * 
     * @type {Assumption[]}
     */
    getActiveAssumptions() {
        let newAssumptions = [];

        this.assumptions.forEach(assumption => {
            if (assumption.actualValue.toLowerCase() !== assumption.queryValue.toLowerCase()) {
                newAssumptions = [
                    ...newAssumptions,
                    assumption
                ];
            }
        });

        return newAssumptions;
    }

}

module.exports = AssumedTwitchUser;