console.log("M O D A L S . J S   L O A D E D")

////////////////////// - GET THE MODALS - ///////////////////////

const myModal_Neg = document.querySelector("#myModal-Neg");
const myModalText_Neg = document.querySelector("#message-neg");
const myModal_Pos = document.querySelector("#myModal-Pos");
const myModalText_Pos = document.querySelector("#message-pos");


///////////////////// - CLOSE MODAL & CLEAR SERVER VARIABLE - //////////////////

const closeBtns = document.querySelectorAll('.close-neg, .close-pos');

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        myModal_Neg.style.display = "none";
        myModal_Pos.style.display = "none";
        fetch('/clear-message', { method: 'POST' })
            .catch(function (error) {
                console.error(error);
            });
    });
});

/////////////////// - LOGIN ERROR - //////////////////////

try {
    fetch('/api/login')
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                myModal_Pos.style.display = 'none';
                myModalText_Neg.innerHTML = data.message;
                myModal_Neg.style.display = "block";
                fetch('/clear-message', { method: 'POST' })
                    .catch(function (error) {
                        console.error(error);
                    });
            }
        }).catch(error => console.error(error));
} catch (err) {
    console.error(err)
}

/////////////////// - FOR PASSWORD CHANGE - ///////////////////////

try {
    fetch('/api/changepassword')
        .then(response => {
            if (response.status === 200) {
                return response.json().then(data => {
                    myModal_Neg.style.display = 'none';
                    myModalText_Pos.innerHTML = data.message;
                    myModal_Pos.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' })
                        .catch(function (error) {
                            console.error(error);
                        });
                });
            } else if (response.status === 401 || response.status === 500) {
                return response.json().then(data => {
                    myModal_Pos.style.display = 'none';
                    myModalText_Neg.innerHTML = data.message;
                    myModal_Neg.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' })
                        .catch(function (error) {
                            console.error(error);
                        });
                });
            }
        }).catch(error => console.error(error));
} catch (err) {
    console.error(err)
}

/////////////////// - FOR MORE THAN 1 BREAK - ///////////////////////

try {
    fetch('/api/latest-break')
        .then(response => {
            if (response.status === 200) {
                return response.json().then(data => {
                    myModal_Neg.style.display = 'none';
                    myModalText_Pos.innerHTML = data.message;
                    myModal_Pos.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' })
                        .catch(function (error) {
                            console.error(error);
                        });
                });
            } else if (response.status === 401 || response.status === 500) {
                return response.json().then(data => {
                    myModal_Pos.style.display = 'hidden';
                    myModalText_Neg.innerHTML = data.message;
                    myModal_Neg.style.display = 'block';
                    fetch('/clear-message', { method: 'POST' })
                        .catch(function (error) {
                            console.error(error);
                        });
                });
            }
        }).catch(error => console.error(error));
} catch (err) {
    console.error(err)
}

