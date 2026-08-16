/* =========================================
   CUSTOMER NAME / PROFILE DISPLAY
========================================= */

function getUserInitials() {
    const firstName = localStorage.getItem("FirstName") || "";
    const lastName = localStorage.getItem("LastName") || "";

    if (firstName || lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    const customerName = localStorage.getItem("customerName") || "";
    const parts = customerName.trim().split(/\s+/);

    if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }

    return customerName.substring(0, 2).toUpperCase() || "CU";
}

document.addEventListener("DOMContentLoaded", function () {

    const firstName =
        localStorage.getItem("FirstName") || "";

    const lastName =
        localStorage.getItem("LastName") || "";

    const storedName =
        localStorage.getItem("customerName") || "";

    const customerName =
        storedName ||
        `${firstName} ${lastName}`.trim() ||
        "Customer";

    const displayFirstName =
        firstName ||
        customerName.split(" ")[0];

    // Pages using sidebarCustomerName
    document
        .querySelectorAll("#sidebarCustomerName")
        .forEach(element => {
            element.textContent = customerName;
        });

    // Pages using topCustomerName
    document
        .querySelectorAll("#topCustomerName")
        .forEach(element => {
            element.textContent = customerName;
        });

    // Bookings / Billing pages
    document
        .querySelectorAll("#sidebarName")
        .forEach(element => {
            element.textContent = customerName;
        });

    document
        .querySelectorAll("#profileName")
        .forEach(element => {
            element.textContent = customerName;
        });

    // Customer dashboard welcome message
    document
        .querySelectorAll("#welcomeCustomerName")
        .forEach(element => {
            element.textContent = displayFirstName;
        });

        // Customer profile initials
    const initials = getUserInitials();

    document
        .querySelectorAll(".user-avatar, .profile-avatar")
        .forEach(element => {
            element.textContent = initials;
        });

});
