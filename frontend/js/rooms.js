async function loadRoomsFromAPI() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/rooms/all",
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
                data.error || "Unable to load rooms."
            );
        }

        console.log("Real rooms from API:", data);

        return data;

    } catch (error) {

        console.error("Room API error:", error);

        return null;
    }
}


const roomsTableBody = document.getElementById("roomsTableBody");
const roomSearch = document.getElementById("roomSearch");
const roomFilters = document.querySelectorAll(".room-filter");
const roomCount = document.getElementById("roomCount");

const rooms = [];

function getStatusClass(status) {

    if (status === "Under Maintenance") {
        return "maintenance";
    }

    return status.toLowerCase();
}


function renderRooms(roomList) {

    roomsTableBody.innerHTML = "";
    roomCount.textContent =
    `${roomList.length} ${roomList.length === 1 ? "room" : "rooms"}`;

    if (roomList.length === 0) {

        roomsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-room-message">
                    No rooms found.
                </td>
            </tr>
        `;

        return;
    }


    roomList.forEach(room => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>Room ${room.roomNumber}</strong>
            </td>

            <td>${room.category}</td>

            <td>${room.floor}</td>

            <td>${room.maxOccupants}</td>

            <td>
                <span class="room-status ${getStatusClass(room.status)}">
                    ${room.status}
                </span>
            </td>

            <td>
                <div class="room-actions">

    <button
        class="room-action"
        onclick="viewRoom('${room.roomNumber}')"
    >
        View
    </button>

    <button
        class="room-action"
        onclick="editRoom('${room.roomNumber}')"
    >
        Edit
    </button>

    <button
        class="room-action delete-room"
        onclick="deleteRoom('${room.roomNumber}')"
    >
        Delete
    </button>

</div>
            </td>
        `;

        roomsTableBody.appendChild(row);
    });
}


function filterRooms() {

    const activeFilter =
        document.querySelector(".room-filter.active").dataset.status;

    const searchTerm =
        roomSearch.value.toLowerCase().trim();


    const filteredRooms = rooms.filter(room => {

        const matchesStatus =
            activeFilter === "all" ||
            room.status === activeFilter;

        const matchesSearch =
            room.roomNumber.toLowerCase().includes(searchTerm) ||
            room.category.toLowerCase().includes(searchTerm) ||
            room.status.toLowerCase().includes(searchTerm);

        return matchesStatus && matchesSearch;
    });


    renderRooms(filteredRooms);
}


roomFilters.forEach(button => {

    button.addEventListener("click", () => {

        roomFilters.forEach(filter => {
            filter.classList.remove("active");
        });

        button.classList.add("active");

        filterRooms();
    });

});


roomSearch.addEventListener("input", filterRooms);

async function viewRoom(roomNumber) {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
    `http://localhost:3000/api/rooms/${encodeURIComponent(roomNumber)}`,
    {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
);

        const room = await response.json();

        if (!response.ok) {
            throw new Error(
                room.error || "Unable to load room details."
            );
        }

        alert(
            `Room ${room.RoomNumber}\n\n` +
            `Category: ${room.CategoryName}\n` +
            `Description: ${room.Description || "N/A"}\n` +
            `Floor: ${room.Floor}\n` +
            `Maximum Occupants: ${room.MaxOccupants}\n` +
            `Price Per Night: GHS ${room.PricePerNight}\n` +
            `Status: ${room.Status}`
        );

    } catch (error) {

        console.error("View room error:", error);

        alert(
            error.message || "Unable to load room details."
        );
    }
}



async function editRoom(roomNumber) {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const room = rooms.find(
        room => room.roomNumber === roomNumber
    );

    if (!room) {
        alert("Room not found.");
        return;
    }

    const newFloor = prompt(
        `Edit Room ${roomNumber}\n\nEnter new floor:`,
        room.floor
    );

    if (newFloor === null) return;

    const newOccupants = prompt(
        "Enter maximum occupants:",
        room.maxOccupants
    );

    if (newOccupants === null) return;

    const newStatus = prompt(
        "Enter status:\nAvailable\nReserved\nOccupied\nUnder Maintenance",
        room.status
    );

    if (newStatus === null) return;

    try {

        const response = await fetch(
            `http://localhost:3000/api/rooms/${encodeURIComponent(roomNumber)}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    Floor: Number(newFloor),
                    MaxOccupants: Number(newOccupants),
                    Status: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to update room."
            );
        }

        alert(data.message);

        // Reload rooms from database
        const apiRooms = await loadRoomsFromAPI();

        if (!apiRooms) return;

        rooms.length = 0;

        apiRooms.forEach(room => {

            rooms.push({
                roomNumber: String(room.RoomNumber),
                category: room.CategoryName,
                floor: room.Floor,
                maxOccupants: room.MaxOccupants,
                status: room.Status
            });

        });

        renderRooms(rooms);

    } catch (error) {

        console.error("Update room error:", error);

        alert(
            error.message || "Unable to update room."
        );
    }
}

async function deleteRoom(roomNumber) {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete Room ${roomNumber}?`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            `http://localhost:3000/api/rooms/${encodeURIComponent(roomNumber)}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to delete room."
            );
        }

        alert(data.message);

        // Reload rooms from the database
        const apiRooms = await loadRoomsFromAPI();

        if (!apiRooms) return;

        rooms.length = 0;

        apiRooms.forEach(room => {

            rooms.push({
                roomNumber: String(room.RoomNumber),
                category: room.CategoryName,
                floor: room.Floor,
                maxOccupants: room.MaxOccupants,
                status: room.Status
            });

        });

        renderRooms(rooms);

    } catch (error) {

        console.error("Delete room error:", error);

        alert(
            error.message || "Unable to delete room."
        );
    }
}

async function loadRoomCategories() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/rooms/categories"
        );

        const categories = await response.json();

        if (!response.ok) {
            throw new Error(
                categories.error || "Unable to load room categories."
            );
        }

        const categorySelect =
            document.getElementById("roomCategory");

        categorySelect.innerHTML =
            `<option value="">Select category</option>`;

        categories.forEach(category => {

            const option = document.createElement("option");

            option.value = category.CategoryID;
            option.textContent = category.CategoryName;

            categorySelect.appendChild(option);

        });

    } catch (error) {

        console.error("Room category error:", error);

        alert("Unable to load room categories.");
    }
}

loadRoomCategories();

loadRoomsFromAPI().then((apiRooms) => {

    if (!apiRooms) {
        renderRooms([]);
        return;
    }

    rooms.length = 0;

    apiRooms.forEach(room => {

        rooms.push({
            roomNumber: String(room.RoomNumber),
            category: room.CategoryName,
            floor: room.Floor,
            maxOccupants: room.MaxOccupants,
            status: room.Status
        });

    });

    renderRooms(rooms);

});


const roomModal = document.getElementById("roomModal");
const openRoomModal = document.getElementById("openRoomModal");
const closeRoomModal = document.getElementById("closeRoomModal");
const cancelRoomModal = document.getElementById("cancelRoomModal");
const addRoomForm = document.getElementById("addRoomForm");


function showRoomModal() {
    roomModal.classList.add("show");
}


function hideRoomModal() {
    roomModal.classList.remove("show");
}


openRoomModal.addEventListener("click", showRoomModal);

closeRoomModal.addEventListener("click", hideRoomModal);

cancelRoomModal.addEventListener("click", hideRoomModal);


roomModal.addEventListener("click", (event) => {

    if (event.target === roomModal) {
        hideRoomModal();
    }

});


addRoomForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const newRoom = {

        RoomNumber:
            document.getElementById("roomNumber").value.trim(),

        CategoryID:
            Number(document.getElementById("roomCategory").value),

        Floor:
            Number(document.getElementById("roomFloor").value),

        MaxOccupants:
            Number(document.getElementById("maxOccupants").value),

        Status:
            document.getElementById("roomStatus").value

    };

    if (!newRoom.RoomNumber ||
        !newRoom.CategoryID ||
        !newRoom.Floor ||
        !newRoom.MaxOccupants) {

        alert("Please complete all required fields.");
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/rooms",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(newRoom)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to create room."
            );
        }

        alert(data.message);

        addRoomForm.reset();

        hideRoomModal();

        // Reload rooms from the database
        const apiRooms = await loadRoomsFromAPI();

if (!apiRooms) {
    return;
}

rooms.length = 0;

apiRooms.forEach(room => {

    rooms.push({
        roomNumber: String(room.RoomNumber),
        category: room.CategoryName,
        floor: room.Floor,
        maxOccupants: room.MaxOccupants,
        status: room.Status
    });

});

renderRooms(rooms);

        renderRooms(rooms);

    } catch (error) {

        console.error("Add room error:", error);

        alert(error.message || "Unable to create room.");
    }

});
