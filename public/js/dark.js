const toggleBtnSun = document.getElementById('toggle-mode-btn-sun');
const toggleBtnMoon = document.getElementById('toggle-mode-btn-moon');
const body = document.getElementsByTagName('body')[0];
const isDarkMode = JSON.parse(localStorage.getItem('isDarkMode'));
const iconSun = toggleBtnSun.querySelector("i");
const iconMoon = toggleBtnMoon.querySelector("i");

// initialize the page with the saved state of dark mode
if (localStorage.getItem('isDarkMode') === 'true') {
  body.classList.add('dark-mode');
  // icon.classList.add("fa-sharp", "fa-solid", "fa-moon");
  // icon.classList.remove("fa-regular", "fa-sun"); 
  console.log("DARK MODE LOADED");
} else {
  body.classList.remove('dark-mode');
  // icon.classList.remove("fa-sharp", "fa-solid", "fa-moon");
  // icon.classList.add("fa-regular", "fa-sun"); 
  console.log("DARK MODE LOADED");
}

// define the toggle function
function toggleModeSun() {
    body.classList.remove('dark-mode');
    localStorage.setItem('isDarkMode', false);
    // icon.classList.remove("fa-sharp", "fa-solid", "fa-moon");
    // icon.classList.add("fa-regular", "fa-sun"); 
    console.log("LIGHT MODE LOADED")
  }

function toggleModeMoon() {
    body.classList.add('dark-mode');
    localStorage.setItem('isDarkMode', true);
    // icon.classList.add("fa-sharp", "fa-solid", "fa-moon");
    // icon.classList.remove("fa-regular", "fa-sun");  
    console.log("DARK MODE LOADED")
  }

// add event listener to button
toggleBtnSun.addEventListener('click', toggleModeMoon);
toggleBtnMoon.addEventListener('click', toggleModeSun);

console.log("A C T I V E  -   D A R K   L O A D E D");


