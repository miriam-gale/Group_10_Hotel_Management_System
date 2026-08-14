/* =========================================
   CUSTOMER BILLING & PAYMENTS
========================================= */

const API_BASE = "http://localhost:3000/api";

let invoices = [];
let selectedInvoice = null;


/* =========================================
   AUTH
========================================= */

function getToken() {
    return localStorage.getItem("token");
}


function checkAuthentication() {

    if (!getToken()) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


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
   FORMAT DATE
========================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
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


/* =========================================
   STATUS CLASS
========================================= */

function getPaymentStatusClass(status) {

    if (!status) {
        return "unpaid";
    }

    const value =
        status.toLowerCase();

    if (value === "paid") {
        return "paid";
    }

    if (
        value.includes("partial")
    ) {
        return "partial";
    }

    if (
        value === "overdue"
    ) {
        return "overdue";
    }

    return "unpaid";
}


/* =========================================
   API REQUEST
========================================= */

async function fetchAPI(endpoint) {

    const response =
        await fetch(
            `${API_BASE}${endpoint}`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${getToken()}`,

                    "Content-Type":
                        "application/json"
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
            `Request failed (${response.status})`
        );
    }


    return data;
}


/* =========================================
   LOAD INVOICES
========================================= */

async function loadInvoices() {

    const invoiceList =
        document.getElementById(
            "invoiceList"
        );


    invoiceList.innerHTML = `
        <div class="loading-invoices">
            Loading your invoices...
        </div>
    `;


    try {

        invoices =
            await fetchAPI(
                "/invoices/my"
            );


        if (!Array.isArray(invoices)) {
            invoices = [];
        }


        updateSummary();

        renderInvoices();


    } catch (error) {

        console.error(
            "Invoice loading error:",
            error
        );


        invoiceList.innerHTML = `

            <div class="empty-invoices">

                <div class="empty-invoices-icon">
                    ⚠
                </div>

                <h3>
                    Unable to load invoices
                </h3>

                <p>
                    ${error.message}
                </p>

                <button
                    type="button"
                    class="invoice-button primary"
                    onclick="loadInvoices()"
                >
                    Try Again
                </button>

            </div>

        `;

    }

}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    let outstanding = 0;
    let paid = 0;


    invoices.forEach(function (invoice) {

        const amount =
            Number(
                invoice.TotalAmount || 0
            );


        const status =
            String(
                invoice.PaymentStatus || ""
            ).toLowerCase();


        if (status === "paid") {

            paid += amount;

        } else {

            outstanding += amount;

        }

    });


    document.getElementById(
        "totalOutstanding"
    ).textContent =
        formatMoney(outstanding);


    document.getElementById(
        "totalPaid"
    ).textContent =
        formatMoney(paid);


    document.getElementById(
        "totalInvoices"
    ).textContent =
        invoices.length;

}


/* =========================================
   RENDER INVOICES
========================================= */

function renderInvoices() {

    const invoiceList =
        document.getElementById(
            "invoiceList"
        );


    const filter =
        document.getElementById(
            "invoiceFilter"
        ).value;


    let filtered =
        invoices;


    if (filter !== "all") {

        filtered =
            invoices.filter(
                function (invoice) {

                    return (
                        invoice.PaymentStatus ===
                        filter
                    );

                }
            );

    }


    if (filtered.length === 0) {

        invoiceList.innerHTML = `

            <div class="empty-invoices">

                <div class="empty-invoices-icon">
                    ▤
                </div>

                <h3>
                    No invoices found
                </h3>

                <p>
                    There are no invoices matching this filter.
                </p>

            </div>

        `;

        return;
    }


    invoiceList.innerHTML =
        filtered.map(
            createInvoiceCard
        ).join("");

}


/* =========================================
   CREATE INVOICE CARD
========================================= */

function createInvoiceCard(invoice) {

    const type =
        invoice.InvoiceType ||
        (
            invoice.ReservationID
                ? "Room Reservation"
                : "Event Booking"
        );


    const isRoom =
        type === "Room Reservation";


    const icon =
        isRoom
            ? "▣"
            : "♜";


    const status =
        invoice.PaymentStatus ||
        "Unpaid";


    const statusClass =
        getPaymentStatusClass(
            status
        );


    const reference =
        invoice.Reference ||
        (
            isRoom
                ? `RES-${invoice.ReservationID}`
                : `EVT-${invoice.EventID}`
        );


    const serviceDate =
        formatDate(
            invoice.ServiceDate ||
            invoice.IssuedDate
        );


    const amount =
        formatMoney(
            invoice.TotalAmount
        );


    const isPaid =
        status.toLowerCase() ===
        "paid";


    return `

        <article class="invoice-card">

            <div class="invoice-card-top">

                <div>

                    <div class="invoice-main">

                        <div class="invoice-icon">
                            ${icon}
                        </div>

                        <div>

                            <h3>
                                ${type}
                            </h3>

                            <span class="invoice-reference">
                                Invoice #${invoice.InvoiceID}
                                · ${reference}
                            </span>

                        </div>

                    </div>


                    <div class="invoice-meta">

                        <span>
                            Service date:
                            <strong>
                                ${serviceDate}
                            </strong>
                        </span>

                        <span>
                            Issued:
                            <strong>
                                ${formatDate(
                                    invoice.IssuedDate
                                )}
                            </strong>
                        </span>

                    </div>

                </div>


                <div class="invoice-right">

                    <span class="invoice-amount">
                        ${amount}
                    </span>

                    <span
                        class="payment-badge ${statusClass}"
                    >
                        ${status}
                    </span>

                </div>

            </div>


            <div class="invoice-actions">

                <button
                    type="button"
                    class="invoice-button"
                    data-action="view"
                    data-invoice-id="${invoice.InvoiceID}"
                >
                    View Invoice
                </button>


                ${
                    !isPaid
                    ? `
                        <button
                            type="button"
                            class="invoice-button primary"
                            data-action="pay"
                            data-invoice-id="${invoice.InvoiceID}"
                        >
                            View & Pay
                        </button>
                    `
                    : ""
                }

            </div>

        </article>

    `;
}


/* =========================================
   OPEN INVOICE MODAL
========================================= */

async function openInvoiceModal(
    invoiceId,
    allowPayment = true
) {

    try {

        const invoice =
            await fetchAPI(
                `/invoices/${invoiceId}`
            );


        selectedInvoice =
            invoice;


        const status =
            invoice.PaymentStatus ||
            "Unpaid";


        const isPaid =
            status.toLowerCase() ===
            "paid";


        const type =
            invoice.InvoiceType ||
            (
                invoice.ReservationID
                    ? "Room Reservation"
                    : "Event Booking"
            );


        let serviceDetails = "";


        if (
            invoice.ReservationID
        ) {

            serviceDetails = `

                <div class="invoice-detail-row">

                    <span>
                        Reservation
                    </span>

                    <strong>
                        ${invoice.Reference || "—"}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Room
                    </span>

                    <strong>
                        ${invoice.RoomNumber || "—"}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Check-in
                    </span>

                    <strong>
                        ${formatDate(
                            invoice.CheckInDate
                        )}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Check-out
                    </span>

                    <strong>
                        ${formatDate(
                            invoice.CheckOutDate
                        )}
                    </strong>

                </div>

            `;

        } else {

            serviceDetails = `

                <div class="invoice-detail-row">

                    <span>
                        Event
                    </span>

                    <strong>
                        ${invoice.EventType || "Event Booking"}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Hall
                    </span>

                    <strong>
                        ${invoice.HallName || "—"}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Event Date
                    </span>

                    <strong>
                        ${formatDate(
                            invoice.EventDate
                        )}
                    </strong>

                </div>


                <div class="invoice-detail-row">

                    <span>
                        Time
                    </span>

                    <strong>
                        ${
                            invoice.StartTime &&
                            invoice.EndTime
                                ? `${invoice.StartTime} - ${invoice.EndTime}`
                                : "—"
                        }
                    </strong>

                </div>

            `;

        }


        document.getElementById(
            "invoiceDetails"
        ).innerHTML = `

            <div class="invoice-detail-row">

                <span>
                    Invoice
                </span>

                <strong>
                    #${invoice.InvoiceID}
                </strong>

            </div>


            <div class="invoice-detail-row">

                <span>
                    Type
                </span>

                <strong>
                    ${type}
                </strong>

            </div>


            ${serviceDetails}


            <div class="invoice-detail-row">

                <span>
                    Payment Status
                </span>

                <strong>
                    ${status}
                </strong>

            </div>


            <div class="invoice-total">

                <span>
                    Total Amount
                </span>

                <strong>
                    ${formatMoney(
                        invoice.TotalAmount
                    )}
                </strong>

            </div>


            ${
                !isPaid && allowPayment
                    ? `
                        <div class="payment-method-section">

                            <h3>
                                Payment Method
                            </h3>

                            <div class="payment-methods">

                                <label class="payment-method">

                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="momo"
                                        checked
                                    >

                                    <span>
                                        Mobile Money
                                    </span>

                                </label>


                                <label class="payment-method">

                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                    >

                                    <span>
                                        Card
                                    </span>

                                </label>

                            </div>


                            <div class="payment-note">

                                Payment processing will be connected
                                once the customer payment endpoint
                                is provided by the backend team.

                            </div>

                        </div>
                    `
                    : ""
            }

        `;


        const payButton =
            document.getElementById(
                "payInvoiceButton"
            );


        if (
            isPaid ||
            !allowPayment
        ) {

            payButton.style.display =
                "none";

        } else {

            payButton.style.display =
                "inline-flex";

        }


        document
            .getElementById(
                "invoiceModal"
            )
            .classList.add("show");


    } catch (error) {

        alert(
            "Unable to load invoice: " +
            error.message
        );

    }

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeInvoiceModal() {

    document
        .getElementById(
            "invoiceModal"
        )
        .classList.remove("show");

    selectedInvoice = null;

}


/* =========================================
   INVOICE ACTIONS
========================================= */

document
    .getElementById("invoiceList")
    .addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const invoiceId =
                button.dataset.invoiceId;


            const action =
                button.dataset.action;


            if (action === "view") {

                openInvoiceModal(
                    invoiceId,
                    false
                );

            }


            if (action === "pay") {

                openInvoiceModal(
                    invoiceId,
                    true
                );

            }

        }
    );


/* =========================================
   FILTER
========================================= */

document
    .getElementById("invoiceFilter")
    .addEventListener(
        "change",
        renderInvoices
    );


/* =========================================
   CLOSE MODAL BUTTON
========================================= */

document
    .getElementById(
        "closeInvoiceModal"
    )
    .addEventListener(
        "click",
        closeInvoiceModal
    );


document
    .getElementById(
        "closeInvoiceButton"
    )
    .addEventListener(
        "click",
        closeInvoiceModal
    );


/* =========================================
   CLOSE MODAL OUTSIDE
========================================= */

document
    .getElementById(
        "invoiceModal"
    )
    .addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                this
            ) {

                closeInvoiceModal();

            }

        }
    );


/* =========================================
   PAY BUTTON
========================================= */

document
    .getElementById(
        "payInvoiceButton"
    )
    .addEventListener(
        "click",
        function () {

            if (!selectedInvoice) {
                return;
            }


            /*
             * PAYMENT BACKEND PENDING
             *
             * The current backend payment route
             * requires manager authorization.
             *
             * We will connect this button to the
             * customer payment endpoint once the
             * backend team provides it.
             */

            alert(
                "Payment processing will be available once the customer payment service is connected."
            );

        }
    );


/* =========================================
   LOGOUT
========================================= */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("CustomerID");
            localStorage.removeItem("FirstName");
            localStorage.removeItem("role");

            window.location.href =
                "login.html";

        }
    );


/* =========================================
   USER INFORMATION
========================================= */

function loadUserInfo() {

    const firstName =
        localStorage.getItem(
            "FirstName"
        );


    if (!firstName) {
        return;
    }


    const initials =
        firstName
            .split(" ")
            .map(
                word =>
                    word.charAt(0)
            )
            .join("")
            .substring(0, 2)
            .toUpperCase();


    document.getElementById(
        "sidebarName"
    ).textContent =
        firstName;


    document.getElementById(
        "profileName"
    ).textContent =
        firstName;


    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        initials;


    document.getElementById(
        "profileAvatar"
    ).textContent =
        initials;

}


/* =========================================
   INITIALIZE
========================================= */

if (checkAuthentication()) {

    loadUserInfo();

    loadInvoices();

}