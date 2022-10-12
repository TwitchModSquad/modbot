$(function() {
    $("a.hamburger").on("click", function() {
        $("html").toggleClass("sidebar-collapse");
        return false;
    });

    if ($("body").width() < 800) {
        $("html").addClass("sidebar-collapse");
    }

    $("img").on("error", function() {
        $(this).attr("src", "/assets/images/blank-profile.webp");
    });
});