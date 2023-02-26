////////////////////// - GET MODAL - ///////////////////////

console.log("M O D A L S . J S   L O A D E D")

// Get the modal
const myModal = document.querySelector("#myModal");
const MYModalText = document.querySelector("#message");
const span = document.querySelectorAll(".close")[0];



////////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

try {
    document.querySelector("#break-form").addEventListener("submit", function (event) {
        // prevent the form from submitting
        event.preventDefault();
        console.log("SUBMIT BUTTON CLICKED");

        // get the latest break for the user
        fetch("/api/latest-break")
            .then(response => response.json())
            .then(latestBreak => {
                // check if the latest break has an end time
                if (latestBreak && !latestBreak.endTime) {
                    // show an error message
                    var message = "<span class='modal-text'>You can only set 1 break at a time</span>";
                    MYModalText.innerHTML = message;
                    myModal.style.display = "block";
                } else {
                    // submit the form
                    document.getElementById("break-form").submit();
                }
            });
    });

    span.onclick = () => {
        myModal.style.display = "none";
    }

} catch (err) {
    console.log();
}

////////////////////// - FOR USER REGISTRATION - ///////////////////////

// // get the "newUser" query parameter from the URL
// const urlParams = new URLSearchParams(window.location.search);
// const newUser = urlParams.get("newUser");

// // check if a new user was created
// if (newUser) {
//     // show the modal message
//     var message = "<span class='modal-text'>A new user account has been created!</span>";
//     document.querySelector("#message").innerHTML = message;
//     modal.style.display = "block";
// } else {
//     console.log("no URL string")
// }

// // When the user clicks on <span> (x), close the modal
// span.onclick = function () {
//     modal.style.display = "none";
// }

/////////////////// - TEST - //////////////////////

// select the button element by its id
const loginForm = document.querySelector(".credentials");
const loginButton = document.getElementById("login-submit-button");

// add an event listener to the button
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const message = "<span class='modal-text'>test</span>";
    MYModalText.innerHTML = message;
    myModal.style.display = "block";
    loginForm.submit();
    // When the user clicks on <span> (x), close the modal
    span.onclick = () => {
        myModal.style.display = "none";
        loginForm.submit();
    }
});

/////////

async function getInfo(e) {
    e.preventDefault();
    const res = await fetch(baseUrl + "info/bruno?key=hello",
        {
            method: 'GET'
        });
    console.log(res);
    const data = await res.json();
    input.value = data.info;
    document.querySelector("#message").innerHTML = data.info;
    modal.style.display = "block";
}

