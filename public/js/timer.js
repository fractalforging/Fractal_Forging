/////////////////// - TIMER - /////////////////////

startTimer = (myDuration, display, callback) => {
    let timer = myDuration - 60;
    let minutes;
    let seconds;
    let interval = setInterval(function () {
        minutes = ('00' + parseInt(timer / 60, 10)).slice(-2);
        seconds = ('00' + parseInt(timer % 60, 10)).slice(-2);
        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            display.textContent = "BREAK OVER";
            display.classList.add("time-over");
            if (callback) {
                callback();
                clearInterval(interval);
            }
        }
    }, 1000);
    console.log("A C T I V E  -  S T A R T   T I M E R");
}

console.log("A C T I V E  -  T I M E R . J S");