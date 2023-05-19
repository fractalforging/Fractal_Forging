'use strict';

console.log("T H E M E _ S E T U P . J S   L O A D E D");

///////////// - SETTING CSS PROPERTY DYNAMICALLY FOR GRADIENT BACKGROUND TRANSITION - ///////////////

const injectLightMode = () => {
  document.documentElement.dataset.theme = "light";
  const styles = getComputedStyle(document.documentElement);
  const color1 = styles.getPropertyValue('--my-background-color-1').trim();
  const color2 = styles.getPropertyValue('--my-background-color-2').trim();
  const myCSSLightProperties = document.createElement("style");
  myCSSLightProperties.id = "light-property";
  myCSSLightProperties.innerHTML = `
    @property --myBackgroundColor1 {
      syntax: '<color>';
      initial-value: ${color1};
      inherits: false;
    }
    
    @property --myBackgroundColor2 {
      syntax: '<color>';
      initial-value: ${color2};
      inherits: false;
    } 
  `;

  const appendLightCSS = setInterval(() => {
    const head = document.getElementsByTagName("head")[0];
    if (document.getElementsByTagName("html")[0]) {
      head.appendChild(myCSSLightProperties);
      clearInterval(appendLightCSS);
    }
  }, 50);
};

const injectDarkMode = () => {
  document.documentElement.dataset.theme = "dark";
  const styles = getComputedStyle(document.documentElement);
  const color1 = styles.getPropertyValue('--my-background-color-1').trim();
  const color2 = styles.getPropertyValue('--my-background-color-2').trim();
  const myCSSDarkProperties = document.createElement("style");
  myCSSDarkProperties.id = "dark-property";
  myCSSDarkProperties.innerHTML = `
    @property --myBackgroundColor1 {
      syntax: '<color>';
      initial-value: ${color1};
      inherits: false;
    }
    
    @property --myBackgroundColor2 {
      syntax: '<color>';
      initial-value: ${color2};
      inherits: false;
    } 
  `;

  const appendDarkCSS = setInterval(() => {
    const head = document.getElementsByTagName("head")[0];
    if (document.getElementsByTagName("html")[0]) {
      head.appendChild(myCSSDarkProperties);
      clearInterval(appendDarkCSS);
    }
  }, 50);
};

///////////// - REMOVE THEME FUNCTIONS - ///////////////

const removeLightMode = () => {
  const myCSSLightProperties = document.getElementById("light-property");
  if (myCSSLightProperties) {
    myCSSLightProperties.remove();
  }
};

const removeDarkMode = () => {
  const myCSSDarkProperties = document.getElementById("dark-property");
  if (myCSSDarkProperties) {
    myCSSDarkProperties.remove();
  }
};

//////////////////// - SET UP THEME ON 1ST RUN - /////////////////////

document.documentElement.dataset.theme = localStorage.getItem("last-theme-used") || "light";

///////////// - GET LAST THEME CHOSEN - //////////////////

const myRoot = document.querySelector(":root");

if (localStorage.getItem("last-theme-used") === "dark") {
  injectDarkMode();
  myRoot.dataset.theme = "dark";
} else if (localStorage.getItem("last-theme-used") === "light") {
  injectLightMode();
  myRoot.dataset.theme = "light";
} else {
  injectLightMode();
  myRoot.dataset.theme = "light";
};
