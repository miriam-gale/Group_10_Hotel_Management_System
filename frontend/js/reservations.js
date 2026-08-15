const API = "http://localhost:3000/api";

const reservationsTableBody =
    document.getElementById("reservationsTableBody");

const reservationSearch =
    document.getElementById("reservationSearch");

const reservationFilters =
    document.querySelectorAll(".room-filter");

const reservationCount =
    document.getElementById("reservationCount");

const reservationMessage =
    document.getElementById("reservationMessage");

let reservations = [];


/* =========================================
   AUTHENTICATION
========================================= */

function getToken() {

    const token = sessionStorage.getItem("mgr_token") || localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    return token;
}


/* =========================================
   LOAD RESERVATIONS
========================================= */


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
                data.error || "Unable to load reservations."
            );
        }

        console.log("Reservations from API:", data);

        reservations = data;

        renderReservations(reservations);

        clearMessage();

    } catch (error) {

        console.error("Reservation API error:", error);

        renderReservations([]);

        showMessage(
            error.message || "Unable to load reservations.",
            "error"
        );
    }
}

/* =========================================
   STATUS CLASS
========================================= */

function getStatusClass(status) {

    if (!status) return "";

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* =========================================
   PAYMENT CLASS
========================================= */

function getPaymentClass(paymentStatus) {

    if (!paymentStatus) {
        return "unpaid";
    }

    if (paymentStatus === "Paid") {
        return "paid";
    }

    if (paymentStatus === "Partially Paid") {
        return "partial";
    }

    return "unpaid";
}


/* =========================================
   FORMAT DATE
========================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =========================================
   FORMAT CURRENCY
========================================= */

function formatCurrency(amount) {

    if (amount === null || amount === undefined) {
        return "—";
    }

    return `GHS ${Number(amount).toFixed(2)}`;
}


/* =========================================
   RENDER RESERVATIONS
========================================= */

function renderReservations(roomList) {

    reservationsTableBody.innerHTML = "";

    reservationCount.textContent =
        `${roomList.length} ${
            roomList.length === 1
                ? "reservation"
                : "reservations"
        }`;


    if (roomList.length === 0) {

        reservationsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="empty-room-message"
                >
                    No reservations found.
                </td>
            </tr>
        `;

        return;
    }


    roomList.forEach(reservation => {

        const row = document.createElement("tr");

        const statusClass =
            getStatusClass(reservation.Status);

        const paymentClass =
            getPaymentClass(reservation.PaymentStatus);


        let actionButton = "";


        if (reservation.Status === "Confirmed") {

            actionButton = `
                <button
                    class="room-action cancel-button"
                    onclick="cancelReservation(${reservation.ReservationID})"
                >
                    Cancel
                </button>
            `;
        }


        row.innerHTML = `

            <td>
                <strong>
                    ${reservation.BookingReference || "—"}
                </strong>
            </td>

            <td>
                Room ${reservation.RoomNumber}
            </td>

            <td>
                ${reservation.CategoryName || "—"}
            </td>

            <td>
                ${formatDate(reservation.CheckInDate)}
            </td>

            <td>
                ${formatDate(reservation.CheckOutDate)}
            </td>

            <td>
                ${reservation.NumOccupants}
            </td>

            <td>
                ${formatCurrency(reservation.TotalAmount)}
            </td>

            <td>
                <span class="room-status ${statusClass}">
                    ${reservation.Status}
                </span>
            </td>

            <td>
                <span class="room-status ${paymentClass}">
                    ${reservation.PaymentStatus || "Unpaid"}
                </span>
            </td>

            <td>
                <div class="room-actions">
                    ${actionButton}
                </div>
            </td>
        `;


        reservationsTableBody.appendChild(row);

    });
}


/* =========================================
   FILTER RESERVATIONS
========================================= */

function filterReservations() {

    const activeFilter =
        document
            .querySelector(".room-filter.active")
            .dataset.status;

    const searchTerm =
        reservationSearch.value
            .toLowerCase()
            .trim();


    const filteredReservations =
        reservations.filter(reservation => {

            const matchesStatus =
                activeFilter === "all" ||
                reservation.Status === activeFilter;


            const reference =
                String(
                    reservation.BookingReference || ""
                ).toLowerCase();

            const room =
                String(
                    reservation.RoomNumber || ""
                ).toLowerCase();

            const category =
                String(
                    reservation.CategoryName || ""
                ).toLowerCase();


            const matchesSearch =
                reference.includes(searchTerm) ||
                room.includes(searchTerm) ||
                category.includes(searchTerm);


            return matchesStatus && matchesSearch;
        });


    renderReservations(filteredReservations);
}


/* =========================================
   FILTER BUTTONS
========================================= */

reservationFilters.forEach(button => {

    button.addEventListener("click", () => {

        reservationFilters.forEach(filter => {
            filter.classList.remove("active");
        });

        button.classList.add("active");

        filterReservations();

    });

});


/* =========================================
   SEARCH
========================================= */

reservationSearch.addEventListener(
    "input",
    filterReservations
);


/* =========================================
   CANCEL RESERVATION
========================================= */

async function cancelReservation(reservationId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this reservation?"
        );

    if (!confirmed) {
        return;
    }


    const token = getToken();

    if (!token) return;


    try {

        const response = await fetch(
            `${API}/reservations/${reservationId}/cancel`,
            {
                method: "PUT",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to cancel reservation."
            );
        }


        alert(
            data.message ||
            "Reservation cancelled successfully."
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Cancel reservation error:",
            error
        );

        alert(
            error.message ||
            "Unable to cancel reservation."
        );
    }
}


/* =========================================
   MESSAGES
========================================= */

function showMessage(message, type) {

    reservationMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
}


function clearMessage() {

    reservationMessage.innerHTML = "";
}


/* ---- INITIAL LOAD ------ */
document.addEventListener(
    "DOMContentLoaded",
    loadReservations
);
