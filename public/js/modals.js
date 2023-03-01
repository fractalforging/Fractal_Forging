console.log("M O D A L S . J S   L O A D E D")

////////////////////// - GET THE MODALS - ///////////////////////

const myModal = document.querySelector("#myModal");
const myModalText = document.querySelector("#message");
const span = document.querySelectorAll(".close")[0];

////////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

try {
    document.querySelector("#break-form").addEventListener("submit", function (e) {
        // prevent the form from submitting
        e.preventDefault();
        console.log("SUBMIT BUTTON CLICKED");

        // get the latest break for the user
        fetch("/api/latest-break")
            .then(response => response.json())
            .then(latestBreak => {
                // check if the latest break has an end time
                if (latestBreak && !latestBreak.endTime) {
                    // show an error message
                    var message = "<span class='modal-text'>Only 1 break allowed</span>";
                    myModalText.innerHTML = message;
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
    //console.log(err);
}

/////////////////// - TEST - //////////////////////

try {
    fetch('/api/login')
        .then(response => response.json())
        .then(data => {
            if (data.message) {
              myModalText.innerHTML = data.message;
              myModal.style.display = "block";
            } 
        });

    span.onclick = () => {
        myModal.style.display = "none";
    }
// });
} catch (err) {
console.log(err);
}
