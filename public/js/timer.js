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
            let removeButton_user = breakListItem.querySelector('.remove-user');
            let removeButton_admin = breakListItem.querySelector('.remove-admin');
            let editButton = breakListItem.querySelector('.edit');
            if (removeButton_user) {
                removeButton_user.classList.add("show");
                editButton.classList.add("remove");
            }
            if (removeButton_admin) {
                removeButton_admin.classList.add("show");
                editButton.classList.add("remove");
            }
        }
    } catch (error) {
        //console.log(error);
    }
}

///////// - START BUTTON - //////////

async function onStartButtonClick(event) {
    console.log('Start button clicked');
    const breakId = event.target.dataset.id;

    try {
        const response = await fetch(`/breaks/start/${breakId}`, { method: 'POST' });

        if (response.ok) {
            // Hide the start button and show the timer
            event.target.style.display = 'none';
            const timerElement = document.querySelector(`.timer-${breakId}`);
            timerElement.style.display = 'inline';
 
            // Call the myFingTimer function to start the timer
            myFingTimer(breakId, true);
        } else {
            console.error("Error starting the break.");
        }
    } catch (error) {
        console.error("Error starting the break: ", error);
    }
}

document.querySelectorAll('.start-break').forEach(button => {
    button.addEventListener('click', onStartButtonClick);
});
