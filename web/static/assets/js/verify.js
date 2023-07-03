$(function() {
    $("form.authorize-streamers").on("submit", function() {
        console.log("prevent submit");
        return false;
    });

    $("form.verify-streamers").on("submit", function() {
        const streamer = $("#new-streamer").val();

        api.get("verify-streamer/" + encodeURIComponent(streamer)).then(data => {
            if (data.success) {
                if (data.data.isMod) {
                    $("form.authorize-streamers", `<label class="select-streamer">
                    <input type="checkbox" name="streamer" id="streamer-${data.data.streamer.id}"${(data.data.streamer.follower_count >= 5000 || data.data.streamer.affiliation === "partner") ? ' checked="checked"' : ""} />
                    <div class="twitch-user"><img src="<%= account.profile_image_url %>" /><div class="user-info"><div class="user-name"><%= account.display_name %></div><div class="user-stats"><%= account.id %> <span class="bullet">&bullet;</span> <%= comma(account.follower_count) %>&nbsp;follower<%= account.follower_count == 1 ? "" : "s"%></div></div></div>
                </label>`);
                } else {
                    alert("You are not a moderator in this channel");
                }
            } else {
                alert("Errors:\n" + data.errors.join("\n"));
            }
        }, e => {
            console.error(e);
            alert("Error: " + e);
        });
        return false;
    });
});
