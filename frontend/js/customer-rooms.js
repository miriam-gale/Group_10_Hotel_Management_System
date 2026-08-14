/* =========================================
   CUSTOMER ROOMS
   Room data for customer frontend
========================================= */

const customerRooms = [
    {
        id: 201,
        number: "201",
        category: "Standard",
        floor: 2,
        capacity: 2,
        price: 500,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 204,
        number: "204",
        category: "Deluxe",
        floor: 2,
        capacity: 2,
        price: 800,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 301,
        number: "301",
        category: "Executive",
        floor: 3,
        capacity: 3,
        price: 1200,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 305,
        number: "305",
        category: "Suite",
        floor: 3,
        capacity: 4,
        price: 1800,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 401,
        number: "401",
        category: "Deluxe",
        floor: 4,
        capacity: 2,
        price: 850,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 405,
        number: "405",
        category: "Suite",
        floor: 4,
        capacity: 4,
        price: 2000,
        status: "Available",
        image:
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85"
    }
];


/* =========================================
   STATE
========================================= */

let selectedRoom = null;


/* =========================================
   DOM ELEMENTS
========================================= */

const roomGrid =
    document.getElementById("customerRoomGrid");

const roomSearchInput =
    document.getElementById("roomSearchInput");

const roomCategoryFilter =
    document.getElementById("roomCategoryFilter");

const roomBookingModal =
    document.getElementById("roomBookingModal");

const roomBookingForm =
    document.getElementById("roomBookingForm");

const checkInDate =
    document.getElementById("checkInDate");

const checkOutDate =
    document.getElementById("checkOutDate");

const numberOfGuests =
    document.getElementById("numberOfGuests");

const bookingTotal =
    document.getElementById("bookingTotal");


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(amount) {

    return "GHS " +
        Number(amount).toLocaleString(
            "en-GH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


/* =========================================
   RENDER ROOMS
========================================= */

function renderRooms() {

    const search =
        roomSearchInput.value
            .trim()
            .toLowerCase();

    const category =
        roomCategoryFilter.value;


    const filteredRooms =
        customerRooms.filter(function (room) {

            const matchesSearch =
                room.number
                    .toLowerCase()
                    .includes(search)
                ||
                room.category
                    .toLowerCase()
                    .includes(search);

            const matchesCategory =
                category === "all"
                ||
                room.category === category;

            return matchesSearch && matchesCategory;

        });


    roomGrid.innerHTML = "";


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (filteredRooms.length === 0) {

        roomGrid.innerHTML = `
            <div class="customer-room-empty">
                <h3>No rooms found</h3>
                <p>
                    Try changing your search or room type.
                </p>
            </div>
        `;

        return;
    }


    /* =========================================
       ROOM CARDS
    ========================================= */

    filteredRooms.forEach(function (room) {

        const card =
            document.createElement("div");

        card.className =
            "customer-room-card";


        card.innerHTML = `

            <div class="customer-room-image">

                <img
                    src="${room.image}"
                    alt="${room.category} Room ${room.number}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >

            </div>


            <div class="customer-room-content">

                <div class="customer-room-top">

                    <h3>
                        ${room.category} Room
                    </h3>

                    <span class="room-available">
                        ${room.status}
                    </span>

                </div>


                <span class="customer-room-number">
                    Room ${room.number} · Floor ${room.floor}
                </span>


                <div class="customer-room-info">

                    <span>
                        👤 ${room.capacity} Guests
                    </span>

                    <span>
                        ✓ Available
                    </span>

                </div>


                <div class="customer-room-price">

                    <div>

                        <strong>
                            ${formatMoney(room.price)}
                        </strong>

                        <span>
                            per night
                        </span>

                    </div>


                    <button
                        type="button"
                        class="primary-button"
                        data-room-id="${room.id}"
                    >
                        Book Room
                    </button>

                </div>

            </div>
        `;


        roomGrid.appendChild(card);

    });

}


/* =========================================
   OPEN BOOKING MODAL
========================================= */

function openBookingModal(roomId) {

    selectedRoom =
        customerRooms.find(function (room) {
            return room.id === roomId;
        });


    if (!selectedRoom) {
        return;
    }


    document.getElementById(
        "selectedRoomId"
    ).value = selectedRoom.id;


    document.getElementById(
        "selectedRoomName"
    ).textContent =
        selectedRoom.category + " Room";


    document.getElementById(
        "selectedRoomDetails"
    ).textContent =
        "Room " +
        selectedRoom.number +
        " · Up to " +
        selectedRoom.capacity +
        " guests";


    document.getElementById(
        "selectedRoomPrice"
    ).textContent =
        formatMoney(selectedRoom.price) +
        " / night";


    numberOfGuests.max =
        selectedRoom.capacity;

    numberOfGuests.value = 1;


    checkInDate.value = "";
    checkOutDate.value = "";


    bookingTotal.textContent =
        formatMoney(0);


    document.getElementById(
        "roomBookingError"
    ).textContent = "";


    roomBookingModal.classList.add("show");

}


/* =========================================
   CLOSE BOOKING MODAL
========================================= */

function closeBookingModal() {

    roomBookingModal.classList.remove("show");

    selectedRoom = null;

}


/* =========================================
   CALCULATE BOOKING TOTAL
========================================= */

function calculateTotal() {

    if (!selectedRoom) {
        return;
    }


    if (
        !checkInDate.value ||
        !checkOutDate.value
    ) {

        bookingTotal.textContent =
            formatMoney(0);

        return;
    }


    const start =
        new Date(checkInDate.value);

    const end =
        new Date(checkOutDate.value);


    const difference =
        end - start;


    const nights =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (nights <= 0) {

        bookingTotal.textContent =
            formatMoney(0);

        return;
    }


    const total =
        nights * selectedRoom.price;


    bookingTotal.textContent =
        formatMoney(total);

}


/* =========================================
   ROOM CARD CLICK
========================================= */

roomGrid.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-room-id]"
            );


        if (!button) {
            return;
        }


        const roomId =
            Number(
                button.dataset.roomId
            );


        openBookingModal(roomId);

    }
);


/* =========================================
   SEARCH
========================================= */

roomSearchInput.addEventListener(
    "input",
    renderRooms
);


/* =========================================
   CATEGORY FILTER
========================================= */

roomCategoryFilter.addEventListener(
    "change",
    renderRooms
);


/* =========================================
   DATE CHANGES
========================================= */

checkInDate.addEventListener(
    "change",
    calculateTotal
);


checkOutDate.addEventListener(
    "change",
    calculateTotal
);


/* =========================================
   CLOSE BUTTON
========================================= */

document
    .getElementById("closeRoomBookingModal")
    .addEventListener(
        "click",
        closeBookingModal
    );


/* =========================================
   CANCEL BUTTON
========================================= */

document
    .getElementById("cancelRoomBooking")
    .addEventListener(
        "click",
        closeBookingModal
    );


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

roomBookingModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            roomBookingModal
        ) {

            closeBookingModal();

        }

    }
);


/* =========================================
   BOOKING SUBMISSION
========================================= */

roomBookingForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const error =
            document.getElementById(
                "roomBookingError"
            );


        error.textContent = "";


        if (!selectedRoom) {
            return;
        }


        if (
            !checkInDate.value ||
            !checkOutDate.value
        ) {

            error.textContent =
                "Please select your check-in and check-out dates.";

            return;
        }


        const start =
            new Date(checkInDate.value);

        const end =
            new Date(checkOutDate.value);


        if (end <= start) {

            error.textContent =
                "Check-out date must be after check-in date.";

            return;
        }


        const guests =
            Number(numberOfGuests.value);


        if (
            guests < 1 ||
            guests > selectedRoom.capacity
        ) {

            error.textContent =
                "The number of guests exceeds this room's capacity.";

            return;
        }


        /*
         * MOCK SUBMISSION
         *
         * The backend team will eventually
         * replace this with POST /api/reservations.
         */

        alert(
            "Reservation request submitted successfully!"
        );


        closeBookingModal();

    }
);


/* =========================================
   INITIAL RENDER
========================================= */

renderRooms();