function updateLocalTimes() {
    const submittedTimes = document.querySelectorAll('.submitted-time');
    const startedTimes = document.querySelectorAll('.started-time');
    submittedTimes.forEach(timeElement => {
        const time = new Date(timeElement.dataset.time);
        timeElement.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    });
    startedTimes.forEach(timeElement => {
        const time = new Date(timeElement.dataset.time);
        if (time.getTime() !== 0) {
            timeElement.textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            timeElement.textContent = 'Not started';
        }
    });
}
function makeInfoVisible() {
    const infos = document.querySelectorAll('info');
    infos.forEach((info) => {
        info.classList.add('visible');
    });
}
function makeInfoVisible() {
    const infotitles = document.querySelectorAll('infotitle');
    const infos = document.querySelectorAll('info');

    infotitles.forEach((infotitle) => {
        infotitle.classList.add('visible');
    });

    infos.forEach((info) => {
        info.classList.add('visible');
    });
}
updateLocalTimes();
makeInfoVisible();