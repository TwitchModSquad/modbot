function isURL(value) {
    try {
        return Boolean(new URL(value));
    } catch (err) {
        return false;
    }
}

$(function() {
    $(".file").on("click", function() {
        let file = $(this);

        let remotePath = file.attr("data-remote-path");
        if (!isURL(remotePath)) { 
            remotePath = `${API_URI}file/${file.attr("data-name")}`;
        }
        
        $("div.file-information").html(`<div><strong>Label:</strong> <code>${file.attr("data-label")}</code></div><div><strong>Name:</strong> <code>${file.attr("data-name")}</code></div><div><strong>Remote URL:</strong> <a href="${remotePath}" target="__blank">${remotePath}</a></div>${(file.attr("data-is-local") === "true" ? `<div><strong>Preview:</strong><br/><img style="max-width: 100%;" src="${API_URI}file/${file.attr("data-name")}" alt="source" /></div>` : "")}`);
        $("section.file-information").fadeIn(200);
        return false;
    });
});