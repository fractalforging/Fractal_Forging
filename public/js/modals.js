///////////////////////////// - MODAL ACCOUNT CREATED - ///////////////////////////

// Get the modal
var modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the page loads, check if there is a message and display the modal if there is
window.onload = function () {
  var message = `<%= typeof message !== "undefined" ? message : "" %>`;
  if (message !== "") {
    document.getElementById("message").innerHTML = message;
    modal.style.display = "block";
  }
}

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
}

