const API = "http://localhost:3000/api";


/* -----------AUTHENTICATION / API---------------- */

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
                "Authorization": `Bearer ${token}`
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


/* --------DATA------------------- */

let invoices = [];

let viewingInvoiceId = null;


/*-------------------DOM ELEMENTS----------- */

const invoiceTableBody =
    document.getElementById(
        "invoiceTableBody"
    );


const invoiceSearch =
    document.getElementById(
        "invoiceSearch"
    );


const paymentStatusFilter =
    document.getElementById(
        "paymentStatusFilter"
    );


const invoiceModal =
    document.getElementById(
        "invoiceModal"
    );


const invoiceDetails =
    document.getElementById(
        "invoiceDetails"
    );


const paymentAmount =
    document.getElementById(
        "paymentAmount"
    );


const paymentStatus =
    document.getElementById(
        "paymentStatus"
    );


/* ============================================================
   HELPERS
   ============================================================ */

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


function formatMoney(amount) {

    return `$ ${Number(amount || 0).toLocaleString(
        "en-GH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


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


function getStatusClass(status) {

    if (!status) {
        return "";
    }

    return String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");
}


/* -------------LOAD REAL INVOICES-------------*/

async function loadInvoicesFromAPI() {

    try {

        const data =
            await apiFetch(
                "/invoices"
            );

        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid invoice data received from server."
            );
        }


        invoices =
            data.map(invoice => ({

                id:
                    Number(
                        invoice.InvoiceID
                    ),


                customer:
                    invoice.CustomerName ||
                    "Unknown Customer",


                source:
                    invoice.ReservationID
                        ? "Room Reservation"
                        : "Event Booking",


                reference:
                    invoice.Reference ||
                    (
                        invoice.ReservationID
                            ? `RES-${invoice.ReservationID}`
                            : `EVT-${invoice.EventID}`
                    ),


                roomCharges:
                    Number(
                        invoice.RoomCharges || 0
                    ),


                eventCharges:
                    Number(
                        invoice.EventCharges || 0
                    ),


                additionalCharges:
                    Number(
                        invoice.AdditionalCharges || 0
                    ),


                totalAmount:
                    Number(
                        invoice.TotalAmount || 0
                    ),

                    paymentStatus:
    invoice.PaymentStatus || "Unpaid",

amountPaid:
    Number(
        invoice.AmountPaid || 0
    ),


                issuedDate:
                    invoice.IssuedDate,


                reservationId:
                    invoice.ReservationID || null,


                eventId:
                    invoice.EventID || null

            }));


        return true;

    } catch (error) {

        console.error(
            "Unable to load invoices:",
            error
        );


        if (invoiceTableBody) {

            invoiceTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-row"
                    >
                        Unable to load invoices.
                        Please refresh the page.
                    </td>
                </tr>
            `;
        }


        return false;
    }
}


/* ---------FINANCIAL TOTALS------------- */

function calculateTotals() {

    const totalBilled =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.totalAmount || 0
                ),
            0
        );


    const totalPaid =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.amountPaid || 0
                ),
            0
        );


    const totalOutstanding =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Math.max(
                    Number(
                        invoice.totalAmount || 0
                    ) -
                    Number(
                        invoice.amountPaid || 0
                    ),
                    0
                ),
            0
        );


    const roomCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.roomCharges || 0
                ),
            0
        );


    const eventCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.eventCharges || 0
                ),
            0
        );


    const additionalCharges =
        invoices.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.additionalCharges || 0
                ),
            0
        );


    const totalBilledElement =
        document.getElementById(
            "totalBilled"
        );

    const totalPaidElement =
        document.getElementById(
            "totalPaid"
        );

    const outstandingElement =
        document.getElementById(
            "totalOutstanding"
        );

    const totalInvoicesElement =
        document.getElementById(
            "totalInvoices"
        );


    if (totalBilledElement) {
        totalBilledElement.textContent =
            formatMoney(totalBilled);
    }


    if (totalPaidElement) {
        totalPaidElement.textContent =
            formatMoney(totalPaid);
    }


    if (outstandingElement) {
        outstandingElement.textContent =
            formatMoney(totalOutstanding);
    }


    if (totalInvoicesElement) {
        totalInvoicesElement.textContent =
            invoices.length;
    }


    const roomChargesElement =
        document.getElementById(
            "roomChargesTotal"
        );

    const eventChargesElement =
        document.getElementById(
            "eventChargesTotal"
        );

    const additionalChargesElement =
        document.getElementById(
            "additionalChargesTotal"
        );


    if (roomChargesElement) {
        roomChargesElement.textContent =
            formatMoney(roomCharges);
    }


    if (eventChargesElement) {
        eventChargesElement.textContent =
            formatMoney(eventCharges);
    }


    if (additionalChargesElement) {
        additionalChargesElement.textContent =
            formatMoney(additionalCharges);
    }


    const paidCount =
        invoices.filter(
            invoice =>
                invoice.paymentStatus === "Paid"
        ).length;


    const unpaidCount =
        invoices.filter(
            invoice =>
                invoice.paymentStatus === "Unpaid"
        ).length;


    const partialCount =
        invoices.filter(
            invoice =>
                invoice.paymentStatus ===
                "Partially Paid"
        ).length;


    const paidInvoiceCount =
        document.getElementById(
            "paidInvoiceCount"
        );

    const unpaidInvoiceCount =
        document.getElementById(
            "unpaidInvoiceCount"
        );

    const partialInvoiceCount =
        document.getElementById(
            "partialInvoiceCount"
        );

    const overdueInvoiceCount =
        document.getElementById(
            "overdueInvoiceCount"
        );


    if (paidInvoiceCount) {
        paidInvoiceCount.textContent =
            paidCount;
    }


    if (unpaidInvoiceCount) {
        unpaidInvoiceCount.textContent =
            unpaidCount;
    }


    if (partialInvoiceCount) {
        partialInvoiceCount.textContent =
            partialCount;
    }

    if (overdueInvoiceCount) {
        overdueInvoiceCount.textContent = "0";
    }
}


/* -------------FILTERING---------------- */

function getFilteredInvoices() {

    const search =
        invoiceSearch
            ? invoiceSearch.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        paymentStatusFilter
            ? paymentStatusFilter.value
            : "all";


    return invoices.filter(
        invoice => {

            const matchesStatus =
                status === "all" ||
                invoice.paymentStatus ===
                    status;


            const customer =
                String(
                    invoice.customer || ""
                ).toLowerCase();


            const source =
                String(
                    invoice.source || ""
                ).toLowerCase();


            const reference =
                String(
                    invoice.reference || ""
                ).toLowerCase();


            const invoiceNumber =
                `inv-${invoice.id}`;


            const matchesSearch =
                customer.includes(search) ||
                source.includes(search) ||
                reference.includes(search) ||
                invoiceNumber.includes(search);


            return (
                matchesStatus &&
                matchesSearch
            );
        }
    );
}


/* ----------RENDER INVOICES----------- */

function renderInvoices() {

    if (!invoiceTableBody) {
        return;
    }


    invoiceTableBody.innerHTML = "";


    const filtered =
        getFilteredInvoices();


    if (!filtered.length) {

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


    filtered.forEach(
        invoice => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    <strong>
                        INV-${escapeHTML(
                            invoice.id
                        )}
                    </strong>
                </td>


                <td>

                    <strong>
                        ${escapeHTML(
                            invoice.source
                        )}
                    </strong>

                    <small class="finance-reference">
                        ${escapeHTML(
                            invoice.reference
                        )}
                    </small>

                </td>


                <td>
                    ${escapeHTML(
                        invoice.customer
                    )}
                </td>


                <td>
                    ${formatMoney(
                        invoice.totalAmount
                    )}
                </td>


                <td>

                    <span
                        class="status-badge
                        ${getStatusClass(
                            invoice.paymentStatus
                        )}"
                    >
                        ${escapeHTML(
                            invoice.paymentStatus
                        )}
                    </span>

                </td>


                <td>
                    ${formatDate(
                        invoice.issuedDate
                    )}
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
        }
    );
}


/* --------------VIEW INVOICE------------- */

function openInvoiceModal(id) {

    const invoice =
        invoices.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!invoice) {
        return;
    }


    viewingInvoiceId =
        Number(id);


    const outstanding =
        Math.max(
            Number(
                invoice.totalAmount || 0
            ) -
            Number(
                invoice.amountPaid || 0
            ),
            0
        );


    if (invoiceDetails) {

        invoiceDetails.innerHTML = `

            <div class="detail-row">
                <span>Invoice</span>
                <strong>
                    INV-${escapeHTML(
                        invoice.id
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Customer</span>
                <strong>
                    ${escapeHTML(
                        invoice.customer
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Source</span>
                <strong>
                    ${escapeHTML(
                        invoice.source
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Reference</span>
                <strong>
                    ${escapeHTML(
                        invoice.reference
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Room Charges</span>
                <strong>
                    ${formatMoney(
                        invoice.roomCharges
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Event Charges</span>
                <strong>
                    ${formatMoney(
                        invoice.eventCharges
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Additional Charges</span>
                <strong>
                    ${formatMoney(
                        invoice.additionalCharges
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Total Amount</span>
                <strong>
                    ${formatMoney(
                        invoice.totalAmount
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Amount Paid</span>
                <strong>
                    ${formatMoney(
                        invoice.amountPaid
                    )}
                </strong>
            </div>


            <div class="detail-row total">
                <span>Outstanding</span>
                <strong>
                    ${formatMoney(
                        outstanding
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Payment Status</span>
                <strong>
                    ${escapeHTML(
                        invoice.paymentStatus
                    )}
                </strong>
            </div>


            <div class="detail-row">
                <span>Issued Date</span>
                <strong>
                    ${formatDate(
                        invoice.issuedDate
                    )}
                </strong>
            </div>

        `;
    }

    if (paymentAmount) {

        paymentAmount.value = "";

        paymentAmount.max =
            Math.max(
                Number(
                    invoice.totalAmount || 0
                ) -
                Number(
                    invoice.amountPaid || 0
                ),
                0
            );
    }


    if (paymentStatus) {

        paymentStatus.value =
            invoice.paymentStatus;
    }


    if (invoiceModal) {
        invoiceModal.classList.add("show");
    }
}


/* ----------CLOSE INVOICE MODAL---------------*/

function closeInvoiceModal() {

    if (invoiceModal) {
        invoiceModal.classList.remove("show");
    }

    viewingInvoiceId = null;
}


/* -------------RECORD PAYMENT----------- */

async function recordPayment() {

    if (!viewingInvoiceId) {
        return;
    }


    const invoice =
        invoices.find(
            item =>
                Number(item.id) ===
                Number(viewingInvoiceId)
        );


    if (!invoice) {
        return;
    }


    const amount =
        Number(
            paymentAmount
                ? paymentAmount.value
                : 0
        );


    if (
        Number.isNaN(amount) ||
        amount <= 0
    ) {

        alert(
            "Please enter a valid payment amount."
        );

        return;
    }


    const outstanding =
        Math.max(
            Number(
                invoice.totalAmount || 0
            ) -
            Number(
                invoice.amountPaid || 0
            ),
            0
        );


    if (amount > outstanding) {

        alert(
            `Payment cannot exceed the outstanding amount of ${formatMoney(outstanding)}.`
        );

        return;
    }


    try {

        await apiFetch(
            `/invoices/${invoice.id}/pay`,
            {
                method: "POST",

                body:
                    JSON.stringify({
                        AmountPaid:
                            amount
                    })
            }
        );


        closeInvoiceModal();

        const loaded =
            await loadInvoicesFromAPI();


        if (loaded) {
            renderAll();
        }


    } catch (error) {

        console.error(
            "Record payment error:",
            error
        );


        alert(
            error.message ||
            "Unable to record payment."
        );
    }
}


/* ---------TABLE ACTIONS-----------*/

if (invoiceTableBody) {

    invoiceTableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button"
                );


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
}


/* -----------SEARCH---------- */

if (invoiceSearch) {

    invoiceSearch.addEventListener(
        "input",
        renderInvoices
    );
}


/* -------PAYMENT STATUS FILTER---------- */

if (paymentStatusFilter) {

    paymentStatusFilter.addEventListener(
        "change",
        renderInvoices
    );
}


/* -----INVOICE MODAL------------ */

const closeInvoiceButton =
    document.getElementById(
        "closeInvoiceModal"
    );


if (closeInvoiceButton) {

    closeInvoiceButton.addEventListener(
        "click",
        closeInvoiceModal
    );
}


const cancelInvoiceButton =
    document.getElementById(
        "cancelInvoiceModal"
    );


if (cancelInvoiceButton) {

    cancelInvoiceButton.addEventListener(
        "click",
        closeInvoiceModal
    );
}


if (invoiceModal) {

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
}


/* -----------RECORD PAYMENT BUTTON------------= */

const savePaymentButton =
    document.getElementById(
        "savePaymentButton"
    );


if (savePaymentButton) {

    savePaymentButton.addEventListener(
        "click",
        recordPayment
    );
}


/* ------------RENDER -------*/

function renderAll() {

    calculateTotals();

    renderInvoices();
}


/* ------INITIALIZE-------- */

async function initializeFinance() {

    const loaded =
        await loadInvoicesFromAPI();


    if (!loaded) {
        return;
    }


    renderAll();
}


initializeFinance();