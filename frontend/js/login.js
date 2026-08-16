const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const accountType = document.getElementById("userType");
const loginButton = document.getElementById("loginButton");
const customerRegister = document.getElementById("customerRegister");
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const registerLink = document.getElementById("registerLink");
const backToLogin = document.getElementById("backToLogin");

const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");
const registerButton = document.getElementById("registerButton");
const API = "http://localhost:3000/api";


// ============================================================
// ACCOUNT TYPE CHANGE
// ============================================================

accountType.addEventListener("change", () => {
    loginError.textContent = "";
    loginError.classList.remove("show");

    if (accountType.value === "customer") {
        customerRegister.style.display = "block";
    } else {
        customerRegister.style.display = "none";
    }
});

// ============================================================
// CUSTOMER REGISTRATION VIEW
// ============================================================

registerLink.addEventListener("click", (event) => {
    event.preventDefault();

    loginView.style.display = "none";
    registerView.style.display = "block";

    registerError.textContent = "";
    registerError.classList.remove("show");
});


backToLogin.addEventListener("click", (event) => {
    event.preventDefault();

    registerView.style.display = "none";
    loginView.style.display = "block";

    registerError.textContent = "";
    registerError.classList.remove("show");
});


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const type = accountType.value;

    // Clear previous error
    loginError.textContent = "";
    loginError.classList.remove("show");

    if (!email || !password) {
        showLoginError("Please enter your email and password.");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {

        let response;

        // ====================================================
        // CUSTOMER LOGIN
        // ====================================================

        if (type === "customer") {

            response = await fetch(`${API}/auth/login`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    Email: email,
                    Password: password
                })
            });

        }

        // ====================================================
        // STAFF LOGIN
        // ====================================================

        else {

            response = await fetch(`${API}/auth/staff/login`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    Email: email,
                    Password: password
                })
            });

        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Login failed."
            );
        }


        // ====================================================
        // CUSTOMER SUCCESS
        // ====================================================

        if (type === "customer") {

            // Clear staff authentication
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("userType");
            localStorage.removeItem("FirstName");
            localStorage.removeItem("LastName");

            sessionStorage.removeItem("mgr_token");
            sessionStorage.removeItem("mgr_role");
            sessionStorage.removeItem("mgr_name");

            // Store customer authentication
            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "customerToken",
                data.token
            );

            localStorage.setItem(
                "role",
                data.role || "customer"
            );

            localStorage.setItem(
                "userType",
                data.type || "customer"
            );

            localStorage.setItem(
                "customerId",
                data.CustomerID || ""
            );

            localStorage.setItem(
                "CustomerID",
                data.CustomerID || ""
            );

            localStorage.setItem(
                "FirstName",
                data.FirstName || ""
            );

            localStorage.setItem(
                "LastName",
                data.LastName || ""
            );

            localStorage.setItem(
                "customerName",
                `${data.FirstName || ""} ${data.LastName || ""}`.trim()
            );

            // Customer dashboard
            window.location.href = "customer.html";

            return;
        }


        
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        localStorage.removeItem("CustomerID");
        localStorage.removeItem("customerName");


        // ----------------------------------------------------
        // Store staff authentication in localStorage
        // ----------------------------------------------------

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "role",
            data.role || ""
        );

        localStorage.setItem(
            "userType",
            "staff"
        );

        localStorage.setItem(
            "FirstName",
            data.FirstName || ""
        );

        localStorage.setItem(
            "LastName",
            data.LastName || ""
        );


        // ----------------------------------------------------
        // Store staff authentication in sessionStorage
        // ----------------------------------------------------

        sessionStorage.setItem(
            "mgr_token",
            data.token
        );

        sessionStorage.setItem(
            "mgr_role",
            data.role || ""
        );

        sessionStorage.setItem(
            "mgr_name",
            data.FirstName || "Staff"
        );


        // ====================================================
        // ROLE-BASED REDIRECTION
        // ====================================================

        if (data.role === "Administrator") {

            window.location.href = "../index.html";

            return;
        }


        if (data.role === "Event Staff") {

            window.location.href = "event-staff.html";

            return;
        }


        if (data.role === "Finance/Billing Staff") {

            window.location.href = "finance.html";

            return;
        }


        // ----------------------------------------------------
        // Unknown role
        // ----------------------------------------------------

        showLoginError(
            `Unknown staff role: ${data.role || "Not specified"}.`
        );

        clearAuthentication();

    } catch (error) {

        console.error("Login error:", error);

        showLoginError(
            error.message || "Unable to sign in."
        );

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});


// ============================================================
// CUSTOMER REGISTRATION
// ============================================================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    registerError.textContent = "";
    registerError.classList.remove("show");

    const firstName =
        document.getElementById("registerFirstName").value.trim();

    const lastName =
        document.getElementById("registerLastName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const contactNumber =
        document.getElementById("registerContact").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("registerConfirmPassword").value;


    // -----------------------------
    // Basic validation
    // -----------------------------

    if (
        !firstName ||
        !lastName ||
        !email ||
        !contactNumber ||
        !password ||
        !confirmPassword
    ) {
        showRegisterError("Please complete all fields.");
        return;
    }


    if (password !== confirmPassword) {
        showRegisterError("Passwords do not match.");
        return;
    }


    if (password.length < 6) {
        showRegisterError(
            "Password must contain at least 6 characters."
        );
        return;
    }


    registerButton.disabled = true;
    registerButton.textContent = "Creating Account...";


    try {

        const response = await fetch(`${API}/auth/register`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                FirstName: firstName,
                LastName: lastName,
                Email: email,
                ContactNumber: contactNumber,
                Password: password
            })

        });


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "Unable to create account."
            );
        }


        // -----------------------------
        // Store customer authentication
        // -----------------------------

        clearAuthentication();


        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "customerToken",
            data.token
        );

        localStorage.setItem(
            "role",
            data.role || "customer"
        );

        localStorage.setItem(
            "userType",
            "customer"
        );

        localStorage.setItem(
            "customerId",
            data.CustomerID || ""
        );

        localStorage.setItem(
            "CustomerID",
            data.CustomerID || ""
        );

        localStorage.setItem(
            "FirstName",
            data.FirstName || firstName
        );

        localStorage.setItem(
            "LastName",
            data.LastName || lastName
        );

        localStorage.setItem(
            "customerName",
            `${data.FirstName || firstName} ${
                data.LastName || lastName
            }`.trim()
        );


        
        window.location.href = "customer.html";


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        showRegisterError(
            error.message ||
            "Unable to create account."
        );


    } finally {

        registerButton.disabled = false;
        registerButton.textContent = "Create Account";

    }

});

function clearAuthentication() {

    // Local storage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userType");
    localStorage.removeItem("FirstName");
    localStorage.removeItem("LastName");

    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerId");
    localStorage.removeItem("CustomerID");
    localStorage.removeItem("customerName");

    // Session storage
    sessionStorage.removeItem("mgr_token");
    sessionStorage.removeItem("mgr_role");
    sessionStorage.removeItem("mgr_name");
}


// ============================================================
// ERROR DISPLAY
// ============================================================

function showLoginError(message) {

    loginError.textContent = message;
    loginError.classList.add("show");

}

function showRegisterError(message) {

    registerError.textContent = message;

    registerError.classList.add("show");

}