const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "") {
        loginError.textContent = "Email is required.";
        return;
    }

    if (!isValidEmail(email)) {
        loginError.textContent = "Please enter a valid email address.";
        return;
    }

    if (password.trim() === "") {
        loginError.textContent = "Password is required.";
        return;
    }

    loginError.textContent = "";
    window.location.href = "index.html";
});
