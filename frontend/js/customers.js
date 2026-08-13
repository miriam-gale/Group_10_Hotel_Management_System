let customers = [
    {
        id: 1,
        firstName: "Kwame",
        lastName: "Mensah",
        contactNumber: "0244123456",
        email: "kwame.mensah@email.com",
        registrationDate: "2026-01-12"
    },
    {
        id: 2,
        firstName: "Akosua",
        lastName: "Boateng",
        contactNumber: "0201234567",
        email: "akosua.boateng@email.com",
        registrationDate: "2026-02-03"
    },
    {
        id: 3,
        firstName: "James",
        lastName: "Anderson",
        contactNumber: "0559876543",
        email: "james.anderson@email.com",
        registrationDate: "2026-03-18"
    },
    {
        id: 4,
        firstName: "Ama",
        lastName: "Serwaa",
        contactNumber: "0275551212",
        email: "ama.serwaa@email.com",
        registrationDate: "2026-04-22"
    },
    {
        id: 5,
        firstName: "Michael",
        lastName: "Owusu",
        contactNumber: "0248883344",
        email: "michael.owusu@email.com",
        registrationDate: "2026-05-09"
    }
];

let nextCustomerId = 6;
let customerModalMode = "add";
let editingCustomerId = null;

const customerTableBody = document.getElementById("customerTableBody");
const customerSearch = document.getElementById("customerSearch");
const customerModal = document.getElementById("customerModal");
const customerForm = document.getElementById("customerForm");
const customerFormError = document.getElementById("customerFormError");
const customerModalTitle = document.getElementById("customerModalTitle");
const saveCustomerButton = document.getElementById("saveCustomerButton");

function getCustomers() {
    return customers;
}

function createCustomer(data) {
    const customer = {
        id: nextCustomerId,
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        email: data.email,
        registrationDate: data.registrationDate
    };

    nextCustomerId = nextCustomerId + 1;
    customers.push(customer);
    return customer;
}

function updateCustomer(id, data) {
    const customer = customers.find(function (item) {
        return item.id === id;
    });

    if (!customer) {
        return;
    }

    customer.firstName = data.firstName;
    customer.lastName = data.lastName;
    customer.contactNumber = data.contactNumber;
    customer.email = data.email;
    customer.registrationDate = data.registrationDate;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFilteredCustomers() {
    const search = customerSearch.value.trim().toLowerCase();
    const list = getCustomers();

    if (search === "") {
        return list;
    }

    return list.filter(function (customer) {
        const fullName = (customer.firstName + " " + customer.lastName).toLowerCase();
        return fullName.indexOf(search) !== -1
            || customer.email.toLowerCase().indexOf(search) !== -1
            || customer.contactNumber.indexOf(search) !== -1;
    });
}

function renderCustomers() {
    const list = getFilteredCustomers();
    customerTableBody.innerHTML = "";

    if (list.length === 0) {
        customerTableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No customers found.</td></tr>';
        return;
    }

    list.forEach(function (customer) {
        const row = document.createElement("tr");
        row.innerHTML =
            "<td>" + customer.firstName + " " + customer.lastName + "</td>" +
            "<td>" + customer.contactNumber + "</td>" +
            "<td>" + customer.email + "</td>" +
            "<td>" + formatDate(customer.registrationDate) + "</td>" +
            "<td>" +
                '<button type="button" class="action-button" data-action="view" data-id="' + customer.id + '">View</button>' +
                '<button type="button" class="action-button" data-action="edit" data-id="' + customer.id + '">Edit</button>' +
            "</td>";
        customerTableBody.appendChild(row);
    });
}

function setCustomerFormDisabled(disabled) {
    document.getElementById("firstName").disabled = disabled;
    document.getElementById("lastName").disabled = disabled;
    document.getElementById("contactNumber").disabled = disabled;
    document.getElementById("email").disabled = disabled;
    document.getElementById("registrationDate").disabled = disabled;
    saveCustomerButton.style.display = disabled ? "none" : "inline-block";
}

function fillCustomerForm(customer) {
    document.getElementById("firstName").value = customer ? customer.firstName : "";
    document.getElementById("lastName").value = customer ? customer.lastName : "";
    document.getElementById("contactNumber").value = customer ? customer.contactNumber : "";
    document.getElementById("email").value = customer ? customer.email : "";
    document.getElementById("registrationDate").value = customer ? customer.registrationDate : "";
}

function openCustomerModal(mode, id) {
    customerModalMode = mode;
    editingCustomerId = id || null;
    customerFormError.textContent = "";

    const customer = id
        ? customers.find(function (item) { return item.id === id; })
        : null;

    if (mode === "add") {
        customerModalTitle.textContent = "Add Customer";
        fillCustomerForm(null);
        setCustomerFormDisabled(false);
    } else if (mode === "edit") {
        customerModalTitle.textContent = "Edit Customer";
        fillCustomerForm(customer);
        setCustomerFormDisabled(false);
    } else {
        customerModalTitle.textContent = "Customer Details";
        fillCustomerForm(customer);
        setCustomerFormDisabled(true);
    }

    customerModal.classList.add("open");
}

function closeCustomerModal() {
    customerModal.classList.remove("open");
}

function getCustomerFormData() {
    return {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        contactNumber: document.getElementById("contactNumber").value.trim(),
        email: document.getElementById("email").value.trim(),
        registrationDate: document.getElementById("registrationDate").value
    };
}

function validateCustomer(data) {
    if (data.firstName === "") {
        return "First name is required.";
    }

    if (data.lastName === "") {
        return "Last name is required.";
    }

    if (data.contactNumber === "") {
        return "Contact number is required.";
    }

    if (data.email === "") {
        return "Email is required.";
    }

    if (!isValidEmail(data.email)) {
        return "Please enter a valid email address.";
    }

    if (data.registrationDate === "") {
        return "Registration date is required.";
    }

    return "";
}

document.getElementById("addCustomerButton").addEventListener("click", function () {
    openCustomerModal("add");
});

document.getElementById("closeCustomerModal").addEventListener("click", closeCustomerModal);
document.getElementById("cancelCustomerModal").addEventListener("click", closeCustomerModal);

customerModal.addEventListener("click", function (event) {
    if (event.target === customerModal) {
        closeCustomerModal();
    }
});

customerSearch.addEventListener("input", renderCustomers);

customerTableBody.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const id = Number(button.getAttribute("data-id"));
    const action = button.getAttribute("data-action");

    if (action === "view") {
        openCustomerModal("view", id);
    }

    if (action === "edit") {
        openCustomerModal("edit", id);
    }
});

customerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (customerModalMode === "view") {
        return;
    }

    const data = getCustomerFormData();
    const error = validateCustomer(data);

    if (error !== "") {
        customerFormError.textContent = error;
        return;
    }

    if (customerModalMode === "add") {
        createCustomer(data);
    } else {
        updateCustomer(editingCustomerId, data);
    }

    closeCustomerModal();
    renderCustomers();
});

renderCustomers();
