document.documentElement.dataset.theme = localStorage.getItem("last-theme-used") || "light";

//////////////////////////////////

const rootElement = document.querySelector(":root");

if (localStorage.getItem("last-theme-used") === "dark") {
  injectDarkMode();
  rootElement.dataset.theme = "dark";
} else if (localStorage.getItem("last-theme-used") === "light") {
  injectLightMode();
  rootElement.dataset.theme = "light";
} else {
  injectLightMode();
  rootElement.dataset.theme = "light";
}

///////////// - SETTING CSS PROPERTY DYNAMICALLY FOR GRADIENT BACKGROUND TRANSITION - ///////////////

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
  }, 50);
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
  }, 50);
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