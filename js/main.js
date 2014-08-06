; (function () {
    var q = function (path) {
        return document.querySelector(path);
    };

    window.addEventListener("load", function () {

        // menu toggle
        var togglers = document.querySelectorAll(".ob-primary-menu-toggler");
        for (var i = 0, max = togglers.length; i < max; i++) {
            togglers[i].addEventListener("click", function () {
                q("body").className = /menu\-open/.test(q("body").className) ?
                    "ob-menu-close" : "ob-menu-open";
            });
        }

        q(".ob-close").addEventListener("click", function () {
            q("body").className = "ob-menu-close";
        });
    });
}());