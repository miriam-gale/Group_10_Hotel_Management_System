const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const accountType = document.getElementById("userType");
const loginButton = document.getElementById("loginButton");
const customerRegister = document.getElementById("customerRegister");

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


        // ====================================================
        // STAFF SUCCESS
        // ====================================================

        /*
         * Staff pages in this project use different
         * authentication storage conventions.
         *
         * Therefore we store the same JWT in BOTH:
         *
         * localStorage.token
         * sessionStorage.mgr_token
         *
         * This allows the existing Administrator,
         * Event Staff and Finance pages to authenticate.
         */


        // ----------------------------------------------------
        // Clear old customer authentication
        // ----------------------------------------------------

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
// CLEAR AUTHENTICATION
// ============================================================

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