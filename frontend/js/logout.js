/* ----GRAND HORIZON HOTEL
   LOGOUT-----*/

function logoutUser() {

    // Customer authentication
    localStorage.removeItem("token");
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerId");
    localStorage.removeItem("CustomerID");

    // User information
    localStorage.removeItem("FirstName");
    localStorage.removeItem("LastName");
    localStorage.removeItem("Email");
    localStorage.removeItem("ContactNumber");
    localStorage.removeItem("customerName");
    localStorage.removeItem("role");
    localStorage.removeItem("userType");

    // Staff authentication
    localStorage.removeItem("staffToken");
    localStorage.removeItem("accessToken");

    // Staff session
    sessionStorage.removeItem("mgr_token");
    sessionStorage.removeItem("mgr_role");
    sessionStorage.removeItem("mgr_name");

    
    const loginPath =
        window.location.pathname.includes("/pages/")
            ? "login.html"
            : "pages/login.html";

    window.location.href = loginPath;
}


/* ------LOGOUT BUTTON------*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const logoutButton =
            document.getElementById("logoutButton");

        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logoutUser();
            }
        );
    }
);