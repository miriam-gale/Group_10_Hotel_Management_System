/* =========================================
   CUSTOMER EVENT HALLS
   Backend-connected version
========================================= */

const API_BASE = "http://localhost:3000/api";

let customerHalls = [];
let selectedHall = null;

/* =========================================
   DOM
========================================= */

const hallGrid = document.getElementById("customerHallGrid");
const hallSearchInput = document.getElementById("hallSearchInput");
const hallCapacityFilter = document.getElementById("hallCapacityFilter");

const hallBookingModal = document.getElementById("hallBookingModal");
const hallBookingForm = document.getElementById("hallBookingForm");

const selectedHallId = document.getElementById("selectedHallId");
const selectedHallName = document.getElementById("selectedHallName");
const selectedHallDetails = document.getElementById("selectedHallDetails");
const selectedHallPrice = document.getElementById("selectedHallPrice");
const selectedHallImage = document.getElementById("selectedHallImage");
const hallBookingTotal = document.getElementById("hallBookingTotal");
const hallBookingError = document.getElementById("hallBookingError");

const eventType = document.getElementById("eventType");
const eventDate = document.getElementById("eventDate");
const eventStartTime = document.getElementById("eventStartTime");
const eventEndTime = document.getElementById("eventEndTime");
const expectedAttendees = document.getElementById("expectedAttendees");

const closeHallBookingModalButton =
    document.getElementById("closeHallBookingModal");

const cancelHallBookingButton =
    document.getElementById("cancelHallBooking");


/* =========================================
   HELPERS
========================================= */

function getToken() {
    return localStorage.getItem("token");
}


function formatMoney(amount) {
    return `GHS ${Number(amount || 0).toLocaleString("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   FALLBACK IMAGES
========================================= */

function getHallImage(hall) {

    const name = String(
        hall.HallName ??
        hall.name ??
        ""
    )
        .trim()
        .toLowerCase();

    const images = {

  
        "boardroom":
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=90",

        "conference room a":
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=90",

            "conference room b":
    "https://www.legere-hotelgroup.com/assets/2090_LHLUX_Conference_Room_C_01A_Online_3840px-2_0285c9ca001ae1aa66977f48.jpg",

        "training room":
            "https://www.unionlearn.org.uk/sites/default/files/blog/2024/NARS-07-09-18%2520MW%252023.jpg",

        "garden pavilion":
            "https://cdn0.weddingwire.com/vendor/048271/3_2/960/jpeg/img-9935_51_172840-174906004757720.jpeg",


        "rooftop terrace":
            "https://cdn0.mariages.net/emp/fotos/5/8/5/7/oxygen-la-defense-0086-hd_3_195857-157235116199851.jpg",


        "grand ballroom":
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=90"
    };


    return images[name] ||
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=90";
}

function getHallExtraInfo(hall) {

    const info = {

        1: {
            location: "Ground Floor",
            suitableFor: "Weddings, Conferences"
        },

        2: {
            location: "First Floor",
            suitableFor: "Conferences, Meetings"
        },

        3: {
            location: "Garden Level",
            suitableFor: "Birthdays, Weddings"
        },

        4: {
            location: "Second Floor",
            suitableFor: "Meetings, Corporate Events"
        }

    };

    return info[hall.id] || {
        location: "Hotel",
        suitableFor: "Events"
    };
}


/* =========================================
   NORMALIZE DATABASE HALL
========================================= */

function normalizeHall(hall) {

    const id = Number(
        hall.HallID ??
        hall.id
    );

    const extra = getHallExtraInfo({
        ...hall,
        id
    });

    return {

        id,

        name:
            hall.HallName ??
            hall.name ??
            "Event Hall",

        capacity:
            Number(
                hall.Capacity ??
                hall.capacity ??
                0
            ),

        price:
            Number(
                hall.BookingPricePerHour ??
                hall.PricePerHour ??
                hall.Price ??
                hall.price ??
                0
            ),

        description:
            hall.Description ??
            "",

        status:

            hall.IsAvailable === false ||
            hall.IsAvailable === 0

                ? "Unavailable"

                : (
                    hall.Status ??
                    hall.status ??
                    "Available"
                ),

        location:
            hall.Location ??
            hall.location ??
            extra.location,

        suitableFor:
            hall.SuitableFor ??
            hall.suitableFor ??
            extra.suitableFor,

      image: getHallImage({
    ...hall,
    id
})
    };
}


/* =========================================
   API REQUEST
========================================= */

async function fetchAPI(endpoint, options = {}) {

    const headers = {

        "Content-Type": "application/json",

        ...(options.headers || {})

    };

    const token = getToken();

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response = await fetch(
        `${API_BASE}${endpoint}`,
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


/* =========================================
   LOAD HALLS FROM DATABASE
========================================= */

async function loadCustomerHalls() {

    if (!hallGrid) {

        console.error(
            "customerHallGrid was not found."
        );

        return;
    }

    hallGrid.innerHTML = `

        <div class="customer-room-empty">

            <h3>
                Loading event halls...
            </h3>

            <p>
                Please wait.
            </p>

        </div>

    `;


    try {

        const data =
            await fetchAPI("/events/halls");


        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid hall data received from server."
            );

        }


        customerHalls =
            data.map(normalizeHall);


        console.log(
            "Event halls loaded:",
            customerHalls
        );


        populateCapacityFilter();

        renderHalls();


    } catch (error) {

        console.error(
            "Event hall loading error:",
            error
        );


        hallGrid.innerHTML = `

            <div class="customer-room-empty">

                <h3>
                    Unable to load event halls
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

                <button
                    type="button"
                    class="primary-button"
                    id="retryHallLoad"
                >
                    Try Again
                </button>

            </div>

        `;


        document
            .getElementById("retryHallLoad")
            ?.addEventListener(
                "click",
                loadCustomerHalls
            );

    }

}


/* =========================================
   CAPACITY FILTER
========================================= */

function populateCapacityFilter() {

    if (!hallCapacityFilter) return;


    const currentValue =
        hallCapacityFilter.value ||
        "all";


    const capacities = [

        ...new Set(

            customerHalls

                .map(
                    hall =>
                        hall.capacity
                )

                .filter(
                    capacity =>
                        capacity > 0
                )

        )

    ].sort(
        (a, b) => a - b
    );


    hallCapacityFilter.innerHTML = [

        `<option value="all">
            All capacities
        </option>`,

        ...capacities.map(

            capacity =>

                `<option value="${capacity}">
                    ${capacity}+ guests
                </option>`

        )

    ].join("");


    if (

        [...hallCapacityFilter.options]

            .some(
                option =>
                    option.value === currentValue
            )

    ) {

        hallCapacityFilter.value =
            currentValue;

    } else {

        hallCapacityFilter.value =
            "all";

    }

}


/* =========================================
   FILTER HALLS
========================================= */

function getFilteredHalls() {

    const search =
        hallSearchInput?.value
            ?.trim()
            .toLowerCase() || "";


    const capacity =
        hallCapacityFilter?.value ||
        "all";


    return customerHalls.filter(
        hall => {

            const searchableText = [

                hall.name,

                hall.suitableFor,

                hall.location,

                hall.description

            ]
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                searchableText.includes(
                    search
                );


            const matchesCapacity =

                capacity === "all" ||

                hall.capacity >=
                    Number(capacity);


            return (
                matchesSearch &&
                matchesCapacity
            );

        }
    );

}


/* =========================================
   RENDER HALLS
========================================= */

function renderHalls() {

    if (!hallGrid) return;


    const filteredHalls =
        getFilteredHalls();


    hallGrid.innerHTML = "";


    if (
        filteredHalls.length === 0
    ) {

        hallGrid.innerHTML = `

            <div class="customer-room-empty">

                <h3>
                    No event halls found
                </h3>

                <p>
                    Try changing your
                    search or capacity filter.
                </p>

            </div>

        `;

        return;
    }


    filteredHalls.forEach(
        hall => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "customer-hall-card";


            const available =
                hall.status
                    .toLowerCase() ===
                "available";


            card.innerHTML = `

                <div class="hall-card-image">

                    <img
                        src="${escapeHtml(hall.image)}"
                        alt="${escapeHtml(hall.name)}"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80';
                        "
                    >

                </div>


                <div class="customer-hall-content">


                    <div class="customer-hall-top">

                        <h3>
                            ${escapeHtml(
                                hall.name
                            )}
                        </h3>

                        <span class="room-available">

                            ${escapeHtml(
                                hall.status
                            )}

                        </span>

                    </div>


                    <span
                        class="customer-hall-location"
                    >

                        ${escapeHtml(
                            hall.location
                        )}

                    </span>


                    <div
                        class="customer-hall-info"
                    >

                        <span>
                            👥
                            ${hall.capacity}
                            guests
                        </span>

                    </div>


                    <p
                        class="customer-hall-purpose"
                    >

                        ${escapeHtml(
                            hall.suitableFor
                        )}

                    </p>


                    <div
                        class="customer-room-price"
                    >

                        <div>

                            <strong>
                                ${formatMoney(
                                    hall.price
                                )}
                            </strong>

                            <span>
                                per hour
                            </span>

                        </div>


                        <button
                            type="button"
                            class="primary-button"
                            data-hall-id="${hall.id}"
                            ${
                                available
                                    ? ""
                                    : "disabled"
                            }
                        >

                            ${
                                available
                                    ? "Book Hall"
                                    : "Unavailable"
                            }

                        </button>

                    </div>


                </div>

            `;


            hallGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================
   OPEN BOOKING MODAL
========================================= */

function openHallBookingModal(
    hallId
) {

    const numericId =
        Number(hallId);


    selectedHall =
        customerHalls.find(
            hall =>
                hall.id ===
                numericId
        );


    if (!selectedHall) {

        console.error(
            "Hall not found:",
            numericId
        );

        return;
    }


    if (
        selectedHall.status
            .toLowerCase() !==
        "available"
    ) {

        return;
    }


    hallBookingForm?.reset();


    if (selectedHallId) {

        selectedHallId.value =
            selectedHall.id;

    }


    if (selectedHallName) {

        selectedHallName.textContent =
            selectedHall.name;

    }


    if (selectedHallDetails) {

        selectedHallDetails.textContent =
            `Capacity: ${
                selectedHall.capacity
            } guests · ${
                selectedHall.location
            }`;

    }


    if (selectedHallPrice) {

        selectedHallPrice.textContent =
            formatMoney(
                selectedHall.price
            );

    }


    if (selectedHallImage) {

        selectedHallImage.src =
            selectedHall.image;

        selectedHallImage.alt =
            selectedHall.name;

    }


    if (hallBookingTotal) {

        hallBookingTotal.textContent =
            formatMoney(
                selectedHall.price
            );

    }


    if (expectedAttendees) {

        expectedAttendees.max =
            String(
                selectedHall.capacity
            );

    }


    if (hallBookingError) {

        hallBookingError.textContent =
            "";

    }


    hallBookingModal?.classList.add(
        "show"
    );

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeHallBookingModal() {

    hallBookingModal?.classList.remove(
        "show"
    );

    selectedHall = null;

}


/* =========================================
   BOOKING ERROR
========================================= */

function showBookingError(
    message
) {

    if (hallBookingError) {

        hallBookingError.textContent =
            message;

    } else {

        alert(message);

    }

}


/* =========================================
   SUBMIT BOOKING
========================================= */

async function submitHallBooking(
    event
) {

    event.preventDefault();


    if (!selectedHall) return;


    if (hallBookingError) {

        hallBookingError.textContent =
            "";

    }


    const type =
        eventType?.value?.trim() ||
        "";

    const date =
        eventDate?.value ||
        "";

    const startTime =
        eventStartTime?.value ||
        "";

    const endTime =
        eventEndTime?.value ||
        "";

    const attendees =
        Number(
            expectedAttendees?.value ||
            0
        );


    if (!type) {

        showBookingError(
            "Please select an event type."
        );

        return;
    }


    if (!date) {

        showBookingError(
            "Please select the event date."
        );

        return;
    }


    if (
        !startTime ||
        !endTime
    ) {

        showBookingError(
            "Please select the event start and end times."
        );

        return;
    }


    if (
        endTime <= startTime
    ) {

        showBookingError(
            "The event end time must be after the start time."
        );

        return;
    }


    if (attendees < 1) {

        showBookingError(
            "Please enter the number of attendees."
        );

        return;
    }


    if (
        attendees >
        selectedHall.capacity
    ) {

        showBookingError(

            `This hall can accommodate a maximum of ${
                selectedHall.capacity
            } guests.`

        );

        return;
    }


    const submitButton =
        hallBookingForm?.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Booking...";

    }


    try {

        const result =
            await fetchAPI(
                "/events",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            HallID:
                                selectedHall.id,

                            EventType:
                                type,

                            EventDate:
                                date,

                            StartTime:
                                startTime,

                            EndTime:
                                endTime,

                            ExpectedAttendees:
                                attendees

                        })

                }
            );


        alert(

            result.message ||
            "Event hall booked successfully!"

        );


        closeHallBookingModal();

        await loadCustomerHalls();


    } catch (error) {

        console.error(
            "Event booking error:",
            error
        );


        showBookingError(

            error.message ||
            "Unable to complete the booking."

        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Confirm Booking";

        }

    }

}


/* =========================================
   INITIALIZE
========================================= */

function initializeCustomerHalls() {

    if (!hallGrid) {

        console.error(
            "customerHallGrid was not found."
        );

        return;
    }


    hallGrid.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-hall-id]"
                );


            if (!button) return;


            openHallBookingModal(
                button.dataset.hallId
            );

        }
    );


    hallSearchInput?.addEventListener(
        "input",
        renderHalls
    );


    hallCapacityFilter?.addEventListener(
        "change",
        renderHalls
    );


    closeHallBookingModalButton
        ?.addEventListener(
            "click",
            closeHallBookingModal
        );


    cancelHallBookingButton
        ?.addEventListener(
            "click",
            closeHallBookingModal
        );


    hallBookingModal?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                hallBookingModal
            ) {

                closeHallBookingModal();

            }

        }
    );


    hallBookingForm?.addEventListener(
        "submit",
        submitHallBooking
    );


    loadCustomerHalls();

}


/* =========================================
   START
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCustomerHalls
    );

} else {

    initializeCustomerHalls();

}
