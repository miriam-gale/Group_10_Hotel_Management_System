/* =========================================
   EVENT STAFF — MOCK DATA
   Temporary frontend data until backend
   role-specific endpoints are completed.
========================================= */

const customers = [
    { id: 1, name: "Kwame Mensah" },
    { id: 2, name: "Akosua Boateng" },
    { id: 3, name: "James Anderson" },
    { id: 4, name: "Ama Serwaa" },
    { id: 5, name: "Michael Owusu" }
];

const halls = [
    {
        id: 1,
        name: "Conference Hall A",
        capacity: 100
    },
    {
        id: 2,
        name: "Grand Ballroom",
        capacity: 300
    },
    {
        id: 3,
        name: "Event Hall B",
        capacity: 150
    },
    {
        id: 4,
        name: "Garden Pavilion",
        capacity: 200
    }
];


let events = [
    {
        id: 1,
        customerId: 1,
        hallId: 1,
        eventType: "Corporate Conference",
        eventDate: "2026-08-15",
        startTime: "09:00",
        endTime: "17:00",
        attendees: 90,
        status: "Scheduled"
    },
    {
        id: 2,
        customerId: 2,
        hallId: 2,
        eventType: "Wedding Ceremony",
        eventDate: "2026-08-16",
        startTime: "14:00",
        endTime: "22:00",
        attendees: 250,
        status: "Scheduled"
    },
    {
        id: 3,
        customerId: 4,
        hallId: 3,
        eventType: "Birthday Party",
        eventDate: "2026-08-17",
        startTime: "18:00",
        endTime: "22:00",
        attendees: 40,
        status: "In Progress"
    },
    {
        id: 4,
        customerId: 3,
        hallId: 4,
        eventType: "Product Launch",
        eventDate: "2026-08-18",
        startTime: "10:00",
        endTime: "14:00",
        attendees: 70,
        status: "Scheduled"
    }
];


let resources = [
    {
        id: 1,
        eventId: 1,
        resource: "Projector",
        quantity: 1,
        status: "Assigned"
    },
    {
        id: 2,
        eventId: 1,
        resource: "Chairs",
        quantity: 90,
        status: "Assigned"
    },
    {
        id: 3,
        eventId: 2,
        resource: "Tables",
        quantity: 30,
        status: "Pending"
    },
    {
        id: 4,
        eventId: 2,
        resource: "Sound System",
        quantity: 1,
        status: "Assigned"
    },
    {
        id: 5,
        eventId: 3,
        resource: "Microphones",
        quantity: 4,
        status: "Assigned"
    }
];


let logistics = [
    {
        eventId: 1,
        tasks: {
            "Hall assigned": true,
            "Seating arranged": true,
            "Catering confirmed": false,
            "Audio/Visual equipment": true,
            "Decorations": false
        }
    },
    {
        eventId: 2,
        tasks: {
            "Hall assigned": true,
            "Seating arranged": false,
            "Catering confirmed": true,
            "Audio/Visual equipment": true,
            "Decorations": false
        }
    },
    {
        eventId: 3,
        tasks: {
            "Hall assigned": true,
            "Seating arranged": true,
            "Catering confirmed": true,
            "Audio/Visual equipment": true,
            "Decorations": true
        }
    }
];


let nextEventId = 5;


/* =========================================
   DOM ELEMENTS
========================================= */

const upcomingEventsCount =
    document.getElementById("upcomingEventsCount");

const availableHallsCount =
    document.getElementById("availableHallsCount");

const activeEventsCount =
    document.getElementById("activeEventsCount");

const assignedResourcesCount =
    document.getElementById("assignedResourcesCount");

const hallAvailabilityBody =
    document.getElementById("hallAvailabilityBody");

const eventBookingsBody =
    document.getElementById("eventBookingsBody");

const logisticsGrid =
    document.getElementById("logisticsGrid");

const resourcesBody =
    document.getElementById("resourcesBody");

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


/* =========================================
   HELPER FUNCTIONS
========================================= */

function getCustomerName(customerId) {

    const customer = customers.find(
        customer => customer.id === customerId
    );

    return customer
        ? customer.name
        : "Unknown Customer";
}


function getHall(hallId) {

    return halls.find(
        hall => hall.id === hallId
    );
}


function getHallName(hallId) {

    const hall = getHall(hallId);

    return hall
        ? hall.name
        : "Unknown Hall";
}


function formatDate(dateString) {

    const date = new Date(
        dateString + "T00:00:00"
    );

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

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* =========================================
   DASHBOARD SUMMARY
========================================= */

function renderSummary() {

    const upcoming =
        events.filter(event =>
            event.status === "Scheduled"
        );

    const active =
        events.filter(event =>
            event.status === "In Progress"
        );

    const assigned =
        resources.filter(resource =>
            resource.status === "Assigned"
        );

    upcomingEventsCount.textContent =
        upcoming.length;

    activeEventsCount.textContent =
        active.length;

    assignedResourcesCount.textContent =
        assigned.length;


    /*
       Mock availability:
       A hall is considered available if it
       isn't assigned to an upcoming event.
    */

    const bookedHallIds =
        upcoming.map(event =>
            event.hallId
        );

    const available =
        halls.filter(hall =>
            !bookedHallIds.includes(hall.id)
        );

    availableHallsCount.textContent =
        available.length;
}


/* =========================================
   HALL AVAILABILITY
========================================= */

function renderHallAvailability() {

    hallAvailabilityBody.innerHTML = "";

    halls.forEach(hall => {

        const bookedEvent =
            events.find(event =>
                event.hallId === hall.id &&
                (
                    event.status === "Scheduled" ||
                    event.status === "In Progress"
                )
            );


        const row =
            document.createElement("tr");


        if (bookedEvent) {

            row.innerHTML = `
                <td>
                    <strong>
                        ${hall.name}
                    </strong>
                </td>

                <td>
                    ${hall.capacity}
                </td>

                <td>
                    ${formatDate(bookedEvent.eventDate)}
                </td>

                <td>
                    ${bookedEvent.startTime}
                    -
                    ${bookedEvent.endTime}
                </td>

                <td>
                    <span class="status-badge ${getStatusClass(bookedEvent.status)}">
                        Booked
                    </span>
                </td>
            `;

        } else {

            row.innerHTML = `
                <td>
                    <strong>
                        ${hall.name}
                    </strong>
                </td>

                <td>
                    ${hall.capacity}
                </td>

                <td>
                    —
                </td>

                <td>
                    —
                </td>

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


/* =========================================
   EVENT BOOKINGS
========================================= */

function getFilteredEvents() {

    const search =
        eventSearch.value
            .trim()
            .toLowerCase();

    const status =
        eventStatusFilter.value;


    return events.filter(event => {

        const matchesStatus =
            status === "all" ||
            event.status === status;


        const matchesSearch =
            event.eventType
                .toLowerCase()
                .includes(search) ||

            getCustomerName(event.customerId)
                .toLowerCase()
                .includes(search) ||

            getHallName(event.hallId)
                .toLowerCase()
                .includes(search);


        return matchesStatus &&
               matchesSearch;
    });
}


function renderEvents() {

    eventBookingsBody.innerHTML = "";

    const filtered =
        getFilteredEvents();


    if (filtered.length === 0) {

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

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${event.eventType}
                </strong>
            </td>

            <td>
                ${getCustomerName(event.customerId)}
            </td>

            <td>
                ${getHallName(event.hallId)}
            </td>

            <td>
                ${formatDate(event.eventDate)}
            </td>

            <td>
                ${event.startTime}
                -
                ${event.endTime}
            </td>

            <td>
                ${event.attendees}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(event.status)}"
                >
                    ${event.status}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="action-button"
                    data-action="logistics"
                    data-id="${event.id}"
                >
                    Logistics
                </button>
            </td>
        `;


        eventBookingsBody.appendChild(row);
    });
}


/* =========================================
   LOGISTICS
========================================= */

function renderLogistics() {

    logisticsGrid.innerHTML = "";


    logistics.forEach(item => {

        const event =
            events.find(
                event => event.id === item.eventId
            );


        if (!event) return;


        const card =
            document.createElement("div");

        card.className =
            "logistics-card";


        const taskEntries =
            Object.entries(item.tasks);


        card.innerHTML = `

            <div class="logistics-card-header">

                <div>
                    <h3>
                        ${event.eventType}
                    </h3>

                    <p>
                        ${getHallName(event.hallId)}
                        ·
                        ${formatDate(event.eventDate)}
                    </p>
                </div>

                <span
                    class="status-badge ${getStatusClass(event.status)}"
                >
                    ${event.status}
                </span>

            </div>


            <div class="logistics-tasks">

                ${taskEntries.map(
                    ([task, complete]) => `
                        <label class="logistics-task">

                            <input
                                type="checkbox"
                                data-event-id="${event.id}"
                                data-task="${task}"
                                ${complete ? "checked" : ""}
                            >

                            <span>
                                ${task}
                            </span>

                        </label>
                    `
                ).join("")}

            </div>
        `;


        logisticsGrid.appendChild(card);
    });
}


/* =========================================
   FACILITY RESOURCES
========================================= */

function renderResources() {

    resourcesBody.innerHTML = "";


    resources.forEach(resource => {

        const event =
            events.find(
                event => event.id === resource.eventId
            );


        if (!event) return;


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${event.eventType}
            </td>

            <td>
                ${resource.resource}
            </td>

            <td>
                ${resource.quantity}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(resource.status)}"
                >
                    ${resource.status}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="action-button"
                    data-resource-id="${resource.id}"
                >
                    ${
                        resource.status === "Assigned"
                            ? "Unassign"
                            : "Assign"
                    }
                </button>

            </td>
        `;


        resourcesBody.appendChild(row);
    });
}


/* =========================================
   POPULATE FORM
========================================= */

function populateFormOptions() {

    const customerSelect =
        document.getElementById("customerName");

    const hallSelect =
        document.getElementById("hallName");


    customers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value =
            customer.id;

        option.textContent =
            customer.name;

        customerSelect.appendChild(option);
    });


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


/* =========================================
   OPEN / CLOSE MODAL
========================================= */

function openEventModal() {

    eventForm.reset();

    eventFormError.textContent = "";

    eventModal.classList.add("open");
}


function closeEventModal() {

    eventModal.classList.remove("open");
}


/* =========================================
   CREATE EVENT
========================================= */

function createEvent() {

    const eventType =
        document
            .getElementById("eventType")
            .value
            .trim();

    const customerId =
        Number(
            document
                .getElementById("customerName")
                .value
        );

    const hallId =
        Number(
            document
                .getElementById("hallName")
                .value
        );

    const eventDate =
        document
            .getElementById("eventDate")
            .value;

    const startTime =
        document
            .getElementById("startTime")
            .value;

    const endTime =
        document
            .getElementById("endTime")
            .value;

    const attendees =
        Number(
            document
                .getElementById("attendees")
                .value
        );


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


    const hall =
        getHall(hallId);


    if (attendees > hall.capacity) {

        eventFormError.textContent =
            `This hall can only accommodate ${hall.capacity} guests.`;

        return;
    }


    const conflict =
        events.some(event => {

            if (
                event.hallId !== hallId ||
                event.eventDate !== eventDate ||
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


    events.push({

        id: nextEventId++,

        customerId,

        hallId,

        eventType,

        eventDate,

        startTime,

        endTime,

        attendees,

        status: "Scheduled"
    });


    closeEventModal();

    renderAll();
}


/* =========================================
   EVENT ACTIONS
========================================= */

eventBookingsBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest("button");

        if (!button) return;


        const eventId =
            Number(
                button.dataset.id
            );


        if (
            button.dataset.action ===
            "logistics"
        ) {

            document
                .getElementById("logistics")
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    }
);


/* =========================================
   RESOURCE ASSIGNMENT
========================================= */

resourcesBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest("button");

        if (!button) return;


        const resourceId =
            Number(
                button.dataset.resourceId
            );


        const resource =
            resources.find(
                item => item.id === resourceId
            );


        if (!resource) return;


        resource.status =
            resource.status === "Assigned"
                ? "Pending"
                : "Assigned";


        renderAll();
    }
);


/* =========================================
   LOGISTICS CHECKBOXES
========================================= */

logisticsGrid.addEventListener(
    "change",
    event => {

        if (
            event.target.type !==
            "checkbox"
        ) {
            return;
        }


        const eventId =
            Number(
                event.target.dataset.eventId
            );

        const task =
            event.target.dataset.task;


        const logisticsItem =
            logistics.find(
                item =>
                    item.eventId === eventId
            );


        if (!logisticsItem) return;


        logisticsItem.tasks[task] =
            event.target.checked;
    }
);


/* =========================================
   EVENT LISTENERS
========================================= */

document
    .getElementById("newEventButton")
    .addEventListener(
        "click",
        openEventModal
    );


document
    .getElementById("closeEventModal")
    .addEventListener(
        "click",
        closeEventModal
    );


document
    .getElementById("cancelEventModal")
    .addEventListener(
        "click",
        closeEventModal
    );


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


eventSearch.addEventListener(
    "input",
    renderEvents
);


eventStatusFilter.addEventListener(
    "change",
    renderEvents
);


eventForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        createEvent();
    }
);


/* =========================================
   RENDER EVERYTHING
========================================= */

function renderAll() {

    renderSummary();

    renderHallAvailability();

    renderEvents();

    renderLogistics();

    renderResources();
}


/* =========================================
   INITIALIZE
========================================= */

populateFormOptions();

renderAll();