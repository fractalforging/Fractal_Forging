console.log("M O D A L S . J S   L O A D E D")

////////////////////// - GET THE MODALS - ///////////////////////

const myModal = document.querySelector("#myModal");
const myModalText = document.querySelector("#message");
const span = document.querySelectorAll(".close")[0];

span.onclick = () => {
    myModal.style.display = "none";
};

/////////////////// - LOGIN ERROR - //////////////////////

try {
    fetch('/api/login')
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                myModalText.innerHTML = data.message;
                myModal.style.display = "block";
            }
        });
} catch (err) {
    console.log(err);
}


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
