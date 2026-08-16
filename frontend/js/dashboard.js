const API = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", async () => {

    // ============================================================
    // SET TODAY'S DATE
    // ============================================================

    const dateElement = document.getElementById("dashboardDate");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // ============================================================
    // LOAD LIVE DASHBOARD DATA
    // ============================================================

    await loadDashboardData();


    // ============================================================
    // LOAD OCCUPANCY CHART
    // ============================================================

    loadOccupancyChart();

});


// ============================================================
// LOAD DASHBOARD DATA
// ============================================================

async function loadDashboardData() {

    const token =
        sessionStorage.getItem("mgr_token") ||
        localStorage.getItem("token");

    console.log(
        "Dashboard token:",
        token ? "FOUND" : "NOT FOUND"
    );


    if (!token) {
        console.error("No authentication token found.");
        return;
    }


    try {

        const response = await fetch(
            `${API}/reports/dashboard`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        console.log(
            "Dashboard API response status:",
            response.status
        );


        const data = await response.json();


        console.log(
            "Dashboard API data:",
            data
        );


        if (!response.ok) {
            throw new Error(
                data.error ||
                `Dashboard request failed: ${response.status}`
            );
        }


        // ========================================================
        // MAIN DASHBOARD CARDS
        // ========================================================

        // Total number of rooms in the hotel
        setText(
            "totalRooms",
            Number(data.totalRooms || 0)
        );


        // Number of rooms currently occupied by checked-in guests
        setText(
            "checkedIn",
            Number(data.checkedInRooms || 0)
        );


        // Revenue made today
        setText(
            "todayRevenue",
            formatCurrency(data.todayRevenue || 0)
        );


        // ========================================================
        // ROOM STATUS
        // ========================================================

        const roomStatus =
            data.roomStatus || {};


        setText(
            "statusTotalRooms",
            Number(data.totalRooms || 0)
        );


        setText(
            "availableRooms",
            Number(roomStatus.available || 0)
        );


        setText(
            "occupiedRooms",
            Number(roomStatus.occupied || 0)
        );


        setText(
            "reservedRooms",
            Number(roomStatus.reserved || 0)
        );


        setText(
            "maintenanceRooms",
            Number(roomStatus.underMaintenance || 0)
        );


        console.log(
            "Dashboard updated successfully."
        );

    } catch (error) {

        console.error(
            "Unable to load dashboard data:",
            error
        );

    }

}


// ============================================================
// SAFELY UPDATE DASHBOARD ELEMENT
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent = value;

    } else {

        console.warn(
            `Dashboard element #${id} was not found.`
        );

    }

}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(amount) {

    return `$ ${Number(amount || 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;

}


// ============================================================
// OCCUPANCY CHART
// ============================================================

function loadOccupancyChart() {

    const occupancyCanvas =
        document.getElementById("occupancyChart");


    if (!occupancyCanvas) {
        return;
    }


    new Chart(
        occupancyCanvas,
        {
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

                                return (
                                    context.parsed.y +
                                    "% occupancy"
                                );

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

        }
    );

}