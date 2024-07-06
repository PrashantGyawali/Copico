const selectButton = document.querySelector(".selectButton");
const settingsButton = document.querySelector(".settingsButton");


selectButton.addEventListener("click", async () => {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        let colorPickerMethod = await chrome.storage.local.get("colorPickerMethod");
        console.log("hidden", colorPickerMethod);

        if (colorPickerMethod.colorPickerMethod == "hide") {
            document.querySelector(".wrapper").style.display = "none";
            setTimeout(async () => {
                try {
                    const eyeDropper = new EyeDropper();
                    const selectedColor = await eyeDropper.open();
                    chrome.runtime.sendMessage({ color: selectedColor.sRGBHex }, () => {
                        document.body.style.display = "block";
                        window.location.reload();
                    });
                }
                catch (err) {
                    console.log(err);
                }
            }, 50);

        }
        else if (colorPickerMethod.colorPickerMethod == "show") {
            const eyeDropper = new EyeDropper();
            const selectedColor = await eyeDropper.open();
            chrome.runtime.sendMessage({ color: selectedColor.sRGBHex });
            window.location.reload();
        }
        else {
            setTimeout(() => {
                window.close();
            }, 10);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: pickColor,
            });
        }

    }
    catch (err) {
        console.log(err);
    }
});


settingsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});


// Note this function will be executed in the browser tab context and not
// in the popup context

async function pickColor() {

    if (!('EyeDropper' in window)) { console.log("EyeDropper not supported"); return; }

    try {
        document.addEventListener("mousemove", getColor, { once: true });

        async function getColor() {
            const eyeDropper = new EyeDropper();
            const selectedColor = await eyeDropper.open();

            document.removeEventListener("mousemove", getColor, { once: true });
            chrome.runtime.sendMessage({ color: selectedColor.sRGBHex });
        }
    }
    catch (err) {
        console.log(err);
    }
}




async function loadPastColors() {
    let fragment = document.createDocumentFragment();
    let colorList = document.getElementById("colorList");

    chrome.storage.sync.get(null, function (items) {

        for (let item of Object.keys(items).sort((a, b) => b - a)) {
            if (item == "selectedColor") continue;

            document.getElementById("colorHistory").style.display = "block";

            let d = document.createElement("div");
            d.classList.add("colorItem");
            d.dataset["id"] = item;
            d.innerHTML = ` <div class="colorSample" style="background-color:${items[item]};"></div>
                        <div class="colorValue">${items[item]}</div>
                        <button class="deleteButton">X</button>`;
            fragment.appendChild(d);
            d.addEventListener("click", (e) => { changeSelectedColor({ selectedColor: items[item] }) });
            d.querySelector(".deleteButton").addEventListener("click", (e) => {
                e.stopPropagation();
                chrome.storage.sync.remove(item, function () { d.remove(); })
            });

            if (fragment.children.length > 0) {
                colorList.appendChild(fragment);
            }
        }
    });

    chrome.storage.sync.get("selectedColor", (color) => {
        if (color?.selectedColor) { changeSelectedColor(color) }
        else { changeSelectedColor({ selectedColor: "#000000" }); }
    });
}







function changeSelectedColor(color, frequent = false) {
    let selectedColor = document.querySelector("#colorValue");
    let colorFormat = document.getElementById("colorFormat").dataset["colortype"];
    if (color.selectedColor) {
        selectedColor.dataset["hex"] = color.selectedColor;
        selectedColor.dataset["rgb"] = chroma(color.selectedColor).css("rgb");
        selectedColor.dataset["hsl"] = chroma(color.selectedColor).css("hsl");
        selectedColor.dataset["hwb"] = chroma(color.selectedColor).css("hwb");

        let colorFormats = {
            0: "hex",
            1: "rgb",
            2: "hsl",
            3: "hwb"
        }
        selectedColor.innerText = selectedColor.dataset[colorFormats[colorFormat]];
        document.getElementById("colorInput").value = color.selectedColor;
    }
    if (!frequent) {
        chrome.storage.sync.set({ "selectedColor": color.selectedColor });
    }

};



loadPastColors();



document.getElementById("colorFormat").addEventListener("click", changeColorFormat);

document.getElementById("colorInput").addEventListener("input", (e) => { e.preventDefault(); changeSelectedColor({ selectedColor: e.target.value }, true) });
document.getElementById("colorInput").addEventListener("change", (e) => { e.preventDefault(); changeSelectedColor({ selectedColor: e.target.value }) });






function changeColorFormat() {
    let colorFormats = {
        0: "hex",
        1: "rgb",
        2: "hsl",
        3: "hwb"
    }

    const colorFormatButton = document.getElementById("colorFormat");
    let currentFormat = colorFormatButton.dataset["colortype"];

    let formatsNumber = Object.keys(colorFormats).length;
    let nextFormat = (parseInt(currentFormat) + 1) % formatsNumber;
    let colorFormatText = colorFormats[nextFormat];

    colorFormatButton.dataset["colortype"] = nextFormat;
    colorFormatButton.innerText = colorFormatText;

    let selectedColor = document.querySelector("#colorValue");
    console.log(selectedColor);
    selectedColor.innerText = selectedColor.dataset[colorFormatText];

}


