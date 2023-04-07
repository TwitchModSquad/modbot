const con = require("../database");
const api = require("../api/index");

const GET_MODS_THRESHOLD = 3500;

let waiting = false;

module.exports = () => {
    if (waiting) return;
    waiting = true;
    con.query("select id, display_name from twitch__user where follower_count is null or date_add(last_updated, interval 7 day) < now() limit 100;", async (err, res) => {
        if (err) {
            global.api.Logger.warning(err);
            return;
        }

        let userIds = [];

        res.forEach(user => {
            userIds = [
                ...userIds,
                user.id,
            ]
        });

        if (userIds.length < 10) return;

        global.api.Logger.info("Sending request...");

        let startTime = new Date().getTime();

        let helixUsers;
        try {
            helixUsers = await api.Twitch.Direct.helix.users.getUsersByIds(userIds);
        } catch (err) {
            global.api.Logger.warning(err);
            return;
        }

        global.api.Logger.info(`Received ${helixUsers.length}/${userIds.length} users: ${new Date().getTime() - startTime} ms`);
        waiting = false;

        helixUsers.forEach(async helixUser => {
            let user = await api.Twitch.getUserById(helixUser.id);

            if (helixUser.displayName.toLowerCase() !== user.login) {
                con.query("update twitch__username set last_seen = now() where id = ? and display_name = ?;", [user.id, user.display_name]);
                con.query("insert into twitch__username (id, display_name) values (?, ?) on duplicate key update display_name = ?;", [user.id, helixUser.displayName, helixUser.displayName]);
            }

            con.query("update twitch__user set login = ?, display_name = ?, description = ?, profile_image_url = ?, offline_image_url = ?, view_count = ?, affiliation = ?, last_updated = now() where id = ?;", [
                helixUser.name,
                helixUser.displayName,
                helixUser.description,
                helixUser.profilePictureUrl,
                helixUser.offlinePlaceholderUrl,
                helixUser.views,
                helixUser.broadcasterType === "" ? null : helixUser.broadcasterType,
                helixUser.id,
            ], err => {
                if (err) global.api.Logger.warning(err);
                api.Twitch.getUserById(helixUser.id, true);
            });
        });

        con.query("update twitch__user set last_updated = now() where id in (" + (", ?").repeat(userIds.length).substring(2) + ");", userIds);
        
        userIds.forEach(async userId => {

            try {
                let followers = await api.Twitch.Direct.helix.users.getFollows({followedUser: userId});

                con.query("update twitch__user set follower_count = ? where id = ?;", [followers.total, userId]);

                /*if (followers.total >= GET_MODS_THRESHOLD) {
                    let user = await api.Twitch.getUserById(userId);
                    await user.refreshMods(false);
                }*/
            } catch (err) {
                api.Logger.warning("An error occurred while updating follower counts & moderators:");
                api.Logger.warning(err);
            }
        });
    });
};
