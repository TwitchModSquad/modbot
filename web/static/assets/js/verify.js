$(function() {
    $("form.authorize-streamers").on("submit", function() {
        console.log("prevent submit");
        return false;
    });

    $("form.verify-streamers").on("submit", function() {
        console.log("prevent submit");
        return false;
    });
});
