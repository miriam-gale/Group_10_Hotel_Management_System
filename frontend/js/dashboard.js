document.addEventListener("DOMContentLoaded", async () => {

    const dateElement = document.getElementById("dashboardDate");

if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

await loadDashboardData();
loadOccupancyChart();

    
});


async function loadDashboardData() {
    const token =
        sessionStorage.getItem("mgr_token") ||
        localStorage.getItem("token");

    if (!token) {
        console.error("No authentication token found.");
        return;
    }

    try {
        const response = await fetch("/api/reports/dashboard", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Dashboard request failed: ${response.status}`);
        }

        const data = await response.json();

        const occupancy = data.occupancy || {};
        const guests = data.guests || {};
        const todayActivity = data.todayActivity || {};
        const revenue = data.revenue || {};

        // -----------------------------
        // Statistic cards
        // -----------------------------

        setText(
            "totalRooms",
            occupancy.TotalRooms || 0
        );

        setText(
            "todayBookings",
            todayActivity.TodayBookings || 0
        );

        setText(
            "checkedIn",
            guests.CurrentGuests || 0
        );

        setText(
            "todayRevenue",
            formatCurrency(revenue.TodayRevenue || 0)
        );

        // -----------------------------
        // Room status
        // -----------------------------

        setText(
            "statusTotalRooms",
            occupancy.TotalRooms || 0
        );

        setText(
            "availableRooms",
            occupancy.Available || 0
        );

        setText(
            "occupiedRooms",
            occupancy.Occupied || 0
        );

        setText(
            "reservedRooms",
            occupancy.Reserved || 0
        );

        setText(
            "maintenanceRooms",
            occupancy.UnderMaintenance || 0
        );

    } catch (error) {
        console.error("Unable to load dashboard data:", error);
    }
}


// ----------------------------------------
// Helper: safely update an element
// ----------------------------------------

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ----------------------------------------
// Currency formatting
// ----------------------------------------

function formatCurrency(amount) {
    return `$ ${Number(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


// ----------------------------------------
// Occupancy Chart
// ----------------------------------------

function loadOccupancyChart() {
    const occupancyCanvas =
        document.getElementById("occupancyChart");

    if (!occupancyCanvas) {
        return;
    }

    new Chart(occupancyCanvas, {
        type: "line",

        data: {
            labels: [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ],

            datasets: [
                {
                    label: "Occupancy",

                    data: [
                        62,
                        68,
                        74,
                        70,
                        78,
                        85,
                        72
                    ],

                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + "% occupancy";
                        }
                    }
                }
            },

            scales: {
                y: {
                    min: 0,
                    max: 100,

                    ticks: {
                        callback: function(value) {
                            return value + "%";
                        }
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}