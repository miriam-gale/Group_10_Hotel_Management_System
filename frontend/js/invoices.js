let invoices = [
    {
        id: 1,
        reservationId: 101,
        eventId: null,
        roomCharges: 2400,
        eventCharges: 0,
        additionalCharges: 150,
        totalAmount: 2550,
        paymentStatus: "Paid",
        issuedDate: "2026-08-13"
    },
    {
        id: 2,
        reservationId: null,
        eventId: 1,
        roomCharges: 0,
        eventCharges: 2800,
        additionalCharges: 200,
        totalAmount: 3000,
        paymentStatus: "Unpaid",
        issuedDate: "2026-08-10"
    },
    {
        id: 3,
        reservationId: 102,
        eventId: null,
        roomCharges: 4000,
        eventCharges: 0,
        additionalCharges: 0,
        totalAmount: 4000,
        paymentStatus: "Paid",
        issuedDate: "2026-08-12"
    },
    {
        id: 4,
        reservationId: null,
        eventId: 2,
        roomCharges: 0,
        eventCharges: 6400,
        additionalCharges: 500,
        totalAmount: 6900,
        paymentStatus: "Overdue",
        issuedDate: "2026-08-01"
    },
    {
        id: 5,
        reservationId: 103,
        eventId: null,
        roomCharges: 1200,
        eventCharges: 0,
        additionalCharges: 80,
        totalAmount: 1280,
        paymentStatus: "Unpaid",
        issuedDate: "2026-08-13"
    }
];

let viewingInvoiceId = null;

const invoiceTableBody = document.getElementById("invoiceTableBody");
const invoiceSearch = document.getElementById("invoiceSearch");
const paymentStatusFilter = document.getElementById("paymentStatusFilter");
const invoiceModal = document.getElementById("invoiceModal");
const invoiceDetails = document.getElementById("invoiceDetails");
const paymentStatusSelect = document.getElementById("paymentStatus");

function getInvoices() {
    return invoices;
}

function updateInvoicePayment(id, paymentStatus) {
    const invoice = invoices.find(function (item) {
        return item.id === id;
    });

    if (!invoice) {
        return;
    }

    invoice.paymentStatus = paymentStatus;
}

function formatMoney(amount) {
    return "GH₵ " + Number(amount).toLocaleString();
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function getSourceLabel(invoice) {
    if (invoice.reservationId && invoice.eventId) {
        return "Reservation #" + invoice.reservationId + " / Event #" + invoice.eventId;
    }

    if (invoice.reservationId) {
        return "Reservation #" + invoice.reservationId;
    }

    if (invoice.eventId) {
        return "Event #" + invoice.eventId;
    }

    return "—";
}

function getFilteredInvoices() {
    const search = invoiceSearch.value.trim().toLowerCase();
    const status = paymentStatusFilter.value;
    let list = getInvoices();

    if (status !== "all") {
        list = list.filter(function (invoice) {
            return invoice.paymentStatus === status;
        });
    }

    if (search === "") {
        return list;
    }

    return list.filter(function (invoice) {
        const invoiceLabel = "INV-" + invoice.id;
        const source = getSourceLabel(invoice).toLowerCase();
        return invoiceLabel.toLowerCase().indexOf(search) !== -1
            || source.indexOf(search) !== -1
            || String(invoice.reservationId || "").indexOf(search) !== -1
            || String(invoice.eventId || "").indexOf(search) !== -1;
    });
}

function paymentBadgeClass(status) {
    return status.toLowerCase();
}

function renderInvoices() {
    const list = getFilteredInvoices();
    invoiceTableBody.innerHTML = "";

    if (list.length === 0) {
        invoiceTableBody.innerHTML = '<tr class="empty-row"><td colspan="6">No invoices found.</td></tr>';
        return;
    }

    list.forEach(function (invoice) {
        const row = document.createElement("tr");
        row.innerHTML =
            "<td>INV-" + invoice.id + "</td>" +
            "<td>" + getSourceLabel(invoice) + "</td>" +
            "<td>" + formatMoney(invoice.totalAmount) + "</td>" +
            '<td><span class="status-badge ' + paymentBadgeClass(invoice.paymentStatus) + '">' + invoice.paymentStatus + "</span></td>" +
            "<td>" + formatDate(invoice.issuedDate) + "</td>" +
            "<td>" +
                '<button type="button" class="action-button" data-action="view" data-id="' + invoice.id + '">View</button>' +
            "</td>";
        invoiceTableBody.appendChild(row);
    });
}

function openInvoiceModal(id) {
    const invoice = invoices.find(function (item) {
        return item.id === id;
    });

    if (!invoice) {
        return;
    }

    viewingInvoiceId = id;

    invoiceDetails.innerHTML =
        '<div class="detail-row"><span>Invoice</span><strong>INV-' + invoice.id + "</strong></div>" +
        '<div class="detail-row"><span>Reservation ID</span><strong>' + (invoice.reservationId || "—") + "</strong></div>" +
        '<div class="detail-row"><span>Event ID</span><strong>' + (invoice.eventId || "—") + "</strong></div>" +
        '<div class="detail-row"><span>Room Charges</span><strong>' + formatMoney(invoice.roomCharges) + "</strong></div>" +
        '<div class="detail-row"><span>Event Charges</span><strong>' + formatMoney(invoice.eventCharges) + "</strong></div>" +
        '<div class="detail-row"><span>Additional Charges</span><strong>' + formatMoney(invoice.additionalCharges) + "</strong></div>" +
        '<div class="detail-row total"><span>Total Amount</span><strong>' + formatMoney(invoice.totalAmount) + "</strong></div>" +
        '<div class="detail-row"><span>Issued Date</span><strong>' + formatDate(invoice.issuedDate) + "</strong></div>";

    paymentStatusSelect.value = invoice.paymentStatus;
    invoiceModal.classList.add("open");
}

function closeInvoiceModal() {
    invoiceModal.classList.remove("open");
    viewingInvoiceId = null;
}

document.getElementById("closeInvoiceModal").addEventListener("click", closeInvoiceModal);
document.getElementById("cancelInvoiceModal").addEventListener("click", closeInvoiceModal);

invoiceModal.addEventListener("click", function (event) {
    if (event.target === invoiceModal) {
        closeInvoiceModal();
    }
});

invoiceSearch.addEventListener("input", renderInvoices);
paymentStatusFilter.addEventListener("change", renderInvoices);

invoiceTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const id = Number(button.getAttribute("data-id"));
    const action = button.getAttribute("data-action");

    if (action === "view") {
        openInvoiceModal(id);
    }
});

document.getElementById("savePaymentStatusButton").addEventListener("click", function () {
    if (!viewingInvoiceId) {
        return;
    }

    updateInvoicePayment(viewingInvoiceId, paymentStatusSelect.value);
    closeInvoiceModal();
    renderInvoices();
});

renderInvoices();
