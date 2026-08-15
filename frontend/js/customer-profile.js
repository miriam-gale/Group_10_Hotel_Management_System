/* ---------CUSTOMER PROFILE---------- */

document.addEventListener("DOMContentLoaded", function () {

    /* -----AUTHENTICATION-------- */

    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    /* -------------ELEMENTS----------------- */

    const firstNameInput =
        document.getElementById("firstName");

    const lastNameInput =
        document.getElementById("lastName");

    const emailInput =
        document.getElementById("email");

    const phoneInput =
        document.getElementById("phone");

    const sidebarName =
        document.getElementById("sidebarName");

    const profileName =
        document.getElementById("profileName");

    const summaryName =
        document.getElementById("summaryName");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const profileAvatar =
        document.getElementById("profileAvatar");

    const largeAvatar =
        document.getElementById("largeAvatar");

    const profileForm =
        document.getElementById("profileForm");

    const cancelButton =
        document.getElementById("cancelButton");

    const profileMessage =
        document.getElementById("profileMessage");

    const logoutButton =
        document.getElementById("logoutButton");

    const passwordButton =
        document.getElementById("passwordButton");


    /* ---------LOAD CUSTOMER DATA------------------ */

    const customerData = {

        firstName:
            localStorage.getItem("FirstName") || "",

        lastName:
            localStorage.getItem("LastName") || "",

        email:
            localStorage.getItem("Email") || "",

        phone:
            localStorage.getItem("ContactNumber") || ""

    };


    /* -------------INITIALIZE FORM---------------- */

    function loadProfile() {

        firstNameInput.value =
            customerData.firstName;

        lastNameInput.value =
            customerData.lastName;

        emailInput.value =
            customerData.email;

        phoneInput.value =
            customerData.phone;

        updateUserDisplay();

    }


    /* ---------UPDATE USER DISPLAY------------ */

    function updateUserDisplay() {

        const first =
            firstNameInput.value.trim();

        const last =
            lastNameInput.value.trim();

        const fullName =
            `${first} ${last}`.trim();

        const initials =
            fullName
                .split(" ")
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0)
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();


        sidebarName.textContent =
            fullName || "Customer";

        profileName.textContent =
            fullName || "Customer";

        summaryName.textContent =
            fullName || "Customer";

        sidebarAvatar.textContent =
            initials || "CU";

        profileAvatar.textContent =
            initials || "CU";

        largeAvatar.textContent =
            initials || "CU";

    }


    /* -----------SHOW MESSAGE-------------- */

    function showMessage(message, type) {

        profileMessage.textContent =
            message;

        profileMessage.className =
            `profile-message ${type}`;

    }


    /* ----------SAVE PROFILE--------------- */

    profileForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const firstName =
                firstNameInput.value.trim();

            const lastName =
                lastNameInput.value.trim();

            const phone =
                phoneInput.value.trim();


            if (!firstName || !lastName) {

                showMessage(
                    "First name and last name are required.",
                    "error"
                );

                return;

            }


            localStorage.setItem(
                "FirstName",
                firstName
            );

            localStorage.setItem(
                "LastName",
                lastName
            );

            localStorage.setItem(
                "ContactNumber",
                phone
            );


            customerData.firstName =
                firstName;

            customerData.lastName =
                lastName;

            customerData.phone =
                phone;


            updateUserDisplay();


            showMessage(
                "Your profile has been updated successfully.",
                "success"
            );

        }
    );


    /* ---------CANCEL CHANGES---------- */

    cancelButton.addEventListener(
        "click",
        function () {

            firstNameInput.value =
                customerData.firstName;

            lastNameInput.value =
                customerData.lastName;

            phoneInput.value =
                customerData.phone;

            updateUserDisplay();

            profileMessage.className =
                "profile-message";

            profileMessage.textContent =
                "";

        }
    );


    /* ----------------PASSWORD------------- */

    passwordButton.addEventListener(
        "click",
        function () {

            const currentPassword =
                document.getElementById(
                    "currentPassword"
                ).value.trim();

            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value.trim();


            if (!currentPassword ||
                !newPassword) {

                alert(
                    "Please enter your current password and new password."
                );

                return;

            }


            if (newPassword.length < 6) {

                alert(
                    "New password must contain at least 6 characters."
                );

                return;

            }


            alert(
                "Password changing will be connected when the customer password endpoint is added."
            );

        }
    );


    /* ------------LOGOUT-------- */

    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("CustomerID");
            localStorage.removeItem("FirstName");
            localStorage.removeItem("LastName");
            localStorage.removeItem("Email");
            localStorage.removeItem("ContactNumber");
            localStorage.removeItem("role");

            window.location.href =
                "login.html";

        }
    );


    /* ----------INITIALIZE----------- */

    loadProfile();

});
