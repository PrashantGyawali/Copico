try {
    chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
        if (message.color != undefined || message.color != null || message.color != "" || message.color != " " || message.color != "undefined") {
            let keyName = new Date().getTime();
            chrome.storage.sync.set({ [`${keyName}`]: message.color }, function () {
                console.log(`Saved ${message.color} with key ${keyName}`);
                chrome.storage.sync.set({ "selectedColor": message.color });
            });
        }
    }
    );




    chrome.commands.onCommand.addListener(async function (command) {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (command === 'openShortcut') {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: pickColor,
            });
        }
    });


    




    chrome.runtime.onInstalled.addListener(() => {
        chrome.contextMenus.create({
            id: "colorpicker",
            title: "Pick Color",
            contexts: ['all']
        });
    });

    // Open a new search tab when the user clicks a context menu
    chrome.contextMenus.onClicked.addListener((item, tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: pickColor,
    });
    });

    async function pickColor() {

        if (!('EyeDropper' in window)) { console.log("EyeDropper not supported"); return; }

        try {
            document.addEventListener("click", getColor, { once: true });
            document.addEventListener("mousemove", getColor, { once: true });

            async function getColor() {
                const eyeDropper = new EyeDropper();
                const selectedColor = await eyeDropper.open();

                document.removeEventListener("mousemove", getColor, { once: true });
                document.removeEventListener("click", getColor, { once: true });
                selectedColor?.sRGBHex && chrome.runtime.sendMessage({ color: selectedColor.sRGBHex });
            }
            document.body.click();

        }
        catch (err) {
            console.log(err);
        }
    }

}
catch (err) {
    console.log(err);
}


