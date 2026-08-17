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


/* =========================================
   API HELPER
========================================= */

async function customerFetch(endpoint) {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("No customer authentication token found.");
    }

    const response = await fetch(
        `http://localhost:3000/api${endpoint}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            `Request failed (${response.status})`
        );
    }

    return data;
}


/* =========================================
   FORMAT MONEY
========================================= */

function formatCustomerMoney(amount) {

    return `$ ${Number(amount || 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


/* =========================================
   LOAD CUSTOMER DASHBOARD SUMMARY
========================================= */

async function loadCustomerDashboard() {

    try {

        const data =
            await customerFetch("/customer/dashboard");


        /* =====================================
           ACTIVE BOOKINGS
        ===================================== */

        const activeBookings =
            document.getElementById("activeBookings");

        if (activeBookings) {

            activeBookings.textContent =
                Number(data.activeBookings || 0);

        }


        /* =====================================
           UPCOMING EVENTS
        ===================================== */

        const upcomingEvents =
            document.getElementById("upcomingEvents");

        if (upcomingEvents) {

            upcomingEvents.textContent =
                Number(data.upcomingEvents || 0);

        }


        /* =====================================
           OUTSTANDING BALANCE
        ===================================== */

        const balance =
            Number(data.outstandingBalance || 0);

        const outstandingBalance =
            document.getElementById("outstandingBalance");

        if (outstandingBalance) {

            outstandingBalance.textContent =
                formatCustomerMoney(balance);

        }


        /* =====================================
           PAID INVOICES
        ===================================== */

        const paidInvoices =
            document.getElementById("paidInvoices");

        if (paidInvoices) {

            paidInvoices.textContent =
                Number(data.paidInvoices || 0);

        }


        /* =====================================
           QUICK BILLING BALANCE
        ===================================== */

        const quickBillingBalance =
            document.getElementById("quickBillingBalance");

        if (quickBillingBalance) {

            quickBillingBalance.textContent =
                formatCustomerMoney(balance);

        }


        console.log(
            "Customer dashboard updated:",
            data
        );


    } catch (error) {

        console.error(
            "Customer dashboard error:",
            error
        );

    }
}


/* =========================================
   LOAD UPCOMING BOOKINGS
========================================= */

async function loadUpcomingBookings() {

    const container =
        document.getElementById("upcomingBookings");

    if (!container) {
        return;
    }


    try {

        /* =====================================
           GET CUSTOMER ROOM BOOKINGS
        ===================================== */

        const reservations =
            await customerFetch("/reservations/my");


        /* =====================================
           GET CUSTOMER EVENT BOOKINGS
        ===================================== */

        const events =
            await customerFetch("/events/my");


        const now =
            new Date();


        /* =====================================
           ROOM BOOKINGS
        ===================================== */

        const roomBookings =
            (Array.isArray(reservations)
                ? reservations
                : []
            )
            .filter(reservation => {

                const checkIn =
                    new Date(reservation.CheckInDate);

                return (
                    checkIn >= now &&
                    reservation.Status !== "Cancelled"
                );

            })
            .map(reservation => {

                return {

                    type: "room",

                    date:
                        new Date(
                            reservation.CheckInDate
                        ),

                    name:
                        `${reservation.CategoryName || "Room"}`
                        + ` · Room ${reservation.RoomNumber}`,

                    details:
                        formatDateRange(
                            reservation.CheckInDate,
                            reservation.CheckOutDate
                        ),

                    status:
                        reservation.Status || "Confirmed",

                    amount:
                        Number(
                            reservation.TotalAmount || 0
                        )

                };

            });


        /* =====================================
           EVENT BOOKINGS
        ===================================== */

        const eventBookings =
            (Array.isArray(events)
                ? events
                : []
            )
            .filter(event => {

                const eventDate =
                    new Date(event.EventDate);

                return (
                    eventDate >= now &&
                    event.Status !== "Cancelled"
                );

            })
            .map(event => {

                return {

                    type: "event",

                    date:
                        new Date(event.EventDate),

                    name:
                        event.HallName ||
                        "Event Hall",

                    details:
                        `${event.EventType || "Event"} · `
                        + formatSingleDate(
                            event.EventDate
                        ),

                    status:
                        event.Status || "Pending",

                    amount:
                        Number(
                            event.TotalAmount || 0
                        )

                };

            });


        /* =====================================
           COMBINE + SORT
        ===================================== */

        const upcoming =
            roomBookings
                .concat(eventBookings)
                .sort(
                    (a, b) =>
                        a.date - b.date
                )
                .slice(0, 5);


        /* =====================================
           NOTHING TO SHOW
        ===================================== */

        if (upcoming.length === 0) {

            container.innerHTML = `
                <div class="customer-booking">
                    <div class="booking-details">
                        <strong>No upcoming bookings</strong>
                        <span>
                            You do not have any upcoming room
                            or event bookings.
                        </span>
                    </div>
                </div>
            `;

            return;
        }


        /* =====================================
           RENDER BOOKINGS
        ===================================== */

        container.innerHTML =
            upcoming
                .map(booking => {

                    const statusClass =
                        String(
                            booking.status
                        )
                        .toLowerCase()
                        .replace(/\s+/g, "-");


                    return `
                        <div class="customer-booking">

                            <div class="booking-details">

                                <strong>
                                    ${escapeHtml(
                                        booking.name
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        booking.details
                                    )}
                                </span>

                            </div>


                            <div class="booking-status ${statusClass}">
                                ${escapeHtml(
                                    booking.status
                                )}
                            </div>


                            <strong class="booking-amount">
                                ${formatCustomerMoney(
                                    booking.amount
                                )}
                            </strong>

                        </div>
                    `;

                })
                .join("");


    } catch (error) {

        console.error(
            "Upcoming bookings error:",
            error
        );


        container.innerHTML = `
            <div class="customer-booking">

                <div class="booking-details">

                    <strong>
                        Unable to load bookings
                    </strong>

                    <span>
                        ${escapeHtml(
                            error.message
                        )}
                    </span>

                </div>

            </div>
        `;

    }
}


/* =========================================
   DATE FORMATTING
========================================= */

function formatSingleDate(dateValue) {

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateRange(
    checkIn,
    checkOut
) {

    const start =
        new Date(checkIn);

    const end =
        new Date(checkOut);


    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return "";
    }


    const startText =
        start.toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "short"
            }
        );


    const endText =
        end.toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );


    return `${startText} – ${endText}`;
}


/* =========================================
   BASIC HTML ESCAPING
========================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   PAGE LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        /* =====================================
           CUSTOMER NAME
        ===================================== */

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


        /* =====================================
           SIDEBAR NAME
        ===================================== */

        document
            .querySelectorAll(
                "#sidebarCustomerName"
            )
            .forEach(element => {

                element.textContent =
                    customerName;

            });


        /* =====================================
           TOP NAME
        ===================================== */

        document
            .querySelectorAll(
                "#topCustomerName"
            )
            .forEach(element => {

                element.textContent =
                    customerName;

            });


        /* =====================================
           SIDEBAR / PROFILE NAME
        ===================================== */

        document
            .querySelectorAll(
                "#sidebarName, #profileName"
            )
            .forEach(element => {

                element.textContent =
                    customerName;

            });


        /* =====================================
           WELCOME MESSAGE
        ===================================== */

        document
            .querySelectorAll(
                "#welcomeCustomerName"
            )
            .forEach(element => {

                element.textContent =
                    displayFirstName;

            });


        /* =====================================
           CUSTOMER INITIALS
        ===================================== */

        const initials =
            getUserInitials();


        document
            .querySelectorAll(
                ".user-avatar, .profile-avatar"
            )
            .forEach(element => {

                element.textContent =
                    initials;

            });


        /* =====================================
           LOAD LIVE DATABASE DATA
        ===================================== */

        await Promise.all([
            loadCustomerDashboard(),
            loadUpcomingBookings()
        ]);

    }
);