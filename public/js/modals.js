////////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

// Get the modal
var modal = document.querySelector("#myModal");

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
                document.querySelector("#message").innerHTML = message;
                modal.style.display = "block";
            } else {
                // submit the form
                document.getElementById("break-form").submit();
            }
        });
});

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

////////////////////// - FOR USER REGISTRATION - ///////////////////////

// get the "newUser" query parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
const newUser = urlParams.get("newUser");

// check if a new user was created
if (newUser) {
    // show the modal message
    var message = "<span class='modal-text'>A new user account has been created!</span>";
    document.querySelector("#message").innerHTML = message;
    modal.style.display = "block";
} else {
    console.log("no URL string")
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

