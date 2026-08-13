const occupancyCanvas = document.getElementById("occupancyChart");

if (occupancyCanvas) {

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