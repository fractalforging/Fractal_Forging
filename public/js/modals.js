console.log("M O D A L S . J S   L O A D E D")

////////////////////// - GET THE MODALS - ///////////////////////

const myModal_Neg = document.querySelector("#myModal-Neg");
const myModalText_Neg = document.querySelector("#message-neg");
const myModal_Pos = document.querySelector("#myModal-Pos");
const myModalText_Pos = document.querySelector("#message-pos");

///////////////////// - CLOSE MODAL - //////////////////

const closeBtns = document.querySelectorAll('.close-neg, .close-pos');

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        myModal_Neg.style.display = "none";
        myModal_Pos.style.display = "none";
        fetch('/clear-message', { method: 'POST' });
    });
});

/////////////////// - SERVER > API > MODALS - //////////////////////

function makeApiCall(apiEndpoint) {
    return fetch(apiEndpoint)
        .then(response => {
            if (response.status === 200) {
                return response.json().then(data => {
                    myModal_Neg.style.display = 'none';
                    myModalText_Pos.innerHTML = data.message;
                    myModal_Pos.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' });
                });
            } else if (response.status === 401 || response.status === 500) {
                return response.json().then(data => {
                    myModal_Pos.style.display = 'none';
                    myModalText_Neg.innerHTML = data.message;
                    myModal_Neg.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' });
                });
            }
        }).catch(error => console.error(error));
}

try {
    Promise.all([makeApiCall('/api/login'), makeApiCall('/api/changepassword'), makeApiCall('/api/latest-break'), makeApiCall('/api/register')])
        .catch(error => console.error(error));
} catch (err) {
    console.error(err);
}
