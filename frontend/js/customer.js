/* =========================================
   CUSTOMER DASHBOARD
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const customerName =
        localStorage.getItem("customerName") || "Miriam Gale";

    const firstName = customerName.split(" ")[0];

    const welcomeName =
        document.getElementById("welcomeCustomerName");

    const sidebarName =
        document.getElementById("sidebarCustomerName");

    const topName =
        document.getElementById("topCustomerName");

    if (welcomeName) {
        welcomeName.textContent = firstName;
    }

    if (sidebarName) {
        sidebarName.textContent = customerName;
    }

    if (topName) {
        topName.textContent = customerName;
    }

});