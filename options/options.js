chrome.storage.local.get("colorPickerMethod", function (color) {
    if (color?.colorPickerMethod) {
        document.getElementById(color.colorPickerMethod).checked = true;
    }
    else {
        document.getElementById("hide").checked = true;
    }
});

document.getElementById("settings").addEventListener("submit", (e) => {
    e.preventDefault();
    let colorPickerMethod = document.querySelector('input[name="colorPickerMethod"]:checked').id;
    console.log(colorPickerMethod);
    chrome.storage.local.set({ "colorPickerMethod": colorPickerMethod });
});