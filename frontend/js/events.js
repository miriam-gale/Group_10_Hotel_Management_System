const customerOptions = [
    { id: 1, name: "Kwame Mensah" },
    { id: 2, name: "Akosua Boateng" },
    { id: 3, name: "James Anderson" },
    { id: 4, name: "Ama Serwaa" },
    { id: 5, name: "Michael Owusu" }
];

const hallOptions = [
    { id: 1, name: "Conference Hall A" },
    { id: 2, name: "Grand Ballroom" },
    { id: 3, name: "Event Hall B" },
    { id: 4, name: "Garden Pavilion" }
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
        expectedAttendees: 90,
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
        expectedAttendees: 250,
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
        expectedAttendees: 40,
        status: "Scheduled"
    },
    {
        id: 4,
        customerId: 3,
        hallId: 1,
        eventType: "Product Launch",
        eventDate: "2026-07-20",
        startTime: "10:00",
        endTime: "14:00",
        expectedAttendees: 70,
        status: "Completed"
    }
];

let nextEventId = 5;
let eventModalMode = "add";
let editingEventId = null;

const eventTableBody = document.getElementById("eventTableBody");
const eventSearch = document.getElementById("eventSearch");
const eventStatusFilter = document.getElementById("eventStatusFilter");
const eventModal = document.getElementById("eventModal");
const eventForm = document.getElementById("eventForm");
const eventFormError = document.getElementById("eventFormError");
const eventModalTitle = document.getElementById("eventModalTitle");
const customerSelect = document.getElementById("customerId");
const hallSelect = document.getElementById("hallId");

function getEvents() {
    return events;
}

function createEvent(data) {
    const eventItem = {
        id: nextEventId,
        customerId: data.customerId,
        hallId: data.hallId,
        eventType: data.eventType,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        expectedAttendees: data.expectedAttendees,
        status: data.status
    };

    nextEventId = nextEventId + 1;
    events.push(eventItem);
    return eventItem;
}

function updateEvent(id, data) {
    const eventItem = events.find(function (item) {
        return item.id === id;
    });

    if (!eventItem) {
        return;
    }

    eventItem.customerId = data.customerId;
    eventItem.hallId = data.hallId;
    eventItem.eventType = data.eventType;
    eventItem.eventDate = data.eventDate;
    eventItem.startTime = data.startTime;
    eventItem.endTime = data.endTime;
    eventItem.expectedAttendees = data.expectedAttendees;
    eventItem.status = data.status;
}

function cancelEvent(id) {
    const eventItem = events.find(function (item) {
        return item.id === id;
    });

    if (!eventItem) {
        return;
    }

    eventItem.status = "Cancelled";
}

function getCustomerName(id) {
    const customer = customerOptions.find(function (item) {
        return item.id === id;
    });
    return customer ? customer.name : "Customer #" + id;
}

function getHallName(id) {
    const hall = hallOptions.find(function (item) {
        return item.id === id;
    });
    return hall ? hall.name : "Hall #" + id;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function fillSelects() {
    customerSelect.innerHTML = "";
    hallSelect.innerHTML = "";

    customerOptions.forEach(function (customer) {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.name;
        customerSelect.appendChild(option);
    });

    hallOptions.forEach(function (hall) {
        const option = document.createElement("option");
        option.value = hall.id;
        option.textContent = hall.name;
        hallSelect.appendChild(option);
    });
}

function getFilteredEvents() {
    const search = eventSearch.value.trim().toLowerCase();
    const status = eventStatusFilter.value;
    let list = getEvents();

    if (status !== "all") {
        list = list.filter(function (eventItem) {
            return eventItem.status === status;
        });
    }

    if (search === "") {
        return list;
    }

    return list.filter(function (eventItem) {
        const customerName = getCustomerName(eventItem.customerId).toLowerCase();
        const hallName = getHallName(eventItem.hallId).toLowerCase();
        return eventItem.eventType.toLowerCase().indexOf(search) !== -1
            || customerName.indexOf(search) !== -1
            || hallName.indexOf(search) !== -1;
    });
}

function statusBadgeClass(status) {
    return status.toLowerCase();
}

function renderEvents() {
    const list = getFilteredEvents();
    eventTableBody.innerHTML = "";

    if (list.length === 0) {
        eventTableBody.innerHTML = '<tr class="empty-row"><td colspan="8">No events found.</td></tr>';
        return;
    }

    list.forEach(function (eventItem) {
        const cancelButton = eventItem.status === "Cancelled"
            ? ""
            : '<button type="button" class="action-button danger" data-action="cancel" data-id="' + eventItem.id + '">Cancel</button>';

        const row = document.createElement("tr");
        row.innerHTML =
            "<td>" + eventItem.eventType + "</td>" +
            "<td>" + getCustomerName(eventItem.customerId) + "</td>" +
            "<td>" + getHallName(eventItem.hallId) + "</td>" +
            "<td>" + formatDate(eventItem.eventDate) + "</td>" +
            "<td>" + eventItem.startTime + " - " + eventItem.endTime + "</td>" +
            "<td>" + eventItem.expectedAttendees + "</td>" +
            '<td><span class="status-badge ' + statusBadgeClass(eventItem.status) + '">' + eventItem.status + "</span></td>" +
            "<td>" +
                '<button type="button" class="action-button" data-action="edit" data-id="' + eventItem.id + '">Edit</button>' +
                cancelButton +
            "</td>";
        eventTableBody.appendChild(row);
    });
}

function fillEventForm(eventItem) {
    document.getElementById("eventType").value = eventItem ? eventItem.eventType : "";
    document.getElementById("customerId").value = eventItem ? String(eventItem.customerId) : String(customerOptions[0].id);
    document.getElementById("hallId").value = eventItem ? String(eventItem.hallId) : String(hallOptions[0].id);
    document.getElementById("eventDate").value = eventItem ? eventItem.eventDate : "";
    document.getElementById("startTime").value = eventItem ? eventItem.startTime : "";
    document.getElementById("endTime").value = eventItem ? eventItem.endTime : "";
    document.getElementById("expectedAttendees").value = eventItem ? eventItem.expectedAttendees : "";
    document.getElementById("eventStatus").value = eventItem ? eventItem.status : "Scheduled";
}

function openEventModal(mode, id) {
    eventModalMode = mode;
    editingEventId = id || null;
    eventFormError.textContent = "";

    const eventItem = id
        ? events.find(function (item) { return item.id === id; })
        : null;

    if (mode === "add") {
        eventModalTitle.textContent = "Add Event";
        fillEventForm(null);
    } else {
        eventModalTitle.textContent = "Edit Event";
        fillEventForm(eventItem);
    }

    eventModal.classList.add("open");
}

function closeEventModal() {
    eventModal.classList.remove("open");
}

function getEventFormData() {
    return {
        eventType: document.getElementById("eventType").value.trim(),
        customerId: Number(document.getElementById("customerId").value),
        hallId: Number(document.getElementById("hallId").value),
        eventDate: document.getElementById("eventDate").value,
        startTime: document.getElementById("startTime").value,
        endTime: document.getElementById("endTime").value,
        expectedAttendees: Number(document.getElementById("expectedAttendees").value),
        status: document.getElementById("eventStatus").value
    };
}

function validateEvent(data) {
    if (data.eventType === "") {
        return "Event type is required.";
    }

    if (!data.customerId) {
        return "Customer is required.";
    }

    if (!data.hallId) {
        return "Hall is required.";
    }

    if (data.eventDate === "") {
        return "Event date is required.";
    }

    if (data.startTime === "") {
        return "Start time is required.";
    }

    if (data.endTime === "") {
        return "End time is required.";
    }

    if (data.endTime <= data.startTime) {
        return "End time must be later than start time.";
    }

    if (!data.expectedAttendees || data.expectedAttendees <= 0) {
        return "Expected attendees must be greater than 0.";
    }

    if (data.status === "") {
        return "Status is required.";
    }

    return "";
}

document.getElementById("addEventButton").addEventListener("click", function () {
    openEventModal("add");
});

document.getElementById("closeEventModal").addEventListener("click", closeEventModal);
document.getElementById("cancelEventModal").addEventListener("click", closeEventModal);

eventModal.addEventListener("click", function (event) {
    if (event.target === eventModal) {
        closeEventModal();
    }
});

eventSearch.addEventListener("input", renderEvents);
eventStatusFilter.addEventListener("change", renderEvents);

eventTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const id = Number(button.getAttribute("data-id"));
    const action = button.getAttribute("data-action");

    if (action === "edit") {
        openEventModal("edit", id);
    }

    if (action === "cancel") {
        const confirmed = window.confirm("Cancel this event?");
        if (confirmed) {
            cancelEvent(id);
            renderEvents();
        }
    }
});

eventForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = getEventFormData();
    const error = validateEvent(data);

    if (error !== "") {
        eventFormError.textContent = error;
        return;
    }

    if (eventModalMode === "add") {
        createEvent(data);
    } else {
        updateEvent(editingEventId, data);
    }

    closeEventModal();
    renderEvents();
});

fillSelects();
renderEvents();
