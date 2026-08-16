/* -------CUSTOMER BOOKINGS-----*/

const API_BASE = "http://localhost:3000/api";

let allBookings = [];
let currentFilter = "all";


/* --------------GET TOKEN---------- */

function getToken() {

    return localStorage.getItem("token");

}


/* ---AUTH CHECK----------- */

function checkAuthentication() {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return false;

    }

    return true;

}


/* ---------FORMAT MONEY-------- */

function formatMoney(amount) {

    return "$ " + Number(amount || 0).toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =------------FORMAT DATE------------ */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
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


/* =------STATUS CLASS-------- */

function getStatusClass(status) {

    if (!status) {
        return "";
    }

    const normalized =
        status.toLowerCase().replace(/\s+/g, "-");

    if (
        normalized.includes("confirm") ||
        normalized.includes("booked")
    ) {
        return "confirmed";
    }

    if (
        normalized.includes("pending")
    ) {
        return "pending";
    }

    if (
        normalized.includes("cancel")
    ) {
        return "cancelled";
    }

    if (
        normalized.includes("complete") ||
        normalized.includes("checkout")
    ) {
        return "completed";
    }

    return "";
}


/* =-------------FETCH HELPER---------- */

async function fetchAPI(endpoint) {

    const token = getToken();

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );


    if (!response.ok) {

        let message =
            `Request failed (${response.status})`;

        try {

            const data =
                await response.json();

            if (data.error) {
                message = data.error;
            }

        } catch {
            // Keep default message
        }

        throw new Error(message);

    }


    return response.json();

}


/* ---------LOAD ROOM BOOKINGS---------*/

async function loadRoomBookings() {

    try {

        const data =
            await fetchAPI("/reservations/my");


        return data.map(function (reservation) {

            return {

                id:
                    reservation.ReservationID,

                type:
                    "room",

                title:
                    reservation.RoomNumber
                        ? `Room ${reservation.RoomNumber}`
                        : "Room Reservation",

                reference:
                    reservation.BookingReference ||
                    `RES-${reservation.ReservationID}`,

                status:
                    reservation.Status || "Pending",

                startDate:
                    reservation.CheckInDate,

                endDate:
                    reservation.CheckOutDate,

                details: {

                    first:
                        "Check-in",

                    firstValue:
                        formatDate(
                            reservation.CheckInDate
                        ),

                    second:
                        "Check-out",

                    secondValue:
                        formatDate(
                            reservation.CheckOutDate
                        ),

                    third:
                        "Room",

                    thirdValue:
                        reservation.RoomNumber
                            ? `Room ${reservation.RoomNumber}`
                            : "—",

                    fourth:
                        "Guests",

                    fourthValue:
                        reservation.NumberOfGuests ||
                        reservation.Guests ||
                        "—"

                },

                amount:
                    reservation.TotalAmount ||
                    reservation.Amount ||
                    reservation.Total ||
                    0

            };

        });

    } catch (error) {

        console.error(
            "Room bookings error:",
            error
        );

        return [];

    }

}


/* ----------LOAD EVENT BOOKINGS------ */

async function loadEventBookings() {

    try {

        const data =
            await fetchAPI("/events/my");


        return data.map(function (event) {

            return {

                id:
                    event.EventID,

                type:
                    "event",

                title:
                    event.EventType ||
                    "Event Booking",

                reference:
                    event.EventReference ||
                    `EVT-${event.EventID}`,

                status:
                    event.Status || "Pending",

                startDate:
                    event.EventDate,

                endDate:
                    event.EventDate,

                details: {

                    first:
                        "Event Date",

                    firstValue:
                        formatDate(
                            event.EventDate
                        ),

                    second:
                        "Time",

                    secondValue:
                        event.StartTime &&
                        event.EndTime
                            ? `${event.StartTime} - ${event.EndTime}`
                            : "—",

                    third:
                        "Hall",

                    thirdValue:
                        event.HallName ||
                        `Hall ${event.HallID || "—"}`,

                    fourth:
                        "Attendees",

                    fourthValue:
                        event.ExpectedAttendees ||
                        event.Attendees ||
                        "—"

                },

                amount:
                    event.TotalAmount ||
                    event.Amount ||
                    event.EventCharges ||
                    0

            };

        });

    } catch (error) {

        console.error(
            "Event bookings error:",
            error
        );

        return [];

    }

}


/* =------ LOAD ALL BOOKINGS------- */

async function loadBookings() {

    const bookingList =
        document.getElementById("bookingList");


    bookingList.innerHTML = `
        <div class="loading-state">
            Loading your bookings...
        </div>
    `;


    try {

        const results =
            await Promise.all([
                loadRoomBookings(),
                loadEventBookings()
            ]);


        allBookings = [
            ...results[0],
            ...results[1]
        ];


        /* Sort newest/upcoming first */

        allBookings.sort(function (a, b) {

            return new Date(a.startDate) -
                new Date(b.startDate);

        });


        renderBookings();

    } catch (error) {

        console.error(
            "Bookings error:",
            error
        );


        bookingList.innerHTML = `
            <div class="empty-bookings">

                <div class="empty-bookings-icon">
                    ⚠
                </div>

                <h3>
                    Unable to load bookings
                </h3>

                <p>
                    ${error.message}
                </p>

                <button
                    type="button"
                    class="primary-button"
                    onclick="loadBookings()"
                >
                    Try Again
                </button>

            </div>
        `;

    }

}


/* ----RENDER BOOKINGS---------- */

function renderBookings() {

    const bookingList =
        document.getElementById("bookingList");


    let bookings =
        allBookings;


    if (currentFilter !== "all") {

        bookings =
            allBookings.filter(function (booking) {

                return booking.type === currentFilter;

            });

    }


    if (bookings.length === 0) {

        bookingList.innerHTML = `

            <div class="empty-bookings">

                <div class="empty-bookings-icon">
                    ▣
                </div>

                <h3>
                    No bookings found
                </h3>

                <p>
                    You don't have any bookings in this category yet.
                </p>

                <a
                    href="${
                        currentFilter === "event"
                            ? "customer-halls.html"
                            : "customer-rooms.html"
                    }"
                    class="primary-button"
                >
                    ${
                        currentFilter === "event"
                            ? "Book an Event Hall"
                            : "Book a Room"
                    }
                </a>

            </div>

        `;

        return;

    }


    bookingList.innerHTML =
        bookings.map(function (booking) {

            const statusClass =
                getStatusClass(
                    booking.status
                );


            const icon =
                booking.type === "room"
                    ? "▣"
                    : "♜";


            return `

                <div class="booking-card">

                    <div class="booking-card-header">

                        <div class="booking-title">

                            <div class="booking-icon">
                                ${icon}
                            </div>

                            <div>

                                <h3>
                                    ${booking.title}
                                </h3>

                                <span class="booking-reference">
                                    ${booking.reference}
                                </span>

                            </div>

                        </div>


                        <span
                            class="booking-status ${statusClass}"
                        >
                            ${booking.status}
                        </span>

                    </div>


                    <div class="booking-details">

                        <div class="booking-detail">

                            <span>
                                ${booking.details.first}
                            </span>

                            <strong>
                                ${booking.details.firstValue}
                            </strong>

                        </div>


                        <div class="booking-detail">

                            <span>
                                ${booking.details.second}
                            </span>

                            <strong>
                                ${booking.details.secondValue}
                            </strong>

                        </div>


                        <div class="booking-detail">

                            <span>
                                ${booking.details.third}
                            </span>

                            <strong>
                                ${booking.details.thirdValue}
                            </strong>

                        </div>


                        <div class="booking-detail">

                            <span>
                                ${booking.details.fourth}
                            </span>

                            <strong>
                                ${booking.details.fourthValue}
                            </strong>

                        </div>

                    </div>


                    <div class="booking-footer">

                        <div class="booking-amount">

                            <span>
                                Total
                            </span>

                            <strong>
                                ${formatMoney(booking.amount)}
                            </strong>

                        </div>


                        <div class="booking-actions">

                            <button
                                type="button"
                                class="booking-button"
                                onclick="viewBooking(
                                    '${booking.type}',
                                    '${booking.id}'
                                )"
                            >
                                View Details
                            </button>


                            ${
                                ![
                                    "cancelled",
                                    "completed"
                                ].includes(
                                    booking.status
                                        .toLowerCase()
                                )
                                ? `
                                    <button
                                        type="button"
                                        class="booking-button"
                                        onclick="cancelBooking(
                                            '${booking.type}',
                                            '${booking.id}'
                                        )"
                                    >
                                        Cancel
                                    </button>
                                `
                                : ""
                            }

                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


/* --------------FILTER TABS---------= */

document.querySelectorAll(
    ".booking-tab"
).forEach(function (tab) {

    tab.addEventListener(
        "click",
        function () {

            document
                .querySelectorAll(
                    ".booking-tab"
                )
                .forEach(function (item) {

                    item.classList.remove(
                        "active"
                    );

                });


            this.classList.add("active");


            currentFilter =
                this.dataset.type;


            renderBookings();

        }
    );

});


/* --------- VIEW BOOKING--------- */


function viewBooking(type, id) {

    const booking = allBookings.find(function (item) {
        return (
            item.type === type &&
            String(item.id) === String(id)
        );
    });

    if (!booking) {
        alert("Unable to find booking details.");
        return;
    }

    const details = booking.details || {};

    const message = `
${booking.title}
${booking.reference}

Status: ${booking.status}

${details.first || "Details"}: ${details.firstValue || "—"}
${details.second || "Details"}: ${details.secondValue || "—"}
${details.third || "Details"}: ${details.thirdValue || "—"}
${details.fourth || "Details"}: ${details.fourthValue || "—"}

Total: ${formatMoney(booking.amount)}
    `.trim();

    alert(message);
}
        


/* ------------CANCEL BOOKING------------- */

async function cancelBooking(
    type,
    id
) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const token =
            getToken();


        const endpoint =
            type === "room"
                ? `/reservations/${id}/cancel`
                : `/events/${id}/cancel`;


        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to cancel booking."
            );

        }


        alert(
            data.message ||
            "Booking cancelled successfully."
        );


        await loadBookings();

    } catch (error) {

        alert(
            error.message
        );

    }

}


/* --------------LOGOUT--------- */

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("CustomerID");
            localStorage.removeItem("FirstName");
            localStorage.removeItem("role");

            window.location.href =
                "login.html";

        }
    );


/* -------------LOAD USER INFO-------------- */

function loadUserInfo() {

    const firstName =
        localStorage.getItem(
            "FirstName"
        );


    if (!firstName) {
        return;
    }


    const name =
        firstName;


    const initials =
        name
            .split(" ")
            .map(
                word => word.charAt(0)
            )
            .join("")
            .substring(0, 2)
            .toUpperCase();


    document.getElementById(
        "sidebarName"
    ).textContent =
        name;


    document.getElementById(
        "profileName"
    ).textContent =
        name;


    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        initials;


    document.getElementById(
        "profileAvatar"
    ).textContent =
        initials;

}


/* --------------INITIALISE----------*/

if (checkAuthentication()) {

    loadUserInfo();

    loadBookings();

}
