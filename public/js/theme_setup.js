console.log("T H E M E _ S E T U P . J S   L O A D E D");

//////////////////// - SET UP THEME ON 1ST RUN - /////////////////////

document.documentElement.dataset.theme = localStorage.getItem("last-theme-used") || "light";

///////////// - GET LAST THEME CHOSEN - //////////////////

if (localStorage.getItem("last-theme-used") === "dark") {
  injectDarkMode();
  document.documentElement.dataset.theme = "dark";
} else if (localStorage.getItem("last-theme-used") === "light") {
  injectLightMode();
  document.documentElement.dataset.theme = "light";
} else {
  injectLightMode();
  document.documentElement.dataset.theme = "light";
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

////////////// - INJECT ICON AFTER LOADING - ///////////////

var cssFiles = [
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

function loadCssFiles(cssFiles, callback) {
  var loaded = 0;
  for (var i = 0; i < cssFiles.length; i++) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssFiles[i];
    link.onload = function() {
      loaded++;
      if (loaded == cssFiles.length) {
        callback();
      }
    };
    document.head.appendChild(link);
  }
}

loadCssFiles(cssFiles, function() {
  var icons = document.getElementsByClassName('material-symbols-outlined');
  for (var i = 0; i < icons.length; i++) {
    icons[i].style.display = 'inline-block';
  }
});