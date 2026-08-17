const API = "http://localhost:3000/api";


/* =========================================
   AUTHENTICATION
========================================= */

function getStaffToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("staffToken") ||
        localStorage.getItem("accessToken")
    );

}


async function apiFetch(endpoint, options = {}) {

    const token = getStaffToken();

    if (!token) {

        window.location.href = "login.html";

        return null;

    }


    const response = await fetch(
        `${API}${endpoint}`,
        {
            ...options,

            headers: {

                "Content-Type": "application/json",

                ...(options.headers || {}),

                "Authorization":
                    `Bearer ${token}`

            }

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
   DATA
========================================= */

let feedbackList = [];


/* =========================================
   DOM ELEMENTS
========================================= */

const feedbackTableBody =
    document.getElementById(
        "feedbackTableBody"
    );


const ratingFilter =
    document.getElementById(
        "ratingFilter"
    );


const typeFilter =
    document.getElementById(
        "typeFilter"
    );


const totalFeedback =
    document.getElementById(
        "totalFeedback"
    );


const averageRating =
    document.getElementById(
        "averageRating"
    );


const fiveStarFeedback =
    document.getElementById(
        "fiveStarFeedback"
    );


const roomFeedback =
    document.getElementById(
        "roomFeedback"
    );


const eventFeedback =
    document.getElementById(
        "eventFeedback"
    );


const feedbackCount =
    document.getElementById(
        "feedbackCount"
    );


/* =========================================
   HELPERS
========================================= */

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


function formatDate(dateString) {

    if (!dateString) {

        return "—";

    }


    const value =
        String(dateString)
            .replace(" ", "T");


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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


function renderStars(rating) {

    const value =
        Number(rating || 0);


    let stars = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        stars +=
            i <= value
                ? "★"
                : "☆";

    }


    return stars;

}


/* =========================================
   LOAD FEEDBACK
========================================= */

async function loadFeedback() {

    try {

        const data =
            await apiFetch(
                "/feedback"
            );


        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid feedback data received from server."
            );

        }


        feedbackList = data;


        renderSummary();

        renderFeedback();


    } catch (error) {

        console.error(
            "Load feedback error:",
            error
        );


        feedbackTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="feedback-message feedback-error"
                >

                    Unable to load feedback.

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const total =
        feedbackList.length;


    const fiveStars =
        feedbackList.filter(
            item =>
                Number(item.Rating) === 5
        ).length;


    const rooms =
        feedbackList.filter(
            item =>
                item.ReservationID !== null &&
                item.ReservationID !== undefined
        ).length;


    const events =
        feedbackList.filter(
            item =>
                item.EventID !== null &&
                item.EventID !== undefined
        ).length;


    const ratingTotal =
        feedbackList.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.Rating || 0
                ),
            0
        );


    const average =
        total > 0
            ? ratingTotal / total
            : 0;


    totalFeedback.textContent =
        total;


    averageRating.textContent =
        `${average.toFixed(1)} ★`;


    fiveStarFeedback.textContent =
        fiveStars;


    roomFeedback.textContent =
        rooms;


    eventFeedback.textContent =
        events;

}


/* =========================================
   FILTER FEEDBACK
========================================= */

function getFilteredFeedback() {

    const rating =
        ratingFilter
            ? ratingFilter.value
            : "";


    const type =
        typeFilter
            ? typeFilter.value
            : "";


    return feedbackList.filter(
        feedback => {

            const matchesRating =
                !rating ||
                String(
                    feedback.Rating
                ) === String(rating);


            const matchesType =
                !type ||
                (
                    type === "room" &&
                    feedback.ReservationID
                ) ||
                (
                    type === "event" &&
                    feedback.EventID
                );


            return (
                matchesRating &&
                matchesType
            );

        }
    );

}


/* =========================================
   RENDER TABLE
========================================= */

function renderFeedback() {

    const filtered =
        getFilteredFeedback();


    feedbackCount.textContent =
        `${filtered.length} ${
            filtered.length === 1
                ? "feedback"
                : "feedback"
        }`;


    if (!filtered.length) {

        feedbackTableBody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="feedback-message"
                >

                    No feedback matches
                    the selected filters.

                </td>

            </tr>

        `;

        return;

    }


    feedbackTableBody.innerHTML =
        filtered.map(
            feedback => {

                const customerName =
                    feedback.CustomerName ||
                    "Unknown Customer";


                const email =
                    feedback.Email ||
                    "";


                const type =
                    feedback.FeedbackType ||
                    (
                        feedback.ReservationID
                            ? "Room Stay"
                            : "Event"
                    );


                const reference =
                    feedback.Reference ||
                    (
                        feedback.ReservationID
                            ? `RES-${feedback.ReservationID}`
                            : `EVT-${feedback.EventID}`
                    );


                const rating =
                    Number(
                        feedback.Rating || 0
                    );


                const comments =
                    feedback.Comments ||
                    "No comment provided";


                return `

                    <tr>

                        <td>

                            <div
                                class="customer-name"
                            >
                                ${escapeHTML(
                                    customerName
                                )}
                            </div>

                            ${
                                email
                                    ? `
                                        <div
                                            class="customer-email"
                                        >
                                            ${escapeHTML(
                                                email
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                        </td>


                        <td>

                            <span
                                class="feedback-type"
                            >
                                ${escapeHTML(
                                    type
                                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="feedback-reference"
                            >
                                ${escapeHTML(
                                    reference
                                )}
                            </span>

                        </td>


                        <td>

                            <span
                                class="rating-stars"
                            >
                                ${renderStars(
                                    rating
                                )}
                            </span>

                            <span
                                class="rating-number"
                            >
                                ${rating}/5
                            </span>

                        </td>


                        <td>

                            <div
                                class="feedback-comment"
                            >
                                ${escapeHTML(
                                    comments
                                )}
                            </div>

                        </td>


                        <td>

                            <span
                                class="feedback-date"
                            >
                                ${formatDate(
                                    feedback.SubmittedDate
                                )}
                            </span>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================
   FILTER EVENTS
========================================= */

if (ratingFilter) {

    ratingFilter.addEventListener(
        "change",
        renderFeedback
    );

}


if (typeFilter) {

    typeFilter.addEventListener(
        "change",
        renderFeedback
    );

}


/* ---------------INITIALIZE------------*/

loadFeedback();