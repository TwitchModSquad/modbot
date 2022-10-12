function refresh() {
    let streamer = $("#streamer").val();
    let chatter = $("#chatter").val();

    let query = "";
    
    if (streamer !== "xxx" && streamer !== null) {
        query = "?streamer=" + encodeURIComponent(streamer);
    }

    if (chatter !== "xxx" && chatter !== null) {
        query += (query === "" ? "?" : "&") + "chatter=" + encodeURIComponent(chatter);
    }

    window.location = "/panel/chat-history" + query;
}

$(function() {
    $("#streamer").on("change", function() {
        refresh();
    });
    $("#chatter").on("change", function() {
        refresh();
    });
});