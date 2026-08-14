const API = "http://localhost:3000/api";

let dashboardData = null;
let reservations = [];


/* =========================================
   AUTHENTICATION
========================================= */

function getToken() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    return token;
}


/* =========================================
   HELPERS
========================================= */

function authHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


function formatCurrency(amount) {

    const value = Number(amount || 0);

    return `GH₵ ${value.toFixed(2)}`;
}


function formatDate(date) {

    if (!date) {
        return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function statusClass(status) {

    if (status === "Confirmed") {
        return "status-confirmed";
    }

    if (status === "Checked-In") {
        return "status-checked";
    }

    if (status === "Cancelled") {
        return "status-cancelled";
    }

    return "status-other";
}


/* =========================================
   MESSAGES
========================================= */

function showMessage(message, type) {

    const element =
        document.getElementById("reportMessage");

    element.textContent = message;

    element.className =
        `report-message ${type}`;
}


function clearMessage() {

    const element =
        document.getElementById("reportMessage");

    element.textContent = "";

    element.className =
        "report-message";
}


/* =========================================
   LOAD DASHBOARD REPORT DATA
========================================= */

async function loadDashboardReport() {

    const response = await fetch(
        `${API}/reports/dashboard`,
        {
            method: "GET",
            headers: authHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Unable to load report data."
        );
    }

    return data;
}


/* =========================================
   LOAD RESERVATIONS
========================================= */

async function loadReservationData() {

    const response = await fetch(
        `${API}/reservations`,
        {
            method: "GET",
            headers: authHeaders()
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            "Unable to load reservations."
        );
    }

    return Array.isArray(data) ? data : [];
}


/* =========================================
   RENDER STATISTICS
========================================= */

function renderStats(data) {

    const stats =
        document.getElementById("reportStats");

    const occupancy =
        data.occupancy || {};

    const guests =
        data.guests || {};

    const activity =
        data.todayActivity || {};

    const revenue =
        data.revenue || {};


    const totalRevenue =
        revenue.GrandTotalRevenue ??
        revenue.TotalRevenue ??
        revenue.grandTotal ??
        0;


    stats.innerHTML = `

        <div class="report-stat">

            <div class="report-stat-label">
                Total Rooms
            </div>

            <div class="report-stat-value">
                ${occupancy.TotalRooms || 0}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Occupied Rooms
            </div>

            <div class="report-stat-value">
                ${occupancy.Occupied || 0}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Today's Check-ins
            </div>

            <div class="report-stat-value">
                ${activity.TodayCheckIns || 0}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Total Revenue
            </div>

            <div class="report-stat-value">
                ${formatCurrency(totalRevenue)}
            </div>

        </div>

    `;
}


/* =========================================
   OVERALL REPORT
========================================= */

function renderOverview(data) {

    const occupancy =
        data.occupancy || {};

    const activity =
        data.todayActivity || {};

    const revenue =
        data.revenue || {};

    const content =
        document.getElementById("reportContent");


    const roomRevenue =
        revenue.TotalRoomRevenue ??
        revenue.RoomRevenue ??
        0;

    const eventRevenue =
        revenue.TotalEventRevenue ??
        revenue.EventRevenue ??
        0;

    const additionalRevenue =
        revenue.TotalAdditionalRevenue ??
        revenue.AdditionalRevenue ??
        0;

    const totalRevenue =
        revenue.GrandTotalRevenue ??
        revenue.TotalRevenue ??
        0;


    content.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>Hotel Operations Summary</h2>

                <p>
                    Current room availability and daily activity.
                </p>

            </div>


            <table class="report-table">

                <tbody>

                    <tr>
                        <td>Total Rooms</td>
                        <td>${occupancy.TotalRooms || 0}</td>
                    </tr>

                    <tr>
                        <td>Available Rooms</td>
                        <td>${occupancy.Available || 0}</td>
                    </tr>

                    <tr>
                        <td>Reserved Rooms</td>
                        <td>${occupancy.Reserved || 0}</td>
                    </tr>

                    <tr>
                        <td>Occupied Rooms</td>
                        <td>${occupancy.Occupied || 0}</td>
                    </tr>

                    <tr>
                        <td>Rooms Under Maintenance</td>
                        <td>${occupancy.UnderMaintenance || 0}</td>
                    </tr>

                    <tr>
                        <td>Today's Check-ins</td>
                        <td>${activity.TodayCheckIns || 0}</td>
                    </tr>

                    <tr>
                        <td>Today's Check-outs</td>
                        <td>${activity.TodayCheckOuts || 0}</td>
                    </tr>

                </tbody>

            </table>

        </div>


        <div class="report-section">

            <div class="report-section-header">

                <h2>Revenue Summary</h2>

                <p>
                    Revenue generated across hotel services.
                </p>

            </div>


            <table class="report-table">

                <tbody>

                    <tr>
                        <td>Room Revenue</td>
                        <td>${formatCurrency(roomRevenue)}</td>
                    </tr>

                    <tr>
                        <td>Event Revenue</td>
                        <td>${formatCurrency(eventRevenue)}</td>
                    </tr>

                    <tr>
                        <td>Additional Revenue</td>
                        <td>${formatCurrency(additionalRevenue)}</td>
                    </tr>

                    <tr>
                        <td><strong>Grand Total</strong></td>
                        <td>
                            <strong>
                                ${formatCurrency(totalRevenue)}
                            </strong>
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================
   REVENUE REPORT
========================================= */

function renderRevenue(data) {

    const revenue =
        data.revenue || {};

    const roomRevenue =
        revenue.TotalRoomRevenue ??
        revenue.RoomRevenue ??
        0;

    const eventRevenue =
        revenue.TotalEventRevenue ??
        revenue.EventRevenue ??
        0;

    const additionalRevenue =
        revenue.TotalAdditionalRevenue ??
        revenue.AdditionalRevenue ??
        0;

    const totalRevenue =
        revenue.GrandTotalRevenue ??
        revenue.TotalRevenue ??
        0;


    document.getElementById(
        "reportContent"
    ).innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>Revenue Report</h2>

                <p>
                    Financial performance from hotel operations.
                </p>

            </div>


            <table class="report-table">

                <thead>

                    <tr>
                        <th>Revenue Source</th>
                        <th>Amount</th>
                    </tr>

                </thead>

                <tbody>

                    <tr>
                        <td>Room Charges</td>
                        <td>${formatCurrency(roomRevenue)}</td>
                    </tr>

                    <tr>
                        <td>Event Charges</td>
                        <td>${formatCurrency(eventRevenue)}</td>
                    </tr>

                    <tr>
                        <td>Additional Charges</td>
                        <td>${formatCurrency(additionalRevenue)}</td>
                    </tr>

                    <tr>
                        <td><strong>Grand Total</strong></td>
                        <td>
                            <strong>
                                ${formatCurrency(totalRevenue)}
                            </strong>
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================
   OCCUPANCY REPORT
========================================= */

function renderOccupancy(data) {

    const occupancy =
        data.occupancy || {};


    document.getElementById(
        "reportContent"
    ).innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>Room Occupancy Report</h2>

                <p>
                    Current room availability and occupancy.
                </p>

            </div>


            <table class="report-table">

                <thead>

                    <tr>
                        <th>Room Status</th>
                        <th>Number of Rooms</th>
                    </tr>

                </thead>


                <tbody>

                    <tr>
                        <td>Available</td>
                        <td>${occupancy.Available || 0}</td>
                    </tr>

                    <tr>
                        <td>Reserved</td>
                        <td>${occupancy.Reserved || 0}</td>
                    </tr>

                    <tr>
                        <td>Occupied</td>
                        <td>${occupancy.Occupied || 0}</td>
                    </tr>

                    <tr>
                        <td>Under Maintenance</td>
                        <td>
                            ${occupancy.UnderMaintenance || 0}
                        </td>
                    </tr>

                    <tr>
                        <td><strong>Total</strong></td>
                        <td>
                            <strong>
                                ${occupancy.TotalRooms || 0}
                            </strong>
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================
   RESERVATION REPORT
========================================= */

function renderReservationsReport() {

    const content =
        document.getElementById(
            "reportContent"
        );


    if (reservations.length === 0) {

        content.innerHTML = `

            <div class="report-section">

                <div class="report-section-header">

                    <h2>Reservation Report</h2>

                    <p>No reservations found.</p>

                </div>

            </div>

        `;

        return;
    }


    content.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>Reservation Report</h2>

                <p>
                    ${reservations.length} reservations
                    retrieved from the database.
                </p>

            </div>


            <div style="overflow-x:auto;">

                <table class="report-table">

                    <thead>

                        <tr>
                            <th>Reference</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Guests</th>
                            <th>Status</th>
                            <th>Amount</th>
                        </tr>

                    </thead>


                    <tbody>

                        ${reservations.map(reservation => `

                            <tr>

                                <td>
                                    <strong>
                                        ${reservation.BookingReference || "—"}
                                    </strong>
                                </td>

                                <td>
                                    ${reservation.RoomNumber || "—"}
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
                                    ${reservation.NumOccupants || 0}
                                </td>

                                <td>

                                    <span
                                        class="status-badge
                                        ${statusClass(
                                            reservation.Status
                                        )}"
                                    >
                                        ${reservation.Status || "—"}
                                    </span>

                                </td>

                                <td>
                                    ${formatCurrency(
                                        reservation.TotalAmount
                                    )}
                                </td>

                            </tr>

                        `).join("")}

                    </tbody>

                </table>

            </div>

        </div>

    `;
}


/* =========================================
   GENERATE REPORT
========================================= */

async function generateReport() {

    const reportType =
        document.getElementById(
            "reportType"
        ).value;


    try {

        showMessage(
            "Generating report...",
            "loading"
        );


        dashboardData =
            await loadDashboardReport();


        if (
            reportType === "reservations"
        ) {

            reservations =
                await loadReservationData();

        }


        renderStats(dashboardData);


        if (reportType === "overview") {

            renderOverview(
                dashboardData
            );

        } else if (
            reportType === "revenue"
        ) {

            renderRevenue(
                dashboardData
            );

        } else if (
            reportType === "occupancy"
        ) {

            renderOccupancy(
                dashboardData
            );

        } else if (
            reportType === "reservations"
        ) {

            renderReservationsReport();

        }


        clearMessage();

    } catch (error) {

        console.error(
            "Report generation error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to generate report.",
            "error"
        );
    }
}


/*---------PRINT REPORT----------- */

function printReport() {

    window.print();

}


/* ------------EVENTS------------ */

document
    .getElementById("generateReport")
    .addEventListener(
        "click",
        generateReport
    );


document
    .getElementById("printReport")
    .addEventListener(
        "click",
        printReport
    );


document
    .getElementById("reportType")
    .addEventListener(
        "change",
        generateReport
    );


/* -----INITIAL LOAD--------- */

document.addEventListener(
    "DOMContentLoaded",
    generateReport
);