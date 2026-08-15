const API = "http://localhost:3000/api";



function getToken() {

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("mgr_token");

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    return token;
}


function authHeaders() {

    const token = getToken();

    if (!token) {
        return null;
    }

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


async function apiFetch(endpoint) {

    const headers = authHeaders();

    if (!headers) {
        throw new Error(
            "Authentication token not found. Please log in again."
        );
    }

    let response;

    try {

        response = await fetch(
            `${API}${endpoint}`,
            {
                method: "GET",
                headers
            }
        );

    } catch (error) {

        console.error(
            "API connection error:",
            error
        );

        throw new Error(
            "Cannot connect to the hotel server. Make sure the backend is running on port 3000."
        );
    }

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
}



function formatCurrency(amount) {

    const value =
        Number(amount || 0);

    return `GH₵ ${value.toFixed(2)}`;
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const value =
        String(dateValue)
            .split("T")[0];

    const parts =
        value.split("-");

    if (parts.length !== 3) {
        return "—";
    }

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);

    if (
        !year ||
        !month ||
        !day
    ) {
        return "—";
    }

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
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


function statusClass(status) {

    if (status === "Confirmed") {
        return "status-confirmed";
    }

    if (status === "Checked-In") {
        return "status-checked";
    }

    if (status === "Checked-Out") {
        return "status-other";
    }

    if (status === "Cancelled") {
        return "status-cancelled";
    }

    return "status-other";
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}



const reportType =
    document.getElementById(
        "reportType"
    );

const reportStats =
    document.getElementById(
        "reportStats"
    );

const reportContent =
    document.getElementById(
        "reportContent"
    );

const printButton =
    document.getElementById(
        "printReport"
    );



function showLoading() {

    if (reportStats) {

        reportStats.innerHTML = `
            <div class="report-stat">
                <div class="report-stat-label">
                    Loading
                </div>

                <div class="report-stat-value">
                    ...
                </div>
            </div>
        `;
    }

    if (reportContent) {

        reportContent.innerHTML = `
            <div class="report-section">
                <div class="report-section-header">
                    <h2>Loading Report</h2>

                    <p>
                        Retrieving the latest information from the database...
                    </p>
                </div>
            </div>
        `;
    }
}


function showError(message) {

    if (reportStats) {
        reportStats.innerHTML = "";
    }

    if (reportContent) {

        reportContent.innerHTML = `
            <div class="report-message error"
                 style="display:block;">

                ${escapeHTML(
                    message ||
                    "Unable to load report data."
                )}

            </div>
        `;
    }
}


function renderStats(data) {

    if (!reportStats) {
        return;
    }

   const occupancy =
    data.occupancy || {};

const guests =
    data.guests || {};

const activity =
    data.upcomingEvents || {};

const customers =
    data.customers || {};

const revenue =
    data.revenue || {};

    reportStats.innerHTML = `

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
                Current Guests
            </div>

            <div class="report-stat-value">
                ${guests.CurrentGuests || 0}
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
                Upcoming Events
            </div>

            <div class="report-stat-value">
                ${activity.UpcomingEvents || 0}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Total Customers
            </div>

            <div class="report-stat-value">
                ${customers.TotalCustomers || 0}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Total Revenue
            </div>

            <div class="report-stat-value">
                ${formatCurrency(
                    revenue.TotalRevenue
                )}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Outstanding Balance
            </div>

            <div class="report-stat-value">
                ${formatCurrency(
                    revenue.OutstandingBalance
                )}
            </div>

        </div>

    `;
}



function renderOverview(data) {

    if (!reportContent) {
        return;
    }

    const occupancy =
        data.occupancy || {};

    const guests =
        data.guests || {};

    const activity =
        data.todayActivity || {};

    const revenue =
        data.revenue || {};

    const events =
        data.upcomingEvents || {};

    const customers =
        data.customers || {};

    const staff =
        data.staffSummary || {};

    reportContent.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Hotel Operations Summary
                </h2>

                <p>
                    Current hotel occupancy, guest activity,
                    events and staffing information.
                </p>

            </div>


            <table class="report-table">

                <tbody>

                    <tr>
                        <td>Total Rooms</td>
                        <td>
                            ${occupancy.TotalRooms || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Available Rooms</td>
                        <td>
                            ${occupancy.Available || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Reserved Rooms</td>
                        <td>
                            ${occupancy.Reserved || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Occupied Rooms</td>
                        <td>
                            ${occupancy.Occupied || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Rooms Under Maintenance</td>
                        <td>
                            ${occupancy.UnderMaintenance || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Current Guests</td>
                        <td>
                            ${guests.CurrentGuests || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Total Occupants</td>
                        <td>
                            ${guests.TotalOccupants || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Today's Check-ins</td>
                        <td>
                            ${activity.TodayCheckIns || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Today's Check-outs</td>
                        <td>
                            ${activity.TodayCheckOuts || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Upcoming Events</td>
                        <td>
                            ${events.UpcomingEvents || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Total Customers</td>
                        <td>
                            ${customers.TotalCustomers || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Total Staff</td>
                        <td>
                            ${staff.TotalStaff || 0}
                        </td>
                    </tr>

                    <tr>
                        <td>Active Staff</td>
                        <td>
                            ${staff.ActiveStaff || 0}
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>


        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Revenue Summary
                </h2>

                <p>
                    Current invoice totals across hotel services.
                </p>

            </div>


            <table class="report-table">

                <tbody>

                    <tr>
                        <td>Room Revenue</td>
                        <td>
                            ${formatCurrency(
                                revenue.TotalRoomRevenue
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td>Event Revenue</td>
                        <td>
                            ${formatCurrency(
                                revenue.TotalEventRevenue
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td>Additional Revenue</td>
                        <td>
                            ${formatCurrency(
                                revenue.TotalAdditionalRevenue
                            )}
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <strong>
                                Total Revenue
                            </strong>
                        </td>

                        <td>
                            <strong>
                                ${formatCurrency(
                                    revenue.TotalRevenue
                                )}
                            </strong>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            Outstanding Balance
                        </td>

                        <td>
                            ${formatCurrency(
                                revenue.OutstandingBalance
                            )}
                        </td>
                    </tr>

                </tbody>

            </table>

        </div>

    `;
}



function renderRevenue(data) {

    if (!reportContent) {
        return;
    }

    const monthly =
        Array.isArray(data.monthly)
            ? data.monthly
            : [];

    const totals =
        data.totals || {};

    reportStats.innerHTML = `

        <div class="report-stat">
            <div class="report-stat-label">
                Total Paid
            </div>

            <div class="report-stat-value">
                ${formatCurrency(
                    totals.TotalPaid
                )}
            </div>
        </div>


        <div class="report-stat">
            <div class="report-stat-label">
                Total Unpaid
            </div>

            <div class="report-stat-value">
                ${formatCurrency(
                    totals.TotalUnpaid
                )}
            </div>
        </div>


        <div class="report-stat">
            <div class="report-stat-label">
                Partially Paid
            </div>

            <div class="report-stat-value">
                ${formatCurrency(
                    totals.TotalPartial
                )}
            </div>
        </div>

    `;


    reportContent.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Revenue Report
                </h2>

                <p>
                    Paid revenue by month from the invoice database.
                </p>

            </div>


            ${
                monthly.length
                    ? `
                        <div style="overflow-x:auto;">

                            <table class="report-table">

                                <thead>

                                    <tr>
                                        <th>Month</th>
                                        <th>Room Revenue</th>
                                        <th>Event Revenue</th>
                                        <th>Additional Revenue</th>
                                        <th>Total</th>
                                        <th>Room Bookings</th>
                                        <th>Event Bookings</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    ${monthly.map(
                                        row => `

                                            <tr>

                                                <td>
                                                    ${escapeHTML(
                                                        row.Month
                                                    )}
                                                </td>

                                                <td>
                                                    ${formatCurrency(
                                                        row.RoomRevenue
                                                    )}
                                                </td>

                                                <td>
                                                    ${formatCurrency(
                                                        row.EventRevenue
                                                    )}
                                                </td>

                                                <td>
                                                    ${formatCurrency(
                                                        row.AdditionalRevenue
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>
                                                        ${formatCurrency(
                                                            row.Total
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    ${row.RoomBookings || 0}
                                                </td>

                                                <td>
                                                    ${row.EventBookings || 0}
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : `
                        <div class="report-message">
                            No paid revenue records were found.
                        </div>
                    `
            }

        </div>

    `;
}



function renderOccupancy(data) {

    if (!reportContent) {
        return;
    }

    const categories =
        Array.isArray(data.byCategory)
            ? data.byCategory
            : [];

    const overdue =
        Array.isArray(data.overdue)
            ? data.overdue
            : [];


    reportStats.innerHTML = `

        <div class="report-stat">

            <div class="report-stat-label">
                Categories
            </div>

            <div class="report-stat-value">
                ${categories.length}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Overdue Guests
            </div>

            <div class="report-stat-value">
                ${overdue.length}
            </div>

        </div>

    `;


    reportContent.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Room Occupancy Report
                </h2>

                <p>
                    Occupancy and revenue by room category.
                </p>

            </div>


            ${
                categories.length
                    ? `
                        <div style="overflow-x:auto;">

                            <table class="report-table">

                                <thead>

                                    <tr>
                                        <th>Room Category</th>
                                        <th>Bookings</th>
                                        <th>Total Nights</th>
                                        <th>Revenue</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    ${categories.map(
                                        category => `

                                            <tr>

                                                <td>
                                                    ${escapeHTML(
                                                        category.CategoryName
                                                    )}
                                                </td>

                                                <td>
                                                    ${category.Bookings || 0}
                                                </td>

                                                <td>
                                                    ${category.TotalNights || 0}
                                                </td>

                                                <td>
                                                    ${formatCurrency(
                                                        category.Revenue
                                                    )}
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : `
                        <div class="report-message">
                            No occupancy records were found.
                        </div>
                    `
            }

        </div>


        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Overdue Check-outs
                </h2>

                <p>
                    Guests who have exceeded their scheduled check-out time.
                </p>

            </div>


            ${
                overdue.length
                    ? `
                        <div style="overflow-x:auto;">

                            <table class="report-table">

                                <thead>

                                    <tr>
                                        <th>Guest</th>
                                        <th>Room</th>
                                        <th>Check-out</th>
                                        <th>Hours Overdue</th>
                                        <th>Payment</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    ${overdue.map(
                                        guest => `

                                            <tr>

                                                <td>
                                                    <strong>
                                                        ${escapeHTML(
                                                            guest.GuestName
                                                        )}
                                                    </strong>
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        guest.RoomNumber
                                                    )}
                                                </td>

                                                <td>
                                                    ${formatDate(
                                                        guest.CheckOutDate
                                                    )}
                                                </td>

                                                <td>
                                                    ${guest.HoursOverdue || 0}
                                                </td>

                                                <td>
                                                    ${escapeHTML(
                                                        guest.PaymentStatus ||
                                                        "—"
                                                    )}
                                                </td>

                                            </tr>

                                        `
                                    ).join("")}

                                </tbody>

                            </table>

                        </div>
                    `
                    : `
                        <div class="report-message">
                            No overdue check-outs found.
                        </div>
                    `
            }

        </div>

    `;
}


async function loadReservationReport() {

    const data =
        await apiFetch(
            "/reservations"
        );

    const reservations =
        Array.isArray(data)
            ? data
            : (
                data.reservations ||
                []
            );


    if (!reportContent) {
        return;
    }


    if (!reservations.length) {

        reportContent.innerHTML = `

            <div class="report-section">

                <div class="report-section-header">

                    <h2>
                        Reservation Report
                    </h2>

                    <p>
                        No reservations were found.
                    </p>

                </div>

            </div>

        `;

        reportStats.innerHTML = "";

        return;
    }


    const totalReservations =
        reservations.length;

    const confirmed =
        reservations.filter(
            reservation =>
                reservation.Status === "Confirmed"
        ).length;

    const checkedIn =
        reservations.filter(
            reservation =>
                reservation.Status === "Checked-In"
        ).length;

    const cancelled =
        reservations.filter(
            reservation =>
                reservation.Status === "Cancelled"
        ).length;


    reportStats.innerHTML = `

        <div class="report-stat">

            <div class="report-stat-label">
                Total Reservations
            </div>

            <div class="report-stat-value">
                ${totalReservations}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Confirmed
            </div>

            <div class="report-stat-value">
                ${confirmed}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Checked-In
            </div>

            <div class="report-stat-value">
                ${checkedIn}
            </div>

        </div>


        <div class="report-stat">

            <div class="report-stat-label">
                Cancelled
            </div>

            <div class="report-stat-value">
                ${cancelled}
            </div>

        </div>

    `;


    reportContent.innerHTML = `

        <div class="report-section">

            <div class="report-section-header">

                <h2>
                    Reservation Report
                </h2>

                <p>
                    ${totalReservations}
                    reservations retrieved from the database.
                </p>

            </div>


            <div style="overflow-x:auto;">

                <table class="report-table">

                    <thead>

                        <tr>

                            <th>
                                Reference
                            </th>

                            <th>
                                Room
                            </th>

                            <th>
                                Check-in
                            </th>

                            <th>
                                Check-out
                            </th>

                            <th>
                                Guests
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Amount
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${reservations.map(
                            reservation => `

                                <tr>

                                    <td>
                                        <strong>
                                            ${escapeHTML(
                                                reservation.BookingReference ||
                                                "—"
                                            )}
                                        </strong>
                                    </td>


                                    <td>
                                        ${escapeHTML(
                                            reservation.RoomNumber ||
                                            "—"
                                        )}
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

                                        <span class="status-badge
                                            ${statusClass(
                                                reservation.Status
                                            )}">

                                            ${escapeHTML(
                                                reservation.Status ||
                                                "—"
                                            )}

                                        </span>

                                    </td>


                                    <td>
                                        ${formatCurrency(
                                            reservation.TotalAmount
                                        )}
                                    </td>

                                </tr>

                            `
                        ).join("")}

                    </tbody>

                </table>

            </div>

        </div>

    `;
}


async function loadAndRenderReport() {

    if (
        !reportType ||
        !reportStats ||
        !reportContent
    ) {
        console.error(
            "Required report elements were not found."
        );

        return;
    }


    const selectedReport =
        reportType.value;


    showLoading();


    try {

        switch (selectedReport) {




            case "overview": {

                const data =
                    await apiFetch(
                        "/reports/dashboard"
                    );

                renderStats(data);

                renderOverview(data);

                break;
            }


            case "revenue": {

                const data =
                    await apiFetch(
                        "/reports/revenue"
                    );

                renderRevenue(data);

                break;
            }


            case "occupancy": {

                const data =
                    await apiFetch(
                        "/reports/occupancy"
                    );

                renderOccupancy(data);

                break;
            }


            case "reservations": {

                await loadReservationReport();

                break;
            }


            default: {

                const data =
                    await apiFetch(
                        "/reports/dashboard"
                    );

                renderStats(data);

                renderOverview(data);

                break;
            }

        }

    } catch (error) {

        console.error(
            "Report loading error:",
            error
        );

        showError(
            error.message ||
            "Unable to load report data."
        );
    }
}



function printReport() {

    window.print();
}



function initializeReportsPage() {

    console.log(
        "Reports page initialized."
    );


    if (printButton) {

        printButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                printReport();

            }
        );
    }


    if (reportType) {

        reportType.addEventListener(
            "change",
            loadAndRenderReport
        );
    }


    loadAndRenderReport();
}



if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeReportsPage
    );

} else {

    initializeReportsPage();

}