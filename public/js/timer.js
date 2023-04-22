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
      let removeButton = breakListItem.querySelector('.remove-user');
      if (removeButton) {
        removeButton.style.display = "inline";
        // Add this line to update the onclick attribute of the remove button
        removeButton.setAttribute('onclick', `removeBreak('${id}', false)`);
      }
    }
  } catch (error) {
    console.log(error);
  }

  // send a request to the server to update hasEnded field
  fetch(`/breaks/${id}/end`, { method: 'POST' })
    .then(response => {
      // if (response.ok) {
      //   console.info(`Break ${id} has ended`);
      // } else {
      //   console.error(`Failed to update the hasEnded field for break ${id}`);
      // }
    })
    .catch(error => {
      console.error(`Error updating the hasEnded field for break ${id}: `, error);
    });
}

///////// - START BUTTON - //////////

async function onStartButtonClick(event) {
  socket.emit('reload');
  //console.log('Start button clicked');
  const breakId = event.target.dataset.id;
  try {
    const response = await fetch(`/breaks/start/${breakId}`, { method: 'POST' });
    if (response.ok) {
      event.target.style.display = 'none';
      const timerElement = document.querySelector(`.timer-${breakId}`);
      timerElement.style.display = 'inline';
      document.querySelector(`#remove_user_${breakId}`).style.display = 'none';
      myFingTimer(breakId, true);
      
      //setTimeout(() => { location.reload(); }, 250);
    } else {
      console.error("Error starting the break.");
    }
  } catch (error) { console.error("Error starting the break: ", error); }
}

async function removeBreak(breakId, beforeStart, isAdmin = false) {
  try {
    const url = isAdmin
      ? `/remove/${breakId}?isAdmin=true&beforeStart=${beforeStart}`
      : `/remove/${breakId}?beforeStart=${beforeStart}`;
    const response = await fetch(url, { method: 'GET' });

    const removeId = isAdmin ? `remove_admin_${breakId}` : `remove_user_${breakId}`;
    const liElement = document.querySelector(`#${removeId}`).closest("li");
    liElement.classList.add("fade-out");
    socket.emit('reload');
    setTimeout(() => { location.reload(); }, 250);

    if (response.ok) {
    } else {
      console.error("Error removing the break.");
    }
  } catch (error) { console.error("Error removing the break: ", error); }
}


document.querySelectorAll('.start-break').forEach(button => {
  button.addEventListener('click', onStartButtonClick);
});
