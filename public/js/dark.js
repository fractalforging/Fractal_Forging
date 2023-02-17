const toggleBtn = document.getElementById('toggle-mode-btn');
const body = document.getElementsByTagName('body')[0];
const isDarkMode = JSON.parse(localStorage.getItem('isDarkMode'));

// initialize the page with the saved state of dark mode
if (isDarkMode) {
  body.classList.add('dark-mode');
}

// define the toggle function
function toggleMode() {
  if (body.classList.contains('dark-mode')) {
    body.classList.remove('dark-mode');
    localStorage.setItem('isDarkMode', false);
  } else {
    body.classList.add('dark-mode');
    localStorage.setItem('isDarkMode', true);
  }
  console.log("button clicked")
}

// add event listener to button
toggleBtn.addEventListener('click', toggleMode);

console.log("A C T I V E  -   D A R K   L O A D E D");
