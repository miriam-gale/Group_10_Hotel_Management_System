const API_BASE = "http://localhost:3000/api";

let completedBookings = [];
let selectedRating = 0;


/* --------------AUTH------------- */

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("customerToken")
    );
}


/* --------------API HELPER------------ */

async function fetchAPI(endpoint, options = {}) {

    const token = getToken();

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`
                    }
                    : {}),

                ...(options.headers || {})
            }
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        // Empty response
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


/* -------FORMAT DATE------------ */

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const value =
        String(dateString).split("T")[0];

    const date =
        new Date(`${value}T00:00:00`);

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


/* ----------LOAD COMPLETED ROOM BOOKINGS---------------- */

async function loadRoomBookings() {

    const data =
        await fetchAPI("/reservations/my");

    return data
        .filter(
            reservation =>
                String(
                    reservation.Status || ""
                ).toLowerCase() ===
                "checked-out"
        )
        .map(reservation => ({

            id:
                reservation.ReservationID,

            type:
                "room",

            reference:
                reservation.BookingReference ||
                `RES-${reservation.ReservationID}`,

            title:
                reservation.RoomNumber
                    ? `Room ${reservation.RoomNumber}`
                    : "Room Reservation",

            date:
                reservation.CheckOutDate

        }));
}


/* --------------LOAD COMPLETED EVENTS------------------- */

async function loadEventBookings() {

    const data =
        await fetchAPI("/events/my");

    return data
        .filter(
            event =>
                String(
                    event.Status || ""
                ).toLowerCase() ===
                "completed"
        )
        .map(event => ({

            id:
                event.EventID,

            type:
                "event",

            reference:
                event.EventReference ||
                `EVT-${event.EventID}`,

            title:
                event.EventType ||
                "Event Booking",

            date:
                event.EventDate

        }));
}


/* -------------LOAD ELIGIBLE BOOKINGS--------------- */

async function loadCompletedBookings() {

    const select =
        document.getElementById(
            "feedbackBooking"
        );

    try {

        const [
            roomBookings,
            eventBookings
        ] = await Promise.all([
            loadRoomBookings(),
            loadEventBookings()
        ]);

        completedBookings = [
            ...roomBookings,
            ...eventBookings
        ];

        select.innerHTML = `
            <option value="">
                Select a completed booking
            </option>
        `;

        if (!completedBookings.length) {

            select.innerHTML += `
                <option value="" disabled>
                    No completed bookings available
                </option>
            `;

            return;
        }

        completedBookings.forEach(
            booking => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    `${booking.type}:${booking.id}`;

                option.textContent =
                    `${booking.reference} — ${booking.title}`;

                select.appendChild(option);

            }
        );

    } catch (error) {

        console.error(
            "Loading completed bookings:",
            error
        );

        select.innerHTML = `
            <option value="">
                Unable to load bookings
            </option>
        `;
    }
}


/* --------------STAR RATING------------------ */

const ratingStars =
    document.querySelectorAll(
        ".rating-star"
    );

const ratingLabel =
    document.getElementById(
        "ratingLabel"
    );

const ratingText = {
    1: "Very Poor",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent"
};


ratingStars.forEach(
    star => {

        star.addEventListener(
            "click",
            function () {

                selectedRating =
                    Number(
                        this.dataset.rating
                    );

                ratingStars.forEach(
                    item => {

                        const value =
                            Number(
                                item.dataset.rating
                            );

                        item.classList.toggle(
                            "active",
                            value <= selectedRating
                        );

                    }
                );

                ratingLabel.textContent =
                    ratingText[
                        selectedRating
                    ];
            }
        );

    }
);


/* -----------------SUBMIT FEEDBACK------------------- */

document
    .getElementById("feedbackForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const bookingValue =
                document.getElementById(
                    "feedbackBooking"
                ).value;

            const comments =
                document.getElementById(
                    "feedbackComments"
                ).value.trim();

            const submitButton =
                document.getElementById(
                    "submitFeedbackButton"
                );

            if (!bookingValue) {

                alert(
                    "Please select a completed booking."
                );

                return;
            }

            if (!selectedRating) {

                alert(
                    "Please select a rating."
                );

                return;
            }

            const [
                type,
                id
            ] = bookingValue.split(":");

            const body = {

                Rating:
                    selectedRating,

                Comments:
                    comments || null

            };

            if (type === "room") {

                body.ReservationID =
                    Number(id);

            } else {

                body.EventID =
                    Number(id);

            }

            submitButton.disabled = true;
            submitButton.textContent =
                "Submitting...";

            try {

                const data =
                    await fetchAPI(
                        "/feedback",
                        {
                            method: "POST",
                            body:
                                JSON.stringify(
                                    body
                                )
                        }
                    );

                alert(
                    data.message ||
                    "Feedback submitted successfully."
                );

                document
                    .getElementById(
                        "feedbackForm"
                    )
                    .reset();

                selectedRating = 0;

                ratingStars.forEach(
                    star =>
                        star.classList.remove(
                            "active"
                        )
                );

                ratingLabel.textContent =
                    "Select a rating";

                await loadMyFeedback();

                await loadCompletedBookings();

            } catch (error) {

                console.error(
                    "Feedback submission error:",
                    error
                );

                alert(
                    "Unable to submit feedback: " +
                    error.message
                );

            } finally {

                submitButton.disabled = false;

                submitButton.textContent =
                    "Submit Feedback";
            }

        }
    );


/* --------------LOAD MY FEEDBACK------------- */

async function loadMyFeedback() {

    const list =
        document.getElementById(
            "feedbackList"
        );

    try {

        const feedback =
            await fetchAPI(
                "/feedback/my"
            );

        if (
            !Array.isArray(feedback) ||
            !feedback.length
        ) {

            list.innerHTML = `
                <div class="feedback-empty">
                    You have not submitted any feedback yet.
                </div>
            `;

            return;
        }

        list.innerHTML =
            feedback.map(
                item => {

                    const rating =
                        Number(
                            item.Rating || 0
                        );

                    const stars =
                        "★".repeat(rating) +
                        "☆".repeat(
                            Math.max(
                                5 - rating,
                                0
                            )
                        );

                    return `
                        <div class="feedback-item">

                            <div class="feedback-item-top">

                                <div>
                                    <div class="feedback-reference">
                                        ${escapeHTML(
                                            item.Reference ||
                                            "Booking"
                                        )}
                                    </div>

                                    <div class="feedback-type">
                                        ${escapeHTML(
                                            item.FeedbackType ||
                                            ""
                                        )}
                                    </div>
                                </div>

                                <div class="feedback-rating">
                                    ${stars}
                                </div>

                            </div>

                            ${
                                item.Comments
                                    ? `
                                        <div class="feedback-comment">
                                            ${escapeHTML(
                                                item.Comments
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                            <div class="feedback-date">
                                Submitted
                                ${formatDate(
                                    item.SubmittedDate
                                )}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");

    } catch (error) {

        console.error(
            "Loading feedback:",
            error
        );

        list.innerHTML = `
            <div class="feedback-empty">
                Unable to load your feedback.
            </div>
        `;
    }
}


/* --------------ESCAPE HTML---------------- */

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


/* ---------SIDEBAR CUSTOMER NAME------------------ */

const customerName =
    localStorage.getItem("FirstName");

const sidebarName =
    document.getElementById(
        "sidebarCustomerName"
    );

if (sidebarName && customerName) {

    sidebarName.textContent =
        customerName;
}


/* ----------------LOGOUT---------------- */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("CustomerID");
            localStorage.removeItem("FirstName");
            localStorage.removeItem("LastName");
            localStorage.removeItem("Email");
            localStorage.removeItem("ContactNumber");
            localStorage.removeItem("role");
            localStorage.removeItem("customerToken");
            localStorage.removeItem("customerId");
            localStorage.removeItem("customerName");

            window.location.href =
                "login.html";

        }
    );
}


/* -----------------INITIALIZE-------------- */

async function initializeFeedback() {

    if (!getToken()) {

        window.location.href =
            "login.html";

        return;
    }

    await Promise.all([
        loadCompletedBookings(),
        loadMyFeedback()
    ]);
}

initializeFeedback();