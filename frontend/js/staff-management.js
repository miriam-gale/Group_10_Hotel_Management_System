const API = "http://localhost:3000/api";

const staffTableBody =
    document.getElementById("staffTableBody");

const createStaffModal =
    document.getElementById("createStaffModal");

const openCreateStaff =
    document.getElementById("openCreateStaff");

const closeCreateStaff =
    document.getElementById("closeCreateStaff");

const cancelCreateStaff =
    document.getElementById("cancelCreateStaff");

const createStaffForm =
    document.getElementById("createStaffForm");

const createStaffButton =
    document.getElementById("createStaffButton");

const staffFormMessage =
    document.getElementById("staffFormMessage");



// AUTHENTICATION


function getToken() {

    return (
        sessionStorage.getItem("mgr_token") ||
        localStorage.getItem("token")
    );

}



// LOAD STAFF


async function loadStaff() {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return;

    }


    try {

        const response = await fetch(
            `${API}/auth/staff`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Unable to load staff accounts."
            );

        }


        renderStaff(
    Array.isArray(data)
        ? data
        : (data.staff || [])
);
    } catch (error) {

        console.error(
            "Unable to load staff:",
            error
        );

        staffTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load staff accounts.
                </td>
            </tr>
        `;

    }

}



// DISPLAY STAFF


function renderStaff(staff) {

    if (!staff.length) {

        staffTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No staff accounts found.
                </td>
            </tr>
        `;

        return;

    }


    staffTableBody.innerHTML = staff.map(person => {

        const fullName =
            `${person.FirstName || ""} ${
                person.LastName || ""
            }`.trim();


        const status =
            person.IsActive
                ? "Active"
                : "Inactive";


        return `
            <tr>

                <td>
                    ${escapeHtml(fullName)}
                </td>

                <td>
                    ${escapeHtml(person.Email || "")}
                </td>

                <td>
                    ${escapeHtml(person.Role || "")}
                </td>

                <td>
    ${status}
</td>

<td>
    ${
        person.IsActive
            ? `
                <button
                    type="button"
                    class="date-button deactivate-staff"
                    data-id="${person.StaffID}"
                    data-name="${escapeHtml(fullName)}"
                >
                    Deactivate
                </button>
              `
            : "—"
    }
</td>

            </tr>
        `;

    }).join("");

}


// OPEN MODAL


openCreateStaff.addEventListener(
    "click",
    () => {

        staffFormMessage.textContent = "";
        staffFormMessage.classList.remove("show");

        createStaffForm.reset();

        createStaffModal.classList.add("show");

    }
);


// CLOSE MODAL


function closeModal() {

    createStaffModal.classList.remove("show");

    createStaffForm.reset();

    staffFormMessage.textContent = "";
    staffFormMessage.classList.remove("show");

}


closeCreateStaff.addEventListener(
    "click",
    closeModal
);


cancelCreateStaff.addEventListener(
    "click",
    closeModal
);



// CREATE STAFF ACCOUNT


createStaffForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const token = getToken();

        if (!token) {

            window.location.href = "login.html";

            return;

        }


        const FirstName =
            document.getElementById(
                "staffFirstName"
            ).value.trim();


        const LastName =
            document.getElementById(
                "staffLastName"
            ).value.trim();


        const Email =
            document.getElementById(
                "staffEmail"
            ).value.trim();


        const Password =
            document.getElementById(
                "staffPassword"
            ).value;


        const Role =
            document.getElementById(
                "staffRole"
            ).value;


        staffFormMessage.textContent = "";
        staffFormMessage.classList.remove("show");


        if (
            !FirstName ||
            !LastName ||
            !Email ||
            !Password ||
            !Role
        ) {

            showStaffMessage(
                "Please complete all fields."
            );

            return;

        }


        createStaffButton.disabled = true;

        createStaffButton.textContent =
            "Creating...";


        try {

            const response = await fetch(
                `${API}/auth/staff/create`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        FirstName,
                        LastName,
                        Email,
                        Password,
                        Role

                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to create staff account."
                );

            }


            alert(
                data.message ||
                "Staff account created successfully."
            );


            closeModal();

            await loadStaff();


        } catch (error) {

            console.error(
                "Create staff error:",
                error
            );

            showStaffMessage(
                error.message ||
                "Unable to create staff account."
            );


        } finally {

            createStaffButton.disabled =
                false;

            createStaffButton.textContent =
                "Create Account";

        }

    }
);



// MESSAGE


function showStaffMessage(message) {

    staffFormMessage.textContent =
        message;

    staffFormMessage.classList.add("show");

}


// BASIC HTML ESCAPING



// DEACTIVATE STAFF


async function deactivateStaff(staffId, staffName) {

    const confirmed = confirm(
        `Deactivate the staff account for ${staffName}?`
    );

    if (!confirmed) {
        return;
    }

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API}/auth/staff/${staffId}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to deactivate staff account."
            );
        }

        alert(
            data.message ||
            "Staff account deactivated successfully."
        );

        await loadStaff();

    } catch (error) {

        console.error(
            "Deactivate staff error:",
            error
        );

        alert(
            error.message ||
            "Unable to deactivate staff account."
        );
    }
}

document.addEventListener("click", (event) => {

    const button =
        event.target.closest(".deactivate-staff");

    if (!button) {
        return;
    }

    deactivateStaff(
        button.dataset.id,
        button.dataset.name
    );

});

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


//

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadStaff();

    }
);