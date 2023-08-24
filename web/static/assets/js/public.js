const LANDING_DELAY = 7500;
const LANDING_FONT_SIZE = 1.5;//em

const startLandingMessages = function() {
    const messageCount = $("#landing-message > span").length;

    let i = 0;
    const refresh = function() {
        i++;
        if (i >= messageCount) i = 0;

        $("#landing-message > span:first-child").css("margin-top", `-${i * LANDING_FONT_SIZE}em`);
        $("#landing-message").css("width", $($("#landing-message > span")[i]).find("span").width());
    }

    setInterval(refresh, LANDING_DELAY);
    $("#landing-message").css("width", $($("#landing-message > span")[0]).find("span").width());
}


$(function() {
    startLandingMessages();
    $("a.hamburger").on("click", function() {
        $("nav").toggleClass("open");
        return false;
    });
});
