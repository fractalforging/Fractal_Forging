////////////////////// - GET MODAL - ///////////////////////

// Get the modal
var myModal = document.querySelector("#myModal");
var MYModalText = document.querySelector("#message");

////////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

// Get the <span> element that closes the modal
var span = document.querySelectorAll(".close")[0];

document.querySelector("#break-form").addEventListener("submit", function (event) {
    // prevent the form from submitting
    event.preventDefault();

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

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    myModal.style.display = "none";
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


/////////////////// - PASSWORD CHANGE MODAL MESSAGES - //////////////////////

var passwordForm = document.querySelector(".credentials");

passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // // Authenticate old password
    // fetch("/api/authenticate", {
    //     method: "POST",
    //     body: new FormData(passwordForm)
    // }).then(function (response) {
    //     if (response.status === 200) {
    //         // Password change succeeded, show a success message and redirect to the secret page
    //         response.json().then(function (data) {
    //             passwordModalText.innerHTML = data.message;
    //             passwordModal.style.display = "block";
    //             if (data.redirect) {
    //                 setTimeout(function () {
    //                     window.location.href = data.redirect;
    //                 }, 2000);
    //             }
    //         });
    //     } else {
    //         // Old password incorrect or other error occurred, show an error message in the modal
    //         response.json().then(function (data) {
    //             passwordModalText.innerHTML = data.message;
    //             passwordModal.style.display = "block";
    //         });
    //     }
    // });


    // get the latest break for the user
    fetch("/api/authenticate")
        .then(response => response.json())
        .then(async function () {
            const json = await response.json();
            if (json.error) {
                console.log(json.error);
            }
        });
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