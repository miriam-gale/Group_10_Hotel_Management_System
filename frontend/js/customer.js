/* =========================================
   CUSTOMER NAME / PROFILE DISPLAY
========================================= */

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

});
