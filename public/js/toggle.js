console.log("T O G G L E . J S   L O A D E D");

///////////// - TOGGLE THEME - ////////////////

document.documentElement.dataset.theme = localStorage.getItem("last-theme-used") || "light";
const themeButtons = document.querySelectorAll(".toggle-mode");

for (let i = 0; i < themeButtons.length; i++) {
    themeButtons[i].addEventListener("click", handleClick);
}
 
///////////// - ON TOGGLE BUTTON CLICK - ///////////////

function handleClick() {
    const currentTheme = document.documentElement.dataset.theme;
    if (currentTheme === "dark") {
        injectLightMode();
        document.documentElement.dataset.theme = "light";
        setTimeout(() => {
            removeDarkMode();
        }, 1000);
    } else {
        injectDarkMode();
        document.documentElement.dataset.theme = "dark";
        setTimeout(() => {
            removeLightMode();
        }, 1000);
    }
    localStorage.setItem("last-theme-used", document.documentElement.dataset.theme);
}

// ///////////// - SETTING CSS PROPERTY DYNAMICALLY FOR GRADIENT BACKGROUND TRANSITION - ///////////////

function injectLightMode() {
    const myCSSLightProperties = document.createElement("style");
    myCSSLightProperties.id = "light-property";
    myCSSLightProperties.innerHTML = `
    @property --myBackgroundColor1 {
        syntax: '<color>';
        initial-value: #A0DFFF;
        inherits: false;
      }
      
      @property --myBackgroundColor2 {
        syntax: '<color>';
        initial-value: #40BEFF;
        inherits: false;
      } 
      `
    const appendLightCSS = setInterval(() => {
        const head = document.getElementsByTagName("head")[0];
        if (document.getElementsByTagName("html")[0]) {
            head.appendChild(myCSSLightProperties);
            clearInterval(appendLightCSS);
        }
    }, 0);
}

function injectDarkMode() {
    const myCSSDarkProperties = document.createElement("style");
    myCSSDarkProperties.id = "dark-property";
    myCSSDarkProperties.innerHTML = `
    @property --myBackgroundColor1 {
        syntax: '<color>';
        initial-value: #01041d;
        inherits: false;
      }
      
      @property --myBackgroundColor2 {
        syntax: '<color>';
        initial-value: #00214e;
        inherits: false;
      } 
      `
    const appendDarkCSS = setInterval(() => {
        const head = document.getElementsByTagName("head")[0];
        if (document.getElementsByTagName("html")[0]) {
            head.appendChild(myCSSDarkProperties);
            clearInterval(appendDarkCSS);
        }
    }, 0);
}

function removeLightMode() {
    const myCSSLightProperties = document.getElementById("light-property");
    if (myCSSLightProperties) {
        myCSSLightProperties.remove();
    }
}

function removeDarkMode() {
    const myCSSDarkProperties = document.getElementById("dark-property");
    if (myCSSDarkProperties) {
        myCSSDarkProperties.remove();
    }
}

