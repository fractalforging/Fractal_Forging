console.log("M O D A L S . J S   L O A D E D")

////////////////////// - GET THE MODALS - ///////////////////////

const myModal = document.querySelector("#myModal");
const myModalText = document.querySelector("#message");
const span = document.querySelectorAll(".close")[0];

span.onclick = () => {
    myModal.style.display = "none";
};

/////////////////// - LOGIN ERROR - //////////////////////

fetch('/api/login')
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            myModalText.innerHTML = data.message;
            myModal.style.display = "block";
        }
    })
    .catch(error => console.error(error));

////////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

fetch('/api/latest-break')
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            myModalText.innerHTML = data.message;
            myModal.style.display = 'block';
        }
    })
    .catch(error => console.error(error));


// try {
//     document.querySelector("#break-form").addEventListener("submit", function (e) {
//         e.preventDefault();
//         console.log("SUBMIT BUTTON CLICKED");
//         fetch('/api/latest-break')
//             .then(response => response.json())
//             .then(latestBreak => {
//                 console.log("1st stage");
//                 if (latestBreak && !latestBreak.endTime) {
//                     fetch('/api/latest-break')
//                         .then(response => response.json())
//                         .then(data => {
//                             console.log("2nd stage");
//                             myModalText.innerHTML = data.message;
//                             myModal.style.display = 'block';
//                         });
//                 } else {
//                     document.getElementById("break-form").submit();
//                 }
//             })
//     })
// } catch (err) {
//     //console.log(err);
// }