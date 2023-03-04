console.log("T I M E R . J S   L O A D E D");

/////////////////// - TIMER - /////////////////////

startTimer = (myDuration, display, id) => {
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
            onTimerEnded(id);
            clearInterval(interval);
        }
    }, 1000);
    console.log("A C T I V E  -   T I M E R    S T A R T E D");
}


function onTimerEnded(id) {
    let display = document.querySelector(`.timer-${id}`);
    if (!display) return;

    display.textContent = "OVER";
    display.classList.add("time-over");
    

    try {
        let breakListItem = display.closest('.break-list-item-user');
        if (breakListItem) {
            let removeButton = breakListItem.querySelector('.remove');
            let editButton = breakListItem.querySelector('.edit');
            if (removeButton) {
                removeButton.classList.add("show");
                editButton.classList.add("remove");
            }
        }
    } catch (error) { 
        //console.log(error);
     }
}

