/* =========================================
   CUSTOMER EVENT HALLS
   Mock data for frontend development
========================================= */

const customerHalls = [
    {
        id: 1,
        name: "Grand Ballroom",
        capacity: 500,
        price: 3500,
        location: "Ground Floor",
        suitableFor: "Weddings, Conferences",
        status: "Available",
       image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80"
    },

    {
        id: 2,
        name: "Royal Conference Hall",
        capacity: 250,
        price: 2800,
        location: "First Floor",
        suitableFor: "Conferences, Meetings",
        status: "Available",
       image: "https://www.tagvenue.com/images/location-pages/1920x1080/907.jpg"
    },

    {
        id: 3,
        name: "Garden Terrace",
        capacity: 150,
        price: 2200,
        location: "Garden Level",
        suitableFor: "Birthdays, Weddings",
        status: "Available",
       image: "https://i1.wp.com/www.genevievenisly.com/wp-content/uploads/2019/10/geis-terrace-reception-cleveland-botanical-gardens-040.jpg?fit=2000%2C1333&ssl=1"
    },

    {
        id: 4,
        name: "Executive Hall",
        capacity: 100,
        price: 1800,
        location: "Second Floor",
        suitableFor: "Meetings, Corporate Events",
        status: "Available",
        image: "https://www.woodstockacresvillaresort.com/Assets/Banner%20VIdeo/banner03.jpg"
    }
];


/* =========================================
   STATE
========================================= */

let selectedHall = null;


/* =========================================
   DOM ELEMENTS
========================================= */

const hallGrid = document.getElementById("customerHallGrid");

const hallSearchInput = document.getElementById("hallSearchInput");

const hallCapacityFilter = document.getElementById("hallCapacityFilter");

const hallBookingModal = document.getElementById("hallBookingModal");

const hallBookingForm = document.getElementById("hallBookingForm");

const eventDate = document.getElementById("eventDate");

const eventStartTime = document.getElementById("eventStartTime");

const eventEndTime = document.getElementById("eventEndTime");

const expectedAttendees = document.getElementById("expectedAttendees");


/* =========================================
   FORMAT MONEY
========================================= */

function formatMoney(amount) {
    return "GHS " + Number(amount).toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================
   RENDER HALLS
========================================= */

function renderHalls() {

    const search = hallSearchInput.value.trim().toLowerCase();

    const capacity = hallCapacityFilter.value;

    const filteredHalls = customerHalls.filter(function (hall) {

        const matchesSearch =
            hall.name.toLowerCase().includes(search) ||
            hall.suitableFor.toLowerCase().includes(search);


        let matchesCapacity = true;


        if (capacity === "100") {
            matchesCapacity = hall.capacity <= 100;
        }

        if (capacity === "250") {
            matchesCapacity = hall.capacity <= 250;
        }

        if (capacity === "500") {
            matchesCapacity = hall.capacity <= 500;
        }

        if (capacity === "1000") {
            matchesCapacity = hall.capacity > 500;
        }


        return matchesSearch && matchesCapacity;

    });


    hallGrid.innerHTML = "";


    /* =========================================
       EMPTY STATE
    ========================================= */

    if (filteredHalls.length === 0) {

        hallGrid.innerHTML = `
            <div class="customer-room-empty">
                <h3>No event halls found</h3>
                <p>
                    Try changing your search or capacity filter.
                </p>
            </div>
        `;

        return;
    }


    /* =========================================
       CREATE HALL CARDS
    ========================================= */

    filteredHalls.forEach(function (hall) {

        const card = document.createElement("div");

        card.className = "customer-hall-card";


        card.innerHTML = `

            <div class="hall-card-image">

                <img
                    src="${hall.image}"
                    alt="${hall.name}"
                    loading="lazy"
                >

            </div>


            <div class="customer-hall-content">

                <div class="customer-hall-top">

                    <h3>
                        ${hall.name}
                    </h3>

                    <span class="room-available">
                        ${hall.status}
                    </span>

                </div>


                <span class="customer-hall-location">
                    ${hall.location}
                </span>


                <div class="customer-hall-info">

                    <span>
                        👥 ${hall.capacity} guests
                    </span>

                </div>


                <p class="customer-hall-purpose">
                    ${hall.suitableFor}
                </p>


                <div class="customer-room-price">

                    <div>

                        <strong>
                            ${formatMoney(hall.price)}
                        </strong>

                        <span>
                            per event
                        </span>

                    </div>


                    <button
                        type="button"
                        class="primary-button book-hall-button"
                        data-hall-id="${hall.id}"
                    >
                        Book Hall
                    </button>

                </div>

            </div>

        `;


        hallGrid.appendChild(card);

    });

}


/* =========================================
   OPEN BOOKING MODAL
========================================= */

function openHallBookingModal(hallId) {

    selectedHall = customerHalls.find(function (hall) {
        return hall.id === hallId;
    });


    if (!selectedHall) {
        return;
    }


    hallBookingForm.reset();


    /* Restore selected hall after reset */

    document.getElementById("selectedHallId").value =
        selectedHall.id;


    document.getElementById("selectedHallName").textContent =
        selectedHall.name;


    document.getElementById("selectedHallDetails").textContent =
        "Capacity: " +
        selectedHall.capacity +
        " guests · " +
        selectedHall.location;


    document.getElementById("selectedHallPrice").textContent =
        formatMoney(selectedHall.price);


    document.getElementById("hallBookingTotal").textContent =
        formatMoney(selectedHall.price);


    /* Prevent attendees from exceeding hall capacity */

    expectedAttendees.max =
        selectedHall.capacity;


    /* Clear previous validation error */

    document.getElementById("hallBookingError").textContent = "";


    hallBookingModal.classList.add("show");

}


/* =========================================
   CLOSE BOOKING MODAL
========================================= */

function closeHallBookingModal() {

    hallBookingModal.classList.remove("show");

    selectedHall = null;

}


/* =========================================
   HALL CARD BUTTONS
========================================= */

hallGrid.addEventListener("click", function (event) {

    const button =
        event.target.closest("[data-hall-id]");


    if (!button) {
        return;
    }


    const hallId =
        Number(button.dataset.hallId);


    openHallBookingModal(hallId);

});


/* =========================================
   SEARCH
========================================= */

hallSearchInput.addEventListener(
    "input",
    renderHalls
);


/* =========================================
   CAPACITY FILTER
========================================= */

hallCapacityFilter.addEventListener(
    "change",
    renderHalls
);


/* =========================================
   CLOSE BUTTON
========================================= */

document
    .getElementById("closeHallBookingModal")
    .addEventListener(
        "click",
        closeHallBookingModal
    );


/* =========================================
   CANCEL BUTTON
========================================= */

document
    .getElementById("cancelHallBooking")
    .addEventListener(
        "click",
        closeHallBookingModal
    );


/* =========================================
   CLOSE WHEN CLICKING OUTSIDE MODAL
========================================= */

hallBookingModal.addEventListener(
    "click",
    function (event) {

        if (event.target === hallBookingModal) {
            closeHallBookingModal();
        }

    }
);


/* =========================================
   SUBMIT HALL BOOKING
   MOCK SUBMISSION FOR NOW
========================================= */

hallBookingForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const error =
            document.getElementById("hallBookingError");


        error.textContent = "";


        if (!selectedHall) {
            return;
        }


        const eventType =
            document.getElementById("eventType").value;


        const attendees =
            Number(expectedAttendees.value);


        /* =========================================
           VALIDATE EVENT TYPE
        ========================================= */

        if (!eventType) {

            error.textContent =
                "Please select an event type.";

            return;

        }


        /* =========================================
           VALIDATE DATE
        ========================================= */

        if (!eventDate.value) {

            error.textContent =
                "Please select the event date.";

            return;

        }


        /* =========================================
           VALIDATE TIME
        ========================================= */

        if (
            !eventStartTime.value ||
            !eventEndTime.value
        ) {

            error.textContent =
                "Please select the event start and end times.";

            return;

        }


        /* =========================================
           VALIDATE TIME ORDER
        ========================================= */

        if (
            eventEndTime.value <=
            eventStartTime.value
        ) {

            error.textContent =
                "The event end time must be after the start time.";

            return;

        }


        /* =========================================
           VALIDATE ATTENDEES
        ========================================= */

        if (
            attendees < 1 ||
            attendees > selectedHall.capacity
        ) {

            error.textContent =
                "The number of attendees exceeds this hall's capacity.";

            return;

        }


        /* =========================================
           MOCK SUBMISSION
           
           This will later become the actual
           backend event booking request.
        ========================================= */

        alert(
            "Event hall booking request submitted successfully!"
        );


        closeHallBookingModal();

    }
);


/* =========================================
   INITIAL RENDER
========================================= */

renderHalls();