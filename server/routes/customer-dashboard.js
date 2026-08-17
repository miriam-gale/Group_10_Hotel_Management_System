const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireCustomer } = require('../middleware/auth');

// GET /api/customer/dashboard
// Returns dashboard information for the logged-in customer only.
router.get('/dashboard', verifyToken, requireCustomer, async (req, res) => {
    const customerID = req.user.id;

    try {
        // Active room bookings
        const [[bookingSummary]] = await pool.query(`
            SELECT COUNT(*) AS ActiveBookings
            FROM RESERVATION
            WHERE CustomerID = ?
              AND Status IN ('Confirmed', 'Checked-In')
        `, [customerID]);

        // Upcoming confirmed events
        const [[eventSummary]] = await pool.query(`
            SELECT COUNT(*) AS UpcomingEvents
            FROM EVENT_BOOKING
            WHERE CustomerID = ?
              AND Status = 'Confirmed'
              AND EventDate >= CURDATE()
        `, [customerID]);

        // Customer's invoice summary
        const [[invoiceSummary]] = await pool.query(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN PaymentStatus IN ('Unpaid', 'Partially Paid')
                            THEN GREATEST(
                                COALESCE(TotalAmount, 0) -
                                COALESCE(AmountPaid, 0),
                                0
                            )
                            ELSE 0
                        END
                    ),
                    0
                ) AS OutstandingBalance,

                COALESCE(
                    SUM(
                        CASE
                            WHEN PaymentStatus = 'Paid'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS PaidInvoices

            FROM INVOICE i
            LEFT JOIN RESERVATION r
                ON i.ReservationID = r.ReservationID
            LEFT JOIN EVENT_BOOKING e
                ON i.EventID = e.EventID
            WHERE r.CustomerID = ?
               OR e.CustomerID = ?
        `, [customerID, customerID]);

        res.json({
            activeBookings: Number(bookingSummary.ActiveBookings || 0),
            upcomingEvents: Number(eventSummary.UpcomingEvents || 0),
            outstandingBalance: Number(invoiceSummary.OutstandingBalance || 0),
            paidInvoices: Number(invoiceSummary.PaidInvoices || 0)
        });

    } catch (err) {
        console.error('Customer dashboard error:', err);

        res.status(500).json({
            error: 'Unable to load customer dashboard.'
        });
    }
});

module.exports = router;
