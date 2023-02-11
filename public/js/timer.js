function startTimer(myDuration, display, callback) {
    let timer = myDuration;
    let minutes;
    let seconds;
    let interval = setInterval(function () {
        minutes = ('00' + parseInt(timer / 60, 10)).slice(-2);
        seconds = ('00' + parseInt(timer % 60, 10)).slice(-2);
        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            callback();
            clearInterval(interval);
        }
    }, 1000);
}

const onTimerEnded = () =>
    alertTimeOver();

function myFingTimer() {
    let duration = '<%= breakTracker.duration %>' * 60;
    let presentTime = new Date().getTime() / 1000;
    let itemTimeStamp = new Date('<%= breakTracker.startTime %>').getTime() / 1000;
    let timeCalc = duration - (presentTime - itemTimeStamp);
    let display = document.querySelector('#numerical_timer');
    startTimer(timeCalc, display, onTimerEnded);
    console.log("A C T I V E  -  N U M E R I C A L   T I M E R");
}

window.addEventListener("load", function () {
    myFingTimer();
});