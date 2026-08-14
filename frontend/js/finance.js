/* =========================================
   FINANCE / BILLING
   TEMPORARY MOCK DATA

   This will later be replaced with API calls
   when the backend team's finance endpoints
   are ready.
========================================= */

let invoices = [
    {
        id: 1,
        customer: "Kwame Mensah",
        source: "Room Reservation",
        reference: "RES-1001",
        roomCharges: 2400,
        eventCharges: 0,
        additionalCharges: 150,
        totalAmount: 2550,
        paymentStatus: "Paid",
        amountPaid: 2550,
        issuedDate: "2026-08-10"
    },

    {
        id: 2,
        customer: "Akosua Boateng",
        source: "Event Booking",
        reference: "EVT-1002",
        roomCharges: 0,
        eventCharges: 2800,
        additionalCharges: 200,
        totalAmount: 3000,
        paymentStatus: "Unpaid",
        amountPaid: 0,
        issuedDate: "2026-08-11"
    },

    {
        id: 3,
        customer: "James Anderson",
        source: "Room Reservation",
        reference: "RES-1003",
        roomCharges: 4000,
        eventCharges: 0,
        additionalCharges: 0,
        totalAmount: 4000,
        paymentStatus: "Paid",
        amountPaid: 4000,
        issuedDate: "2026-08-12"
    },

    {
        id: 4,
        customer: "Ama Serwaa",
        source: "Event Booking",
        reference: "EVT-1004",
        roomCharges: 0,
        eventCharges: 6400,
        additionalCharges: 500,
        totalAmount: 6900,
        paymentStatus: "Overdue",
        amountPaid: 0,
        issuedDate: "2026-08-01"
    },

    {
        id: 5,
        customer: "Michael Owusu",
        source: "Room + Event",
        reference: "RES-1005",
        roomCharges: 1200,
        eventCharges: 1800,
        additionalCharges: 80,
        totalAmount: 3080,
        paymentStatus: "Partially Paid",
        amountPaid: 1500,
        issuedDate: "2026-08-13"
    }
];


const customers = [
    "Kwame Mensah",
    "Akosua Boateng",
    "James Anderson",
    "Ama Serwaa",
    "Michael Owusu"
];


let nextInvoiceId = 6;
let viewingInvoiceId = null;


/* =========================================
   DOM ELEMENTS
========================================= */

const invoiceTableBody =
    document.getElementById("invoiceTableBody");

const invoiceSearch =
    document.getElementById("invoiceSearch");

const paymentStatusFilter =
    document.getElementById("paymentStatusFilter");

const invoiceModal =
    document.getElementById("invoiceModal");

const invoiceDetails =
    document.getElementById("invoiceDetails");

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentStatus =
    document.getElementById("paymentStatus");

const generateInvoiceModal =
    document.getElementById("generateInvoiceModal");

const generateInvoiceForm =
    document.getElementById("generateInvoiceForm");

const invoiceFormError =
    document.getElementById("invoiceFormError");


/* =========================================
   FORMATTING
========================================= */

function formatMoney(amount) {

    return `GHS ${Number(amount).toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


function formatDate(dateString) {

    const date =
        new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getStatusClass(status) {

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* =========================================
   SUMMARY CALCULATIONS
========================================= */

function calculateTotals() {

    const totalBilled =
        invoices.reduce(
            (sum, invoice) =>
                sum + invoice.totalAmount,
            0
        );


    const totalPaid =
        invoices.reduce(
            (sum, invoice) =>
                sum + invoice.amountPaid,
            0
        );


    const totalOutstanding =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Math.max(
                    invoice.totalAmount -
                    invoice.amountPaid,
                    0
                ),
            0
        );


    const roomCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum + invoice.roomCharges,
            0
        );


    const eventCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum + invoice.eventCharges,
            0
        );


    const additionalCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum + invoice.additionalCharges,
            0
        );


    document.getElementById(
        "totalBilled"
    ).textContent =
        formatMoney(totalBilled);


    document.getElementById(
        "totalPaid"
    ).textContent =
        formatMoney(totalPaid);


    document.getElementById(
        "totalOutstanding"
    ).textContent =
        formatMoney(totalOutstanding);


    document.getElementById(
        "totalInvoices"
    ).textContent =
        invoices.length;


    document.getElementById(
        "roomChargesTotal"
    ).textContent =
        formatMoney(roomCharges);


    document.getElementById(
        "eventChargesTotal"
    ).textContent =
        formatMoney(eventCharges);


    document.getElementById(
        "additionalChargesTotal"
    ).textContent =
        formatMoney(additionalCharges);


    document.getElementById(
        "paidInvoiceCount"
    ).textContent =
        invoices.filter(
            invoice =>
                invoice.paymentStatus === "Paid"
        ).length;


    document.getElementById(
        "unpaidInvoiceCount"
    ).textContent =
        invoices.filter(
            invoice =>
                invoice.paymentStatus === "Unpaid"
        ).length;


    document.getElementById(
        "partialInvoiceCount"
    ).textContent =
        invoices.filter(
            invoice =>
                invoice.paymentStatus ===
                "Partially Paid"
        ).length;


    document.getElementById(
        "overdueInvoiceCount"
    ).textContent =
        invoices.filter(
            invoice =>
                invoice.paymentStatus ===
                "Overdue"
        ).length;
}


/* =========================================
   FILTERING
========================================= */

function getFilteredInvoices() {

    const search =
        invoiceSearch.value
            .trim()
            .toLowerCase();

    const status =
        paymentStatusFilter.value;


    return invoices.filter(invoice => {

        const matchesStatus =
            status === "all" ||
            invoice.paymentStatus === status;


        const matchesSearch =
            invoice.customer
                .toLowerCase()
                .includes(search) ||

            invoice.source
                .toLowerCase()
                .includes(search) ||

            invoice.reference
                .toLowerCase()
                .includes(search) ||

            `inv-${invoice.id}`
                .includes(search);


        return matchesStatus &&
               matchesSearch;
    });
}


/* =========================================
   RENDER INVOICES
========================================= */

function renderInvoices() {

    invoiceTableBody.innerHTML = "";

    const filtered =
        getFilteredInvoices();


    if (filtered.length === 0) {

        invoiceTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-row"
                >
                    No invoices found.
                </td>
            </tr>
        `;

        return;
    }


    filtered.forEach(invoice => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    INV-${invoice.id}
                </strong>
            </td>

            <td>
                <strong>
                    ${invoice.source}
                </strong>

                <small class="finance-reference">
                    ${invoice.reference}
                </small>
            </td>

            <td>
                ${invoice.customer}
            </td>

            <td>
                ${formatMoney(invoice.totalAmount)}
            </td>

            <td>
                <span
                    class="status-badge ${getStatusClass(
                        invoice.paymentStatus
                    )}"
                >
                    ${invoice.paymentStatus}
                </span>
            </td>

            <td>
                ${formatDate(invoice.issuedDate)}
            </td>

            <td>

                <button
                    type="button"
                    class="action-button"
                    data-action="view"
                    data-id="${invoice.id}"
                >
                    View
                </button>

            </td>
        `;


        invoiceTableBody.appendChild(row);
    });
}


/* =========================================
   OPEN INVOICE DETAILS
========================================= */

function openInvoiceModal(id) {

    const invoice =
        invoices.find(
            item => item.id === id
        );


    if (!invoice) {
        return;
    }


    viewingInvoiceId = id;


    const outstanding =
        Math.max(
            invoice.totalAmount -
            invoice.amountPaid,
            0
        );


    invoiceDetails.innerHTML = `

        <div class="detail-row">
            <span>Invoice</span>
            <strong>
                INV-${invoice.id}
            </strong>
        </div>

        <div class="detail-row">
            <span>Customer</span>
            <strong>
                ${invoice.customer}
            </strong>
        </div>

        <div class="detail-row">
            <span>Source</span>
            <strong>
                ${invoice.source}
            </strong>
        </div>

        <div class="detail-row">
            <span>Reference</span>
            <strong>
                ${invoice.reference}
            </strong>
        </div>

        <div class="detail-row">
            <span>Room Charges</span>
            <strong>
                ${formatMoney(invoice.roomCharges)}
            </strong>
        </div>

        <div class="detail-row">
            <span>Event Charges</span>
            <strong>
                ${formatMoney(invoice.eventCharges)}
            </strong>
        </div>

        <div class="detail-row">
            <span>Additional Charges</span>
            <strong>
                ${formatMoney(invoice.additionalCharges)}
            </strong>
        </div>

        <div class="detail-row">
            <span>Total Amount</span>
            <strong>
                ${formatMoney(invoice.totalAmount)}
            </strong>
        </div>

        <div class="detail-row">
            <span>Amount Paid</span>
            <strong>
                ${formatMoney(invoice.amountPaid)}
            </strong>
        </div>

        <div class="detail-row total">
            <span>Outstanding</span>
            <strong>
                ${formatMoney(outstanding)}
            </strong>
        </div>

        <div class="detail-row">
            <span>Issued Date</span>
            <strong>
                ${formatDate(invoice.issuedDate)}
            </strong>
        </div>
    `;


    paymentAmount.value =
        invoice.amountPaid;


    paymentStatus.value =
        invoice.paymentStatus;


    invoiceModal.classList.add("show");
}


function closeInvoiceModal() {

   invoiceModal.classList.remove("show");
    viewingInvoiceId = null;
}


/* =========================================
   RECORD PAYMENT
========================================= */

function recordPayment() {

    if (!viewingInvoiceId) {
        return;
    }


    const invoice =
        invoices.find(
            item =>
                item.id ===
                viewingInvoiceId
        );


    if (!invoice) {
        return;
    }


    const amount =
        Number(paymentAmount.value);


    if (
        Number.isNaN(amount) ||
        amount < 0
    ) {

        alert(
            "Please enter a valid payment amount."
        );

        return;
    }


    if (amount > invoice.totalAmount) {

        alert(
            "Payment cannot exceed the invoice total."
        );

        return;
    }


    invoice.amountPaid =
        amount;


    if (amount === 0) {

        invoice.paymentStatus =
            "Unpaid";

    } else if (
        amount >= invoice.totalAmount
    ) {

        invoice.paymentStatus =
            "Paid";

    } else {

        invoice.paymentStatus =
            "Partially Paid";
    }


    closeInvoiceModal();

    renderAll();
}


/* =========================================
   CUSTOMER OPTIONS
========================================= */

function populateCustomers() {

    const select =
        document.getElementById(
            "invoiceCustomer"
        );


    customers.forEach(customer => {

        const option =
            document.createElement("option");

        option.value =
            customer;

        option.textContent =
            customer;

        select.appendChild(option);
    });
}


/* =========================================
   GENERATE INVOICE MODAL
========================================= */

function openGenerateInvoiceModal() {

    generateInvoiceForm.reset();

    invoiceFormError.textContent = "";

    updateInvoiceTotalPreview();

   generateInvoiceModal.classList.add("show");
}


function closeGenerateInvoiceModal() {

    generateInvoiceModal.classList.remove("show");
}


/* =========================================
   INVOICE TOTAL PREVIEW
========================================= */

function updateInvoiceTotalPreview() {

    const room =
        Number(
            document.getElementById(
                "newRoomCharges"
            ).value
        ) || 0;


    const event =
        Number(
            document.getElementById(
                "newEventCharges"
            ).value
        ) || 0;


    const additional =
        Number(
            document.getElementById(
                "newAdditionalCharges"
            ).value
        ) || 0;


    const total =
        room +
        event +
        additional;


    document.getElementById(
        "newInvoiceTotal"
    ).textContent =
        formatMoney(total);
}


/* =========================================
   GENERATE INVOICE
========================================= */

function generateInvoice() {

    const customer =
        document.getElementById(
            "invoiceCustomer"
        ).value;


    const source =
        document.getElementById(
            "invoiceSource"
        ).value;


    const reference =
        document.getElementById(
            "reservationReference"
        ).value.trim();


    const roomCharges =
        Number(
            document.getElementById(
                "newRoomCharges"
            ).value
        ) || 0;


    const eventCharges =
        Number(
            document.getElementById(
                "newEventCharges"
            ).value
        ) || 0;


    const additionalCharges =
        Number(
            document.getElementById(
                "newAdditionalCharges"
            ).value
        ) || 0;


    if (!customer) {

        invoiceFormError.textContent =
            "Please select a customer.";

        return;
    }


    if (!reference) {

        invoiceFormError.textContent =
            "Please enter a reservation or booking reference.";

        return;
    }


    if (
        roomCharges === 0 &&
        eventCharges === 0 &&
        additionalCharges === 0
    ) {

        invoiceFormError.textContent =
            "At least one charge must be greater than zero.";

        return;
    }


    const totalAmount =
        roomCharges +
        eventCharges +
        additionalCharges;


    invoices.push({

        id: nextInvoiceId++,

        customer,

        source,

        reference,

        roomCharges,

        eventCharges,

        additionalCharges,

        totalAmount,

        paymentStatus: "Unpaid",

        amountPaid: 0,

        issuedDate:
            new Date()
                .toISOString()
                .split("T")[0]
    });


    closeGenerateInvoiceModal();

    renderAll();
}


/* =========================================
   TABLE ACTIONS
========================================= */

invoiceTableBody.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest("button");

        if (!button) {
            return;
        }


        const id =
            Number(
                button.dataset.id
            );


        if (
            button.dataset.action ===
            "view"
        ) {

            openInvoiceModal(id);
        }
    }
);


/* =========================================
   EVENT LISTENERS
========================================= */

invoiceSearch.addEventListener(
    "input",
    renderInvoices
);


paymentStatusFilter.addEventListener(
    "change",
    renderInvoices
);


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
        "cancelInvoiceModal"
    )
    .addEventListener(
        "click",
        closeInvoiceModal
    );


invoiceModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            invoiceModal
        ) {

            closeInvoiceModal();
        }
    }
);


document
    .getElementById(
        "savePaymentButton"
    )
    .addEventListener(
        "click",
        recordPayment
    );


document
    .getElementById(
        "generateInvoiceButton"
    )
    .addEventListener(
        "click",
        openGenerateInvoiceModal
    );


document
    .getElementById(
        "closeGenerateInvoiceModal"
    )
    .addEventListener(
        "click",
        closeGenerateInvoiceModal
    );


document
    .getElementById(
        "cancelGenerateInvoice"
    )
    .addEventListener(
        "click",
        closeGenerateInvoiceModal
    );


generateInvoiceModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            generateInvoiceModal
        ) {

            closeGenerateInvoiceModal();
        }
    }
);


generateInvoiceForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        generateInvoice();
    }
);


/* Charge preview */

[
    "newRoomCharges",
    "newEventCharges",
    "newAdditionalCharges"
].forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "input",
            updateInvoiceTotalPreview
        );
});


/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

    calculateTotals();

    renderInvoices();
}


/* =========================================
   INITIALIZE
========================================= */

populateCustomers();

renderAll();