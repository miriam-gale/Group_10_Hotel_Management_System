let halls = [
    {
        id: 1,
        hallName: "Conference Hall A",
        capacity: 120,
        bookingPricePerHour: 350,
        description: "Fitted with projector and conference seating.",
        isAvailable: true
    },
    {
        id: 2,
        hallName: "Grand Ballroom",
        capacity: 300,
        bookingPricePerHour: 800,
        description: "Large hall for weddings and gala dinners.",
        isAvailable: true
    },
    {
        id: 3,
        hallName: "Event Hall B",
        capacity: 80,
        bookingPricePerHour: 250,
        description: "Suitable for parties and small gatherings.",
        isAvailable: false
    },
    {
        id: 4,
        hallName: "Garden Pavilion",
        capacity: 60,
        bookingPricePerHour: 200,
        description: "Outdoor-covered space for receptions.",
        isAvailable: true
    }
];

let nextHallId = 5;
let hallModalMode = "add";
let editingHallId = null;

const hallTableBody = document.getElementById("hallTableBody");
const hallSearch = document.getElementById("hallSearch");
const hallAvailabilityFilter = document.getElementById("hallAvailabilityFilter");
const hallModal = document.getElementById("hallModal");
const hallForm = document.getElementById("hallForm");
const hallFormError = document.getElementById("hallFormError");
const hallModalTitle = document.getElementById("hallModalTitle");

function getHalls() {
    return halls;
}

function createHall(data) {
    const hall = {
        id: nextHallId,
        hallName: data.hallName,
        capacity: data.capacity,
        bookingPricePerHour: data.bookingPricePerHour,
        description: data.description,
        isAvailable: data.isAvailable
    };

    nextHallId = nextHallId + 1;
    halls.push(hall);
    return hall;
}

function updateHall(id, data) {
    const hall = halls.find(function (item) {
        return item.id === id;
    });

    if (!hall) {
        return;
    }

    hall.hallName = data.hallName;
    hall.capacity = data.capacity;
    hall.bookingPricePerHour = data.bookingPricePerHour;
    hall.description = data.description;
    hall.isAvailable = data.isAvailable;
}

function formatMoney(amount) {
    return "GH₵ " + Number(amount).toLocaleString();
}

function getFilteredHalls() {
    const search = hallSearch.value.trim().toLowerCase();
    const availability = hallAvailabilityFilter.value;
    let list = getHalls();

    if (availability === "available") {
        list = list.filter(function (hall) {
            return hall.isAvailable === true;
        });
    }

    if (availability === "unavailable") {
        list = list.filter(function (hall) {
            return hall.isAvailable === false;
        });
    }

    if (search === "") {
        return list;
    }

    return list.filter(function (hall) {
        return hall.hallName.toLowerCase().indexOf(search) !== -1
            || hall.description.toLowerCase().indexOf(search) !== -1;
    });
}

function renderHalls() {
    const list = getFilteredHalls();
    hallTableBody.innerHTML = "";

    if (list.length === 0) {
        hallTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">No halls found.</td></tr>';
        return;
    }

    list.forEach(function (hall) {
        const availabilityLabel = hall.isAvailable ? "Available" : "Unavailable";
        const availabilityClass = hall.isAvailable ? "available" : "unavailable";
        const toggleLabel = hall.isAvailable ? "Set Unavailable" : "Set Available";

        const row = document.createElement("tr");
        row.innerHTML =
            "<td>" + hall.hallName + "</td>" +
            "<td>" + hall.capacity + "</td>" +
            "<td>" + formatMoney(hall.bookingPricePerHour) + "</td>" +
            "<td>" + hall.description + "</td>" +
            '<td><span class="status-badge ' + availabilityClass + '">' + availabilityLabel + "</span></td>" +
            "<td>" +
                '<button type="button" class="action-button" data-action="edit" data-id="' + hall.id + '">Edit</button>' +
                '<button type="button" class="action-button" data-action="toggle" data-id="' + hall.id + '">' + toggleLabel + "</button>" +
            "</td>";
        hallTableBody.appendChild(row);
    });
}

function fillHallForm(hall) {
    document.getElementById("hallName").value = hall ? hall.hallName : "";
    document.getElementById("capacity").value = hall ? hall.capacity : "";
    document.getElementById("bookingPricePerHour").value = hall ? hall.bookingPricePerHour : "";
    document.getElementById("description").value = hall ? hall.description : "";
    document.getElementById("isAvailable").value = hall ? String(hall.isAvailable) : "true";
}

function openHallModal(mode, id) {
    hallModalMode = mode;
    editingHallId = id || null;
    hallFormError.textContent = "";

    const hall = id
        ? halls.find(function (item) { return item.id === id; })
        : null;

    if (mode === "add") {
        hallModalTitle.textContent = "Add Hall";
        fillHallForm(null);
    } else {
        hallModalTitle.textContent = "Edit Hall";
        fillHallForm(hall);
    }

    hallModal.classList.add("open");
}

function closeHallModal() {
    hallModal.classList.remove("open");
}

function getHallFormData() {
    return {
        hallName: document.getElementById("hallName").value.trim(),
        capacity: Number(document.getElementById("capacity").value),
        bookingPricePerHour: Number(document.getElementById("bookingPricePerHour").value),
        description: document.getElementById("description").value.trim(),
        isAvailable: document.getElementById("isAvailable").value === "true"
    };
}

function validateHall(data) {
    if (data.hallName === "") {
        return "Hall name is required.";
    }

    const capacityRaw = document.getElementById("capacity").value.trim();
    const priceRaw = document.getElementById("bookingPricePerHour").value.trim();

    if (capacityRaw === "" || data.capacity <= 0) {
        return "Capacity must be greater than 0.";
    }

    if (priceRaw === "" || isNaN(data.bookingPricePerHour) || data.bookingPricePerHour < 0) {
        return "Booking price per hour must be 0 or more.";
    }

    if (data.description === "") {
        return "Description is required.";
    }

    return "";
}

document.getElementById("addHallButton").addEventListener("click", function () {
    openHallModal("add");
});

document.getElementById("closeHallModal").addEventListener("click", closeHallModal);
document.getElementById("cancelHallModal").addEventListener("click", closeHallModal);

hallModal.addEventListener("click", function (event) {
    if (event.target === hallModal) {
        closeHallModal();
    }
});

hallSearch.addEventListener("input", renderHalls);
hallAvailabilityFilter.addEventListener("change", renderHalls);

hallTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const id = Number(button.getAttribute("data-id"));
    const action = button.getAttribute("data-action");

    if (action === "edit") {
        openHallModal("edit", id);
    }

    if (action === "toggle") {
        const hall = halls.find(function (item) {
            return item.id === id;
        });

        if (hall) {
            updateHall(id, {
                hallName: hall.hallName,
                capacity: hall.capacity,
                bookingPricePerHour: hall.bookingPricePerHour,
                description: hall.description,
                isAvailable: !hall.isAvailable
            });
            renderHalls();
        }
    }
});

hallForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = getHallFormData();
    const error = validateHall(data);

    if (error !== "") {
        hallFormError.textContent = error;
        return;
    }

    if (hallModalMode === "add") {
        createHall(data);
    } else {
        updateHall(editingHallId, data);
    }

    closeHallModal();
    renderHalls();
});

renderHalls();
