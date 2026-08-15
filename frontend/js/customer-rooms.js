/* =========================================
   CUSTOMER ROOMS
   Real database data
========================================= */

const API = "http://localhost:3000/api";

let customerRooms = [];
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

const roomBookingError =
    document.getElementById("roomBookingError");


/* =========================================
   ROOM IMAGES
   One image per ROOM CATEGORY
========================================= */

const categoryImages = {

    Standard:
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=85",

    Deluxe:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=85",

    "Family Room":
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=85",

    Suite:
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=900&q=85",

    Executive:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85"
};


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(amount) {

    return "GHS " +
        Number(amount || 0).toLocaleString(
            "en-GH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


/* =========================================
   NORMALIZE ROOM DATA
   Converts database fields into
   consistent frontend fields.
========================================= */

function normalizeRoom(room) {

    return {

        id:
            room.RoomID ||
            room.roomId ||
            room.id ||
            room.RoomNumber,

        number:
            String(
                room.RoomNumber ||
                room.roomNumber ||
                room.number ||
                ""
            ),

        category:
            room.CategoryName ||
            room.categoryName ||
            room.category ||
            "Room",

        floor:
            Number(
                room.Floor ||
                room.floor ||
                0
            ),

        capacity:
            Number(
                room.MaxOccupants ||
                room.maxOccupants ||
                room.capacity ||
                1
            ),

        price:
            Number(
                room.PricePerNight ||
                room.pricePerNight ||
                room.price ||
                0
            ),

        status:
            room.Status ||
            room.status ||
            "Available"
    };
}


/* =========================================
   LOAD ROOMS FROM DATABASE
========================================= */

async function loadCustomerRooms() {

    try {

        roomGrid.innerHTML = `
            <div class="customer-room-empty">
                <h3>Loading rooms...</h3>
                <p>Please wait.</p>
            </div>
        `;


        const response =
            await fetch(`${API}/rooms`);


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load rooms."
            );
        }


        /*
         * The API may return either:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * or
         *
         * {
         *   rooms: [...]
         * }
         */

        const roomsData =
            Array.isArray(data)
                ? data
                : Array.isArray(data.rooms)
                    ? data.rooms
                    : [];


        customerRooms =
            roomsData.map(normalizeRoom);


        console.log(
            "Customer rooms loaded:",
            customerRooms
        );


        populateCategoryFilter();

        renderRooms();


    } catch (error) {

        console.error(
            "Customer room loading error:",
            error
        );


        roomGrid.innerHTML = `
            <div class="customer-room-empty">
                <h3>Unable to load rooms</h3>
                <p>
                    Please refresh the page and try again.
                </p>
            </div>
        `;
    }
}


/* =========================================
   POPULATE CATEGORY FILTER
========================================= */

function populateCategoryFilter() {

    if (!roomCategoryFilter) {
        return;
    }


    const currentValue =
        roomCategoryFilter.value || "all";


    const categories =
        [
            ...new Set(
                customerRooms.map(
                    room => room.category
                )
            )
        ]
        .sort();


    roomCategoryFilter.innerHTML = `
        <option value="all">
            All room types
        </option>
    `;


    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        roomCategoryFilter.appendChild(option);

    });


    /*
     * Keep previous selection if it
     * still exists.
     */

    if (
        categories.includes(currentValue)
    ) {

        roomCategoryFilter.value =
            currentValue;

    } else {

        roomCategoryFilter.value = "all";
    }
}


/* =========================================
   GROUP ROOMS BY CATEGORY
========================================= */

function groupRoomsByCategory(rooms) {

    const groups = {};


    rooms.forEach(room => {

        const key =
            room.category.trim();


        if (!groups[key]) {

            groups[key] = [];

        }


        groups[key].push(room);

    });


    return Object.values(groups);
}


/* =========================================
   ROOM TITLE
   Prevents "Family Room Room"
========================================= */

function getRoomTitle(category) {

    const cleanCategory =
        String(category || "Room").trim();


    if (
        cleanCategory
            .toLowerCase()
            .endsWith("room")
    ) {

        return cleanCategory;

    }


    return `${cleanCategory} Room`;
}


/* =========================================
   GET CATEGORY IMAGE
========================================= */

function getCategoryImage(category) {

    if (
        categoryImages[category]
    ) {

        return categoryImages[category];

    }


    /*
     * Case-insensitive fallback.
     */

    const matchingKey =
        Object.keys(categoryImages)
            .find(
                key =>
                    key.toLowerCase() ===
                    String(category)
                        .toLowerCase()
            );


    return (
        categoryImages[matchingKey] ||
        categoryImages.Standard
    );
}


/* =========================================
   RENDER ROOMS
========================================= */

function renderRooms() {

    if (!roomGrid) {
        return;
    }


    const search =
        roomSearchInput
            ? roomSearchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedCategory =
        roomCategoryFilter
            ? roomCategoryFilter.value
            : "all";


    /*
     * First filter the real database rooms.
     */

    const filteredRooms =
        customerRooms.filter(room => {

            const matchesSearch =

                !search ||

                room.number
                    .toLowerCase()
                    .includes(search)

                ||

                room.category
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =

                selectedCategory === "all"

                ||

                room.category ===
                    selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    /*
     * Group the rooms so the customer
     * sees one card per room type.
     */

    const groups =
        groupRoomsByCategory(
            filteredRooms
        );


    roomGrid.innerHTML = "";


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (groups.length === 0) {

        roomGrid.innerHTML = `
            <div class="customer-room-empty">
                <h3>No rooms found</h3>
                <p>
                    Try changing your search
                    or room type.
                </p>
            </div>
        `;

        return;
    }


    /* =========================================
       CATEGORY CARDS
    ========================================= */

    groups.forEach(group => {

        const category =
            group[0].category;


        const availableRooms =
            group.filter(
                room =>
                    String(room.status)
                        .toLowerCase() ===
                    "available"
            );


        /*
         * Use the lowest price for the
         * category. Normally all rooms
         * in the same category have the
         * same price.
         */

        const price =
            Math.min(
                ...group.map(
                    room => room.price
                )
            );


        const maxCapacity =
            Math.max(
                ...group.map(
                    room => room.capacity
                )
            );


        const image =
            getCategoryImage(category);


        const title =
            getRoomTitle(category);


        const card =
            document.createElement("div");


        card.className =
            "customer-room-card";


        card.innerHTML = `

            <div class="customer-room-image">

                <img
                    src="${image}"
                    alt="${title}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                    "
                >

            </div>


            <div class="customer-room-content">


                <div class="customer-room-top">

                    <h3>
                        ${title}
                    </h3>

                    <span class="room-available">

                        ${
                            availableRooms.length > 0
                                ? "Available"
                                : "Unavailable"
                        }

                    </span>

                </div>


                <span class="customer-room-number">

                    ${
                        group.length === 1
                            ? "1 room available"
                            : `${group.length} rooms available`
                    }

                </span>


                <div class="customer-room-info">

                    <span>
                        👤 Up to ${maxCapacity} Guests
                    </span>

                    <span>

                        ${
                            availableRooms.length
                        }
                        available

                    </span>

                </div>


                <div class="customer-room-price">

                    <div>

                        <strong>
                            ${formatMoney(price)}
                        </strong>

                        <span>
                            per night
                        </span>

                    </div>


                    <button
                        type="button"
                        class="primary-button"
                        data-category="${category}"
                        ${
                            availableRooms.length === 0
                                ? "disabled"
                                : ""
                        }
                    >
                        ${
                            availableRooms.length > 0
                                ? "Book Room"
                                : "Unavailable"
                        }
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

function openBookingModal(category) {

    /*
     * Find an AVAILABLE room in this category.
     */

    selectedRoom =
        customerRooms.find(room =>

            room.category === category &&

            String(room.status)
                .toLowerCase() ===
                "available"

        );


    if (!selectedRoom) {

        alert(
            "There are no available rooms in this category."
        );

        return;
    }


    document.getElementById(
        "selectedRoomId"
    ).value =
        selectedRoom.id;


    document.getElementById(
        "selectedRoomName"
    ).textContent =
        getRoomTitle(
            selectedRoom.category
        );


    document.getElementById(
        "selectedRoomDetails"
    ).textContent =

        `Room ${selectedRoom.number} · ` +
        `Up to ${selectedRoom.capacity} guests`;


    document.getElementById(
        "selectedRoomPrice"
    ).textContent =

        formatMoney(
            selectedRoom.price
        ) +
        " / night";


    numberOfGuests.max =
        selectedRoom.capacity;


    numberOfGuests.value = 1;


    checkInDate.value = "";

    checkOutDate.value = "";


    bookingTotal.textContent =
        formatMoney(0);


    if (roomBookingError) {

        roomBookingError.textContent = "";

    }


    roomBookingModal.classList.add("show");
}


/* =========================================
   CLOSE BOOKING MODAL
========================================= */

function closeBookingModal() {

    if (roomBookingModal) {

        roomBookingModal.classList.remove(
            "show"
        );

    }


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
        nights *
        selectedRoom.price;


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
                "[data-category]"
            );


        if (!button) {
            return;
        }


        if (button.disabled) {
            return;
        }


        const category =
            button.dataset.category;


        openBookingModal(category);

    }
);


/* =========================================
   SEARCH
========================================= */

if (roomSearchInput) {

    roomSearchInput.addEventListener(
        "input",
        renderRooms
    );

}


/* =========================================
   CATEGORY FILTER
========================================= */

if (roomCategoryFilter) {

    roomCategoryFilter.addEventListener(
        "change",
        renderRooms
    );

}


/* =========================================
   DATE CHANGES
========================================= */

if (checkInDate) {

    checkInDate.addEventListener(
        "change",
        calculateTotal
    );

}


if (checkOutDate) {

    checkOutDate.addEventListener(
        "change",
        calculateTotal
    );

}


/* =========================================
   CLOSE BUTTON
========================================= */

const closeButton =
    document.getElementById(
        "closeRoomBookingModal"
    );


if (closeButton) {

    closeButton.addEventListener(
        "click",
        closeBookingModal
    );

}


/* =========================================
   CANCEL BUTTON
========================================= */

const cancelButton =
    document.getElementById(
        "cancelRoomBooking"
    );


if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        closeBookingModal
    );

}


/* =========================================
   CLOSE MODAL OUTSIDE
========================================= */

if (roomBookingModal) {

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

}


/* =========================================
   BOOKING SUBMISSION
========================================= */

if (roomBookingForm) {

    roomBookingForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const error =
                roomBookingError ||
                document.getElementById(
                    "roomBookingError"
                );


            if (error) {

                error.textContent = "";

            }


            /* -------------------------------
               ROOM CHECK
            -------------------------------- */

            if (!selectedRoom) {

                if (error) {

                    error.textContent =
                        "Please select a room.";

                }

                return;
            }


            /* -------------------------------
               DATE VALIDATION
            -------------------------------- */

            if (
                !checkInDate.value ||
                !checkOutDate.value
            ) {

                if (error) {

                    error.textContent =
                        "Please select your check-in and check-out dates.";

                }

                return;
            }


            const start =
                new Date(
                    checkInDate.value
                );


            const end =
                new Date(
                    checkOutDate.value
                );


            if (end <= start) {

                if (error) {

                    error.textContent =
                        "Check-out date must be after check-in date.";

                }

                return;
            }


            /* -------------------------------
               GUEST VALIDATION
            -------------------------------- */

            const guests =
                Number(
                    numberOfGuests.value
                );


            if (
                !Number.isInteger(guests) ||
                guests < 1 ||
                guests > selectedRoom.capacity
            ) {

                if (error) {

                    error.textContent =
                        `This room allows a maximum of ${selectedRoom.capacity} guests.`;

                }

                return;
            }


            /* -------------------------------
               AUTHENTICATION
            -------------------------------- */

            const token =
                localStorage.getItem("token");


            if (!token) {

                if (error) {

                    error.textContent =
                        "You are not logged in. Please log in again.";

                }

                return;
            }


            /* -------------------------------
               DISABLE SUBMIT
            -------------------------------- */

            const submitButton =
                roomBookingForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "Booking...";

            }


            /* -------------------------------
               SEND RESERVATION
            -------------------------------- */

            try {

                const response =
                    await fetch(
                        `${API}/reservations`,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({

                                    RoomNumber:
                                        selectedRoom.number,

                                    CheckInDate:
                                        checkInDate.value,

                                    CheckOutDate:
                                        checkOutDate.value,

                                    NumOccupants:
                                        guests

                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Unable to complete the reservation."
                    );

                }


                /* -------------------------------
                   SUCCESS
                -------------------------------- */

                alert(
                    data.message ||
                    "Reservation created successfully!"
                );


                closeBookingModal();


                /*
                 * Reload rooms so the
                 * latest availability is shown.
                 */

                await loadCustomerRooms();


            } catch (errorObject) {

                console.error(
                    "Booking error:",
                    errorObject
                );


                if (error) {

                    error.textContent =
                        errorObject.message ||
                        "Could not complete the booking.";

                }

            } finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        "Confirm Booking";

                }

            }

        }
    );

}


/* =========================================
   INITIAL LOAD
========================================= */

loadCustomerRooms();
