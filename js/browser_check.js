var SUPPORTED_OPTIONS = {
    "Microsoft Edge": 100,
    "Edge": 100,
    "Firefox": 106,
    "Chrome": 100,
    "Opera": 86,
    "Safari": 12,
    "Mobile Safari": 14,
    "Mobile Chrome": 92,
    "Mobile Firefox": 114
};


function isSupported() {
    try {
        var uap = new UAParser();
        var result = uap.getResult();
        var browser = result.browser;

        if (SUPPORTED_OPTIONS[browser.name] === undefined) {
            return false;
        }

        var minVersion = SUPPORTED_OPTIONS[browser.name];
        var majorVersion = parseFloat(browser.major);

        if (majorVersion < minVersion) {
            return false;
        } else {
            return true;
        }
    } catch {
        return false;
    }
}


function checkBrowser() {
    if (isSupported()) {
        document.getElementById("browser-warning").style.display = "none";
    }
}


checkBrowser();
