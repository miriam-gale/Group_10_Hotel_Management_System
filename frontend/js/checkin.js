const API = "http://localhost:3000/api";

let reservations = [];


/* ------------ELEMENTS---------------- */

const tableBody =
    document.getElementById("checkinTableBody");

const searchInput =
    document.getElementById("checkinSearch");

const filters =
    document.querySelectorAll(".room-filter");

const reservationCount =
    document.getElementById("reservationCount");

const messageBox =
    document.getElementById("checkinMessage");


/* -------------AUTHENTICATION---------- */

function getToken() {

    const token = sessionStorage.getItem("mgr_token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    return token;
}


/* ----------------LOAD RESERVATIONS------------ */

async function loadReservations() {

    const token = getToken();

    if (!token) return;

    try {

        showMessage("Loading reservations...", "loading");


        const response = await fetch(
            `${API}/reservations`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load reservations."
            );

        }


        console.log(
            "Manager reservations from API:",
            data
        );


        reservations = data;


        filterReservations();

        clearMessage();


    } catch (error) {

        console.error(
            "Check-in API error:",
            error
        );


        reservations = [];

        renderReservations([]);


        showMessage(
            error.message ||
            "Unable to load reservations.",
            "error"
        );

    }

}


/* ------------FORMAT DATE-------------- */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }


    const date = new Date(dateString);


    if (Number.isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* --------------STATUS CLASS-------------- */

function getStatusClass(status) {

    if (!status) {
        return "";
    }


    return status
        .toLowerCase()
        .replace(/\s+/g, "-");

}


/* ----------PAYMENT CLASS--------------- */

function getPaymentClass(paymentStatus) {

    if (paymentStatus === "Paid") {
        return "paid";
    }


    if (paymentStatus === "Partially Paid") {
        return "partial";
    }


    return "unpaid";

}


/* ---------------RENDER RESERVATIONS----------------- */

function renderReservations(list) {

    tableBody.innerHTML = "";


    reservationCount.textContent =
        `${list.length} ${
            list.length === 1
                ? "reservation"
                : "reservations"
        }`;


    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="9"
                    class="empty-room-message"
                >
                    No reservations found.
                </td>
            </tr>
        `;

        return;
    }


    list.forEach(reservation => {

        const row =
            document.createElement("tr");


        const statusClass =
            getStatusClass(
                reservation.Status
            );


        const paymentClass =
            getPaymentClass(
                reservation.PaymentStatus
            );


        let actionButton = "";


        /*
         * CONFIRMED
         * → Check In
         */

        if (
            reservation.Status === "Confirmed"
        ) {

            actionButton = `
                <button
                    class="room-action"
                    onclick="checkInGuest(${reservation.ReservationID})"
                >
                    Check In
                </button>
            `;

        }


        /*
         * CHECKED-IN
         * → Check Out
         */

        else if (
            reservation.Status === "Checked-In"
        ) {

            if (
                reservation.PaymentStatus === "Paid"
            ) {

                actionButton = `
                    <button
                        class="room-action"
                        onclick="checkOutGuest(${reservation.ReservationID})"
                    >
                        Check Out
                    </button>
                `;

            } else {

                actionButton = `
                    <span
                        class="room-status unpaid"
                    >
                        Payment Required
                    </span>
                `;

            }

        }


        /*
         * CHECKED-OUT / CANCELLED
         */

        else {

            actionButton = `
                <span
                    class="room-status ${statusClass}"
                >
                    ${reservation.Status}
                </span>
            `;

        }


        row.innerHTML = `

            <td>
                <strong>
                    ${reservation.GuestName || "—"}
                </strong>
            </td>

            <td>
                ${reservation.BookingReference || "—"}
            </td>

            <td>
                Room ${reservation.RoomNumber}
                <br>
                <small>
                    ${reservation.CategoryName || ""}
                </small>
            </td>

            <td>
                ${formatDate(
                    reservation.CheckInDate
                )}
            </td>

            <td>
                ${formatDate(
                    reservation.CheckOutDate
                )}
            </td>

            <td>
                ${reservation.NumOccupants || "—"}
            </td>

            <td>
                <span
                    class="room-status ${statusClass}"
                >
                    ${reservation.Status}
                </span>
            </td>

            <td>
                <span
                    class="room-status ${paymentClass}"
                >
                    ${reservation.PaymentStatus || "Unpaid"}
                </span>
            </td>

            <td>
                <div class="room-actions">
                    ${actionButton}
                </div>
            </td>

        `;


        tableBody.appendChild(row);

    });

}


/*--------------------FILTER RESERVATIONS----------- */

function filterReservations() {

    const activeFilter =
        document
            .querySelector(
                ".room-filter.active"
            )
            .dataset.status;


    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    const filtered =
        reservations.filter(
            reservation => {


                const matchesStatus =
                    activeFilter === "all" ||
                    reservation.Status ===
                        activeFilter;


                const guest =
                    String(
                        reservation.GuestName || ""
                    ).toLowerCase();


                const reference =
                    String(
                        reservation.BookingReference || ""
                    ).toLowerCase();


                const room =
                    String(
                        reservation.RoomNumber || ""
                    ).toLowerCase();


                const matchesSearch =
                    guest.includes(searchTerm) ||
                    reference.includes(searchTerm) ||
                    room.includes(searchTerm);


                return (
                    matchesStatus &&
                    matchesSearch
                );

            }
        );


    renderReservations(filtered);

}


/* --------------FILTER BUTTONS-------------- */

filters.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filters.forEach(filter => {
                filter.classList.remove("active");
            });


            button.classList.add("active");


            filterReservations();

        }
    );

});


/* ---------SEARCH------------- */

searchInput.addEventListener(
    "input",
    filterReservations
);


/* ----------------CHECK IN--------------= */

async function checkInGuest(
    reservationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to check this guest in?"
        );


    if (!confirmed) {
        return;
    }


    const token = getToken();

    if (!token) return;


    try {

        const response =
            await fetch(
                `${API}/reservations/${reservationId}/checkin`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to check guest in."
            );

        }


        alert(
            data.message ||
            "Guest checked in successfully."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Check-in error:",
            error
        );


        alert(
            error.message ||
            "Unable to check guest in."
        );

    }

}


/* ---------CHECK OUT---------- */

async function checkOutGuest(
    reservationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to check this guest out?"
        );


    if (!confirmed) {
        return;
    }


    const token = getToken();

    if (!token) return;


    /*
     * Ask whether there is a late checkout fee.
     */

    const feeInput =
        prompt(
            "Enter late checkout fee (GHS).\n\nEnter 0 if there is no fee.",
            "0"
        );


    if (feeInput === null) {
        return;
    }


    const lateCheckoutFee =
        Number(feeInput);


    if (
        Number.isNaN(lateCheckoutFee) ||
        lateCheckoutFee < 0
    ) {

        alert(
            "Please enter a valid fee."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/reservations/${reservationId}/checkout`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        lateCheckoutFee
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to check guest out."
            );

        }


        alert(
            data.message ||
            "Guest checked out successfully."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Check-out error:",
            error
        );


        alert(
            error.message ||
            "Unable to check guest out."
        );

    }

}


/* -------MESSAGES------ */

function showMessage(
    message,
    type
) {

    messageBox.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

}


function clearMessage() {

    messageBox.innerHTML = "";

}


/* ------- INITIAL LOAD------------- */

document.addEventListener(
    "DOMContentLoaded",
    loadReservations
);
