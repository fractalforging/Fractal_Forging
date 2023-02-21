window.addEventListener('load', function () {

  // Set initial mode and body
  const body = document.getElementsByTagName('body')[0];

  // initialize the page with the saved state of dark mode
  if (localStorage.theme) {
    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
      console.log("DARK MODE LOADED FROM START");
    } else {
      body.classList.remove('dark-mode');
      console.log("LIGHT MODE LOADED FROM START");
    }
  }

  // define the toggle function
  function toggleModeSun() {
    body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    console.log("LIGHT MODE LOADED FROM TOGGLE")
  }

  function toggleModeMoon() {
    body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    console.log("DARK MODE LOADED FROM TOGGLE")
  }

  // Get moon and sun buttons
  const toggleBtnSun = document.getElementById('toggle-mode-btn-sun');
  const toggleBtnMoon = document.getElementById('toggle-mode-btn-moon');

  // add event listener to button
  toggleBtnSun.addEventListener('click', toggleModeMoon);
  toggleBtnMoon.addEventListener('click', toggleModeSun);

  console.log("A C T I V E  -   D A R K   L O A D E D");

});