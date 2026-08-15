/* ============================================================
   GRAND HORIZON HOTEL
   EVENT STAFF DASHBOARD
   ============================================================ */

const API = "http://localhost:3000/api";

/* ============================================================
   STATE
   ============================================================ */

let customers = [];
let halls = [];
let events = [];



let nextEventId = 1000;


/* ============================================================
   DOM ELEMENTS
   ============================================================ */

const upcomingEventsCount =
    document.getElementById("upcomingEventsCount");

const availableHallsCount =
    document.getElementById("availableHallsCount");

const activeEventsCount =
    document.getElementById("activeEventsCount");


const hallAvailabilityBody =
    document.getElementById("hallAvailabilityBody");

const eventBookingsBody =
    document.getElementById("eventBookingsBody");





const eventSearch =
    document.getElementById("eventSearch");

const eventStatusFilter =
    document.getElementById("eventStatusFilter");

const eventModal =
    document.getElementById("eventModal");

const eventForm =
    document.getElementById("eventForm");

const eventFormError =
    document.getElementById("eventFormError");

const newEventButton =
    document.getElementById("newEventButton");

const closeEventModalButton =
    document.getElementById("closeEventModal");

const cancelEventModalButton =
    document.getElementById("cancelEventModal");

const logoutButton =
    document.getElementById("logoutButton");


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function getStaffToken() {
    return (
        sessionStorage.getItem("mgr_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("customerToken")
    );
}


function requireAuthentication() {
    const token = getStaffToken();

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


/* ============================================================
   API HELPER
   ============================================================ */

async function apiFetch(endpoint, options = {}) {

    const token = getStaffToken();

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    const response = await fetch(
        `${API}${endpoint}`,
        {
            ...options,
            headers
        }
    );

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


/* ============================================================
   HELPERS
   ============================================================ */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const value = String(dateValue).split("T")[0];

    const parts = value.split("-");

    if (parts.length !== 3) {
        return "—";
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
        !year ||
        !month ||
        !day ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return "—";
    }

    const date = new Date(
        year,
        month - 1,
        day
    );

    if (Number.isNaN(date.getTime())) {
        return "—";
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


function getStatusClass(status) {

    if (!status) {
        return "";
    }

    return String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");
}


function getCustomerName(customerId) {

    const customer =
        customers.find(
            customer =>
                Number(customer.id) === Number(customerId)
        );

    if (customer) {
        return customer.name;
    }

    const event =
        events.find(
            item =>
                Number(item.customerId) === Number(customerId)
        );

    return event?.customerName || "Unknown Customer";
}


function getHall(hallId) {

    return halls.find(
        hall =>
            Number(hall.id) === Number(hallId)
    );
}


function getHallName(hallId) {

    const hall = getHall(hallId);

    if (hall) {
        return hall.name;
    }

    const event =
        events.find(
            item =>
                Number(item.hallId) === Number(hallId)
        );

    return event?.hallName || "Unknown Hall";
}


/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */

function setupSidebarNavigation() {

    const navItems =
        document.querySelectorAll(
            ".sidebar-nav .nav-item"
        );

    navItems.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const href =
                    link.getAttribute("href");

                if (
                    !href ||
                    !href.startsWith("#")
                ) {
                    return;
                }

                event.preventDefault();

                const target =
                    document.querySelector(href);

                if (!target) {
                    console.warn(
                        "Navigation target not found:",
                        href
                    );
                    return;
                }

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                navItems.forEach(item => {
                    item.classList.remove("active");
                });

                link.classList.add("active");
            }
        );
    });
}


/* ============================================================
   DASHBOARD SUMMARY
   ============================================================ */

function renderSummary() {

    if (!upcomingEventsCount) {
        return;
    }

    const upcoming =
        events.filter(event =>
            [
                "Scheduled",
                "Confirmed"
            ].includes(event.status)
        );

    const active =
        events.filter(event =>
            event.status === "In Progress"
        );

    

    upcomingEventsCount.textContent =
        upcoming.length;

    activeEventsCount.textContent =
        active.length;

  

    const bookedHallIds =
        events
            .filter(event =>
                [
                    "Scheduled",
                    "Confirmed",
                    "In Progress"
                ].includes(event.status)
            )
            .map(event =>
                Number(event.hallId)
            );

    const available =
        halls.filter(
            hall =>
                !bookedHallIds.includes(
                    Number(hall.id)
                )
        );

    availableHallsCount.textContent =
        available.length;
}


/* ============================================================
   HALL AVAILABILITY
   ============================================================ */

function renderHallAvailability() {

    if (!hallAvailabilityBody) {
        return;
    }

    hallAvailabilityBody.innerHTML = "";

    if (!halls.length) {

        hallAvailabilityBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-row">
                    No halls available.
                </td>
            </tr>
        `;

        return;
    }

    halls.forEach(hall => {

        const bookedEvent =
            events.find(event =>
                Number(event.hallId) ===
                    Number(hall.id) &&
                [
                    "Scheduled",
                    "Confirmed",
                    "In Progress"
                ].includes(event.status)
            );

        const row =
            document.createElement("tr");

        if (bookedEvent) {

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(hall.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(hall.capacity)}
                </td>

                <td>
                    ${formatDate(
                        bookedEvent.eventDate
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        bookedEvent.startTime || "—"
                    )}
                    -
                    ${escapeHTML(
                        bookedEvent.endTime || "—"
                    )}
                </td>

                <td>
                    <span class="status-badge booked">
                        Booked
                    </span>
                </td>
            `;

        } else {

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(hall.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(hall.capacity)}
                </td>

                <td>—</td>

                <td>—</td>

                <td>
                    <span class="status-badge available">
                        Available
                    </span>
                </td>
            `;
        }

        hallAvailabilityBody.appendChild(row);
    });
}


/* ============================================================
   EVENT FILTERING
   ============================================================ */

function getFilteredEvents() {

    const search =
        eventSearch
            ? eventSearch.value
                .trim()
                .toLowerCase()
            : "";

    const status =
        eventStatusFilter
            ? eventStatusFilter.value
            : "all";

    return events.filter(event => {

        const matchesStatus =
            status === "all" ||
            event.status === status;

        const eventType =
            String(event.eventType || "")
                .toLowerCase();

        const customer =
            getCustomerName(
                event.customerId
            ).toLowerCase();

        const hall =
            getHallName(
                event.hallId
            ).toLowerCase();

        const matchesSearch =
            eventType.includes(search) ||
            customer.includes(search) ||
            hall.includes(search);

        return (
            matchesStatus &&
            matchesSearch
        );
    });
}


/* ============================================================
   EVENT BOOKINGS
   ============================================================ */

/* ============================================================
   EVENT BOOKINGS
   ============================================================ */

function renderEvents() {

    if (!eventBookingsBody) {
        return;
    }

    eventBookingsBody.innerHTML = "";

    const filtered = getFilteredEvents();

    if (!filtered.length) {

        eventBookingsBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-row"
                >
                    No events found.
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(event => {

        const row = document.createElement("tr");

        const currentStatus =
            event.status || "Confirmed";

        row.innerHTML = `
            <td>
                <strong>
                    ${escapeHTML(
                        event.eventType || "Event"
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    getCustomerName(
                        event.customerId
                    )
                )}
            </td>

            <td>
                ${escapeHTML(
                    getHallName(
                        event.hallId
                    )
                )}
            </td>

            <td>
                ${formatDate(
                    event.eventDate
                )}
            </td>

            <td>
                ${escapeHTML(
                    event.startTime || "—"
                )}
                -
                ${escapeHTML(
                    event.endTime || "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    event.attendees || 0
                )}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(
                        currentStatus
                    )}"
                >
                    ${escapeHTML(
                        currentStatus
                    )}
                </span>
            </td>

            <td>

                <div
                    style="
                        display:flex;
                        gap:8px;
                        align-items:center;
                        flex-wrap:wrap;
                    "
                >

                    

                    <select
                        class="event-status-select"
                        data-action="status"
                        data-id="${event.id}"
                        aria-label="Update event status"
                    >

                        <option value="">
                            Update Status
                        </option>

                        <option
                            value="Confirmed"
                            ${currentStatus === "Confirmed"
                                ? "selected"
                                : ""}
                        >
                            Confirmed
                        </option>

                        <option
                            value="In Progress"
                            ${currentStatus === "In Progress"
                                ? "selected"
                                : ""}
                        >
                            In Progress
                        </option>

                        <option
                            value="Completed"
                            ${currentStatus === "Completed"
                                ? "selected"
                                : ""}
                        >
                            Completed
                        </option>

                        <option
                            value="Cancelled"
                            ${currentStatus === "Cancelled"
                                ? "selected"
                                : ""}
                        >
                            Cancelled
                        </option>

                    </select>

                </div>

            </td>
        `;

        eventBookingsBody.appendChild(row);
    });
}




/* ============================================================
   FORM OPTIONS
   ============================================================ */

function populateFormOptions() {

    const customerSelect =
        document.getElementById(
            "customerName"
        );

    const hallSelect =
        document.getElementById(
            "hallName"
        );

    if (customerSelect) {

        customerSelect.innerHTML = `
            <option value="">
                Select customer
            </option>
        `;

        customers.forEach(customer => {

            const option =
                document.createElement("option");

            option.value =
                customer.id;

            option.textContent =
                customer.name;

            customerSelect.appendChild(option);
        });
    }

    if (hallSelect) {

        hallSelect.innerHTML = `
            <option value="">
                Select hall
            </option>
        `;

        halls.forEach(hall => {

            const option =
                document.createElement("option");

            option.value =
                hall.id;

            option.textContent =
                `${hall.name} (${hall.capacity} guests)`;

            hallSelect.appendChild(option);
        });
    }
}


/* ============================================================
   EVENT MODAL
   ============================================================ */

function openEventModal() {

    if (!eventModal) {
        return;
    }

    if (eventForm) {
        eventForm.reset();
    }

    if (eventFormError) {
        eventFormError.textContent = "";
    }

    eventModal.classList.add("open");

    eventModal.style.display =
        "flex";
}


function closeEventModal() {

    if (!eventModal) {
        return;
    }

    eventModal.classList.remove("open");

    eventModal.style.display =
        "none";
}


/* ============================================================
   CREATE EVENT
   ============================================================ */

async function createEvent() {

    const eventType =
        document
            .getElementById("eventType")
            ?.value
            .trim();

    const customerId =
        Number(
            document
                .getElementById("customerName")
                ?.value
        );

    const hallId =
        Number(
            document
                .getElementById("hallName")
                ?.value
        );

    const eventDate =
        document
            .getElementById("eventDate")
            ?.value;

    const startTime =
        document
            .getElementById("startTime")
            ?.value;

    const endTime =
        document
            .getElementById("endTime")
            ?.value;

    const attendees =
        Number(
            document
                .getElementById("attendees")
                ?.value
        );

    if (!eventFormError) {
        return;
    }

    eventFormError.textContent = "";


    /* =========================
       VALIDATION
       ========================= */

    if (!eventType) {
        eventFormError.textContent =
            "Event type is required.";
        return;
    }

    if (!customerId) {
        eventFormError.textContent =
            "Please select a customer.";
        return;
    }

    if (!hallId) {
        eventFormError.textContent =
            "Please select a hall.";
        return;
    }

    if (!eventDate) {
        eventFormError.textContent =
            "Event date is required.";
        return;
    }

    if (!startTime || !endTime) {
        eventFormError.textContent =
            "Start and end times are required.";
        return;
    }

    if (endTime <= startTime) {
        eventFormError.textContent =
            "End time must be later than start time.";
        return;
    }

    if (!attendees || attendees <= 0) {
        eventFormError.textContent =
            "Expected attendees must be greater than 0.";
        return;
    }


    /* =========================
       HALL VALIDATION
       ========================= */

    const hall = getHall(hallId);

    if (!hall) {
        eventFormError.textContent =
            "Selected hall could not be found.";
        return;
    }

    if (
        Number(attendees) >
        Number(hall.capacity)
    ) {
        eventFormError.textContent =
            `This hall can only accommodate ${hall.capacity} guests.`;
        return;
    }


    /* =========================
       FRONTEND CONFLICT CHECK
       ========================= */

    const conflict =
        events.some(event => {

            if (
                Number(event.hallId) !==
                Number(hallId)
            ) {
                return false;
            }

            if (
                String(event.eventDate)
                    .split("T")[0] !==
                String(eventDate)
            ) {
                return false;
            }

            if (
                event.status === "Cancelled"
            ) {
                return false;
            }

            return (
                startTime < event.endTime &&
                endTime > event.startTime
            );
        });


    if (conflict) {
        eventFormError.textContent =
            "This hall is already booked during the selected time.";
        return;
    }


    /* =========================
       SAVE TO DATABASE
       ========================= */

    try {

        const token =
            sessionStorage.getItem("mgr_token") ||
            localStorage.getItem("token");

        if (!token) {
            window.location.href = "login.html";
            return;
        }


        const response =
            await fetch(
                `${API}/events`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        CustomerID: customerId,
                        HallID: hallId,
                        EventType: eventType,
                        EventDate: eventDate,
                        StartTime: startTime,
                        EndTime: endTime,
                        ExpectedAttendees: attendees
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to create event booking."
            );
        }


        /* =========================
           SUCCESS
           ========================= */

        console.log(
            "Event booking created:",
            data
        );

        closeEventModal();

        /*
         * Reload from the DATABASE.
         * This proves the booking was
         * actually persisted.
         */
        await loadEventsFromAPI();

        renderAll();

        document
            .getElementById("eventBookings")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


    } catch (error) {

        console.error(
            "Create event error:",
            error
        );

        eventFormError.textContent =
            error.message ||
            "Unable to create event booking.";
    }
}


/* ============================================================
   EVENT ACTIONS
   ============================================================ */


if (eventBookingsBody) {

    eventBookingsBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest("button");

            if (!button) {
                return;
            }

            const eventId =
                Number(button.dataset.id);

           

        }
    );


    eventBookingsBody.addEventListener(
        "change",
        async event => {

            const select =
                event.target.closest(
                    ".event-status-select"
                );

            if (!select) {
                return;
            }

            const eventId =
                Number(select.dataset.id);

            const newStatus =
                select.value;

            if (!eventId || !newStatus) {
                return;
            }

            const eventRecord =
                events.find(
                    item =>
                        Number(item.id) ===
                        eventId
                );

            if (!eventRecord) {

                alert(
                    "Event could not be found."
                );

                return;
            }


            // Confirm cancellation
            if (
                newStatus === "Cancelled"
            ) {

                const confirmed =
                    window.confirm(
                        "Are you sure you want to cancel this event?"
                    );

                if (!confirmed) {

                    renderEvents();

                    return;
                }

            }


            // Prevent unnecessary API request
            if (
                eventRecord.status ===
                newStatus
            ) {

                return;
            }


            try {

                select.disabled = true;

                const originalText =
                    select.options[
                        select.selectedIndex
                    ].text;

                select.dataset.originalText =
                    originalText;


                await apiFetch(
                    `/events/${eventId}/status`,
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );


                // Reload events from database
                await loadEventsFromAPI();


                // Refresh dashboard and tables
                renderAll();


                console.log(
                    `Event ${eventId} updated to ${newStatus}.`
                );


            } catch (error) {

                console.error(
                    "Failed to update event status:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to update event status."
                );


                // Restore original database state
                renderEvents();

            }

        }
    );

}
            


/* ============================================================
   MODAL EVENT LISTENERS
   ============================================================ */

if (newEventButton) {

    newEventButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openEventModal();
        }
    );
}


if (closeEventModalButton) {

    closeEventModalButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeEventModal();
        }
    );
}


if (cancelEventModalButton) {

    cancelEventModalButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeEventModal();
        }
    );
}


if (eventModal) {

    eventModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                eventModal
            ) {
                closeEventModal();
            }
        }
    );
}


/* ============================================================
   ESCAPE KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {
            closeEventModal();
        }
    }
);


/* ============================================================
   SEARCH
   ============================================================ */

if (eventSearch) {

    eventSearch.addEventListener(
        "input",
        renderEvents
    );
}


if (eventStatusFilter) {

    eventStatusFilter.addEventListener(
        "change",
        renderEvents
    );
}


/* ============================================================
   EVENT FORM SUBMISSION
   ============================================================ */

if (eventForm) {

    eventForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            createEvent();
        }
    );
}


/* ============================================================
   LOGOUT
   ============================================================ */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            sessionStorage.removeItem(
                "mgr_token"
            );

            sessionStorage.removeItem(
                "mgr_role"
            );

            sessionStorage.removeItem(
                "mgr_name"
            );

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "customerToken"
            );

            localStorage.removeItem(
                "role"
            );

            localStorage.removeItem(
                "userType"
            );

            localStorage.removeItem(
                "customerId"
            );

            localStorage.removeItem(
                "CustomerID"
            );

            localStorage.removeItem(
                "FirstName"
            );

            localStorage.removeItem(
                "LastName"
            );

            localStorage.removeItem(
                "customerName"
            );

            window.location.href =
                "login.html";
        }
    );
}


/* ============================================================
   LOAD REAL EVENTS
   ============================================================ */

async function loadEventsFromAPI() {

    try {

        const data =
            await apiFetch(
                "/events"
            );

        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid event data received from server."
            );
        }


        events =
            data.map(event => ({

                id:
                    event.EventID,

                customerId:
                    event.CustomerID,

                customerName:
                    event.CustomerName,

                customerEmail:
                    event.Email,

                customerPhone:
                    event.ContactNumber,

                hallId:
                    event.HallID,

                hallName:
                    event.HallName,

                capacity:
                    Number(
                        event.Capacity || 0
                    ),

                eventType:
                    event.EventType,

                eventDate:
                    event.EventDate,

                startTime:
                    event.StartTime,

                endTime:
                    event.EndTime,

                attendees:
                    Number(
                        event.ExpectedAttendees ??
                        event.Attendees ??
                        event.ExpectedAttendees ??
                        0
                    ),

                status:
                    event.Status
            }));


        /*
         * Build unique customers from
         * real event data.
         */

        const customerMap =
            new Map();

        data.forEach(event => {

            if (
                event.CustomerID &&
                event.CustomerName
            ) {

                customerMap.set(
                    event.CustomerID,
                    {
                        id:
                            event.CustomerID,

                        name:
                            event.CustomerName
                    }
                );
            }
        });

        customers =
            Array.from(
                customerMap.values()
            );


        /*
         * Load actual halls from
         * /events/halls.
         *
         * This is important because
         * /events only returns halls
         * attached to existing events.
         */

        try {

            const hallData =
                await fetch(
                    `${API}/events/halls`
                );

            if (hallData.ok) {

                const hallRows =
                    await hallData.json();

                if (
                    Array.isArray(
                        hallRows
                    )
                ) {

                    halls =
                        hallRows.map(
                            hall => ({

                                id:
                                    hall.HallID,

                                name:
                                    hall.HallName,

                                capacity:
                                    Number(
                                        hall.Capacity || 0
                                    )
                            })
                        );
                }
            }

        } catch (hallError) {

            console.warn(
                "Could not load halls:",
                hallError
            );
        }


        /*
         * If the hall endpoint did not
         * return data, build halls from
         * the events as a fallback.
         */

        if (!halls.length) {

            const hallMap =
                new Map();

            data.forEach(event => {

                if (
                    event.HallID &&
                    event.HallName
                ) {

                    hallMap.set(
                        event.HallID,
                        {
                            id:
                                event.HallID,

                            name:
                                event.HallName,

                            capacity:
                                Number(
                                    event.Capacity || 0
                                )
                        }
                    );
                }
            });

            halls =
                Array.from(
                    hallMap.values()
                );
        }
  

        return true;

    } catch (error) {

        console.error(
            "Unable to load events:",
            error
        );

        if (eventBookingsBody) {

            eventBookingsBody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-row"
                    >
                        Unable to load event bookings.
                        Please refresh the page.
                    </td>
                </tr>
            `;
        }

        return false;
    }
}


/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderAll() {

    renderSummary();

    renderHallAvailability();

    renderEvents();
}


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initializeEventStaff() {

    if (
        !requireAuthentication()
    ) {
        return;
    }


    setupSidebarNavigation();


    const loaded =
        await loadEventsFromAPI();


    if (!loaded) {
        return;
    }


    populateFormOptions();

    renderAll();
}


initializeEventStaff();
