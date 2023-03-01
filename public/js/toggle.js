console.log("T O G G L E . J S   L O A D E D");

///////////// - ON TOGGLE BUTTON CLICK - ///////////////

const themeButtons = document.querySelectorAll(".toggle-mode");

for (let i = 0; i < themeButtons.length; i++) {
  themeButtons[i].addEventListener("click", handleClick);
}

function handleClick() {
  const currentTheme = document.documentElement.dataset.theme;
  if (currentTheme === "dark") {
    injectLightMode();
    myRoot.dataset.theme = "light";
    setTimeout(() => {
      removeDarkMode();
    }, 1000);
  } else {
    injectDarkMode();
    myRoot.dataset.theme = "dark";
    setTimeout(() => {
      removeLightMode();
    }, 1000);
  }
  localStorage.setItem("last-theme-used", myRoot.dataset.theme);
}

////////////// - SHOW ICON AFTER LOADING GOOGLE ICONS - ///////////////

var cssFiles = [
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

function loadCssFiles(cssFiles, callback) {
  var loaded = 0;
  for (var i = 0; i < cssFiles.length; i++) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssFiles[i];
    link.onload = function () {
      loaded++;
      if (loaded == cssFiles.length) {
        callback();
      }
    };
    document.head.appendChild(link);
  }
}

loadCssFiles(cssFiles, function () {
  var icons = document.getElementsByClassName('material-symbols-outlined');
  for (var i = 0; i < icons.length; i++) {
    icons[i].style.display = 'inline-block';
  }
});