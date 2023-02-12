window.startTimer = function (myDuration, display, callback) {
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
    console.log("A C T I V E  -  S T A R T   T I M E R");
}

console.log("A C T I V E  -  T I M E R . J S");


//////////////////////////////////////////////////////////////////////////////////

// function startTimer(startTime, duration, user) {
//     console.log("A C T I V E  -  S T A R T   T I M E R");
  
//     let currentTime = new Date();
//     let elapsedTime = Math.round((currentTime - new Date(startTime)) / 1000);
//     let timeLeft = duration * 60 - elapsedTime;
  
//     let timerId = `timer-${user}`;
//     let timer = document.querySelector(`.${timerId}`);
    
//     let intervalId = setInterval(function() {
//       timeLeft--;
//       timer.innerHTML = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`;
      
//       if (timeLeft <= 0) {
//         clearInterval(intervalId);
//       }
//     }, 1000);
//   }