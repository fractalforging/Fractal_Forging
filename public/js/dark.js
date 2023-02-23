const rootElement = document.querySelector(":root");
rootElement.dataset.theme = localStorage.getItem("last-theme-used") || "light";
const themeButtons = document.querySelectorAll(".toggle-mode");

for (let i = 0; i < themeButtons.length; i++) {
    themeButtons[i].addEventListener("click", handleClick);
}

function handleClick() {
    const currentTheme = rootElement.dataset.theme;
    if (currentTheme === "dark") {
        rootElement.dataset.theme = "light";
    } else {
        rootElement.dataset.theme = "dark";
    }
    localStorage.setItem("last-theme-used", rootElement.dataset.theme);
}