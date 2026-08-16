const express = require('express');
const router = express.Router();

const pool = require('../config/db');

const {
  verifyToken,
  requireStaff,
  requireFinanceStaff,
  requireAdmin
} = require('../middleware/auth');


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/dashboard
// Live Admin Dashboard + Reports Summary
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/dashboard',
  verifyToken,
  requireStaff,
  async (req, res) => {

    try {

      // ============================================================
      // TOTAL NUMBER OF ROOMS
      // ============================================================

      const [[roomSummary]] = await pool.query(`
        SELECT
          COUNT(*) AS TotalRooms
        FROM ROOM
      `);


      // ============================================================
      // CURRENT ROOM STATUS
      // ============================================================

      const [[roomStatus]] = await pool.query(`
        SELECT

          COALESCE(
            SUM(Status = 'Available'),
            0
          ) AS Available,

          COALESCE(
            SUM(Status = 'Reserved'),
            0
          ) AS Reserved,

          COALESCE(
            SUM(Status = 'Occupied'),
            0
          ) AS Occupied,

          COALESCE(
            SUM(Status = 'Under Maintenance'),
            0
          ) AS UnderMaintenance

        FROM ROOM
      `);


      // ============================================================
      // NUMBER OF ROOMS CURRENTLY CHECKED IN
      // ============================================================

      const [[checkedInSummary]] = await pool.query(`
        SELECT
          COUNT(DISTINCT RoomNumber) AS CheckedInRooms
        FROM RESERVATION
        WHERE Status = 'Checked-In'
      `);


      // ============================================================
      // CURRENT GUESTS
      // ============================================================

      const [[guestSummary]] = await pool.query(`
        SELECT

          COUNT(*) AS CurrentGuests,

          COALESCE(
            SUM(NumOccupants),
            0
          ) AS TotalOccupants

        FROM RESERVATION

        WHERE Status = 'Checked-In'
      `);


      // ============================================================
      // TODAY'S RESERVATION ACTIVITY
      // ============================================================

      const [[todayActivity]] = await pool.query(`
        SELECT

          COALESCE(
            SUM(
              DATE(CheckInDate) = CURDATE()
            ),
            0
          ) AS TodayBookings,

          COALESCE(
            SUM(
              DATE(CheckInDate) = CURDATE()
              AND Status IN (
                'Confirmed',
                'Checked-In'
              )
            ),
            0
          ) AS TodayCheckIns,

          COALESCE(
            SUM(
              DATE(CheckOutDate) = CURDATE()
            ),
            0
          ) AS TodayCheckOuts

        FROM RESERVATION

        WHERE Status IN (
          'Confirmed',
          'Checked-In',
          'Checked-Out'
        )
      `);


      // ============================================================
      // REVENUE MADE TODAY
      //
      // INVOICE does NOT contain AmountPaid.
      // Therefore PaymentStatus is used.
      //
      // TodayRevenue means:
      // Paid invoices issued today.
      // ============================================================

      const [[revenueSummary]] = await pool.query(`
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Paid'
                AND DATE(IssuedDate) = CURDATE()
                THEN TotalAmount
                ELSE 0
              END
            ),
            0
          ) AS TodayRevenue,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Paid'
                THEN TotalAmount
                ELSE 0
              END
            ),
            0
          ) AS TotalRevenue,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus IN (
                  'Unpaid',
                  'Partially Paid'
                )
                THEN TotalAmount
                ELSE 0
              END
            ),
            0
          ) AS OutstandingBalance,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Paid'
                THEN RoomCharges
                ELSE 0
              END
            ),
            0
          ) AS TotalRoomRevenue,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Paid'
                THEN EventCharges
                ELSE 0
              END
            ),
            0
          ) AS TotalEventRevenue,

          COALESCE(
            SUM(
              CASE
                WHEN PaymentStatus = 'Paid'
                THEN AdditionalCharges
                ELSE 0
              END
            ),
            0
          ) AS TotalAdditionalRevenue

        FROM INVOICE
      `);


      // ============================================================
      // UPCOMING EVENTS
      // ============================================================

      const [[eventSummary]] = await pool.query(`
        SELECT
          COUNT(*) AS UpcomingEvents

        FROM EVENT_BOOKING

        WHERE Status = 'Confirmed'
          AND EventDate >= CURDATE()
      `);


      // ============================================================
      // TOTAL CUSTOMERS
      // ============================================================

      const [[customerSummary]] = await pool.query(`
        SELECT
          COUNT(*) AS TotalCustomers

        FROM CUSTOMER
      `);


      // ============================================================
      // STAFF SUMMARY
      // ============================================================

      const [[staffSummary]] = await pool.query(`
        SELECT

          COUNT(*) AS TotalStaff,

          COALESCE(
            SUM(IsActive),
            0
          ) AS ActiveStaff,

          COALESCE(
            SUM(NOT IsActive),
            0
          ) AS InactiveStaff

        FROM STAFF
      `);


      // ============================================================
      // SEND DATA
      //
      // We provide BOTH:
      //
      // 1. Flat values for the main Dashboard
      // 2. Grouped objects for the Reports page
      //
      // This prevents the frontend pages from breaking because
      // they can access whichever structure they currently use.
      // ============================================================

      res.json({

        // ----------------------------------------------------------
        // MAIN DASHBOARD VALUES
        // ----------------------------------------------------------

        totalRooms:
          Number(
            roomSummary.TotalRooms || 0
          ),

        checkedInRooms:
          Number(
            checkedInSummary.CheckedInRooms || 0
          ),

        todayRevenue:
          Number(
            revenueSummary.TodayRevenue || 0
          ),


        // ----------------------------------------------------------
        // ROOM STATUS
        // ----------------------------------------------------------

        roomStatus: {

          available:
            Number(
              roomStatus.Available || 0
            ),

          reserved:
            Number(
              roomStatus.Reserved || 0
            ),

          occupied:
            Number(
              roomStatus.Occupied || 0
            ),

          underMaintenance:
            Number(
              roomStatus.UnderMaintenance || 0
            )

        },


        // ----------------------------------------------------------
        // REPORTS STRUCTURE
        // ----------------------------------------------------------

        occupancy: {

          TotalRooms:
            Number(
              roomSummary.TotalRooms || 0
            ),

          Available:
            Number(
              roomStatus.Available || 0
            ),

          Reserved:
            Number(
              roomStatus.Reserved || 0
            ),

          Occupied:
            Number(
              roomStatus.Occupied || 0
            ),

          UnderMaintenance:
            Number(
              roomStatus.UnderMaintenance || 0
            )

        },


        guests: {

          CurrentGuests:
            Number(
              guestSummary.CurrentGuests || 0
            ),

          TotalOccupants:
            Number(
              guestSummary.TotalOccupants || 0
            )

        },


        todayActivity: {

          TodayBookings:
            Number(
              todayActivity.TodayBookings || 0
            ),

          TodayCheckIns:
            Number(
              todayActivity.TodayCheckIns || 0
            ),

          TodayCheckOuts:
            Number(
              todayActivity.TodayCheckOuts || 0
            )

        },


        revenue: {

          TodayRevenue:
            Number(
              revenueSummary.TodayRevenue || 0
            ),

          TotalRevenue:
            Number(
              revenueSummary.TotalRevenue || 0
            ),

          OutstandingBalance:
            Number(
              revenueSummary.OutstandingBalance || 0
            ),

          TotalRoomRevenue:
            Number(
              revenueSummary.TotalRoomRevenue || 0
            ),

          TotalEventRevenue:
            Number(
              revenueSummary.TotalEventRevenue || 0
            ),

          TotalAdditionalRevenue:
            Number(
              revenueSummary.TotalAdditionalRevenue || 0
            )

        },


        upcomingEvents: {

          UpcomingEvents:
            Number(
              eventSummary.UpcomingEvents || 0
            )

        },


        customers: {

          TotalCustomers:
            Number(
              customerSummary.TotalCustomers || 0
            )

        },


        staffSummary: {

          TotalStaff:
            Number(
              staffSummary.TotalStaff || 0
            ),

          ActiveStaff:
            Number(
              staffSummary.ActiveStaff || 0
            ),

          InactiveStaff:
            Number(
              staffSummary.InactiveStaff || 0
            )

        }

      });

    } catch (err) {

      console.error(
        'Dashboard error:',
        err
      );

      res.status(500).json({
        error: err.message
      });

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/occupancy
// Occupancy report by date range
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/occupancy',
  verifyToken,
  requireStaff,
  async (req, res) => {

    const {
      from,
      to
    } = req.query;


    const startDate =
      from ||
      new Date(
        new Date().setDate(1)
      )
        .toISOString()
        .slice(0, 10);


    const endDate =
      to ||
      new Date()
        .toISOString()
        .slice(0, 10);


    try {

      // ============================================================
      // OCCUPANCY BY ROOM CATEGORY
      // ============================================================

      const [byCategory] =
        await pool.query(
          `
          SELECT

            rc.CategoryName,

            COUNT(
              res.ReservationID
            ) AS Bookings,

            COALESCE(
              SUM(
                DATEDIFF(
                  res.CheckOutDate,
                  res.CheckInDate
                )
              ),
              0
            ) AS TotalNights,

            COALESCE(
              SUM(i.RoomCharges),
              0
            ) AS Revenue

          FROM RESERVATION res

          JOIN ROOM r
            ON res.RoomNumber =
               r.RoomNumber

          JOIN ROOM_CATEGORY rc
            ON r.CategoryID =
               rc.CategoryID

          LEFT JOIN INVOICE i
            ON i.ReservationID =
               res.ReservationID

            AND i.PaymentStatus =
                'Paid'

          WHERE DATE(res.CheckInDate)
            BETWEEN ? AND ?

            AND res.Status != 'Cancelled'

          GROUP BY
            rc.CategoryName

          ORDER BY
            Revenue DESC
          `,
          [
            startDate,
            endDate
          ]
        );


      // ============================================================
      // OVERDUE CHECK-INS
      //
      // CheckOutDate is a DATE field, not DATETIME.
      // Therefore compare against CURDATE(), not NOW().
      // ============================================================

      const [overdue] =
        await pool.query(
          `
          SELECT

            res.ReservationID,

            res.BookingReference,

            CONCAT(
              c.FirstName,
              ' ',
              c.LastName
            ) AS GuestName,

            c.ContactNumber,

            res.RoomNumber,

            res.CheckOutDate,

            DATEDIFF(
              CURDATE(),
              res.CheckOutDate
            ) AS DaysOverdue,

            (
              DATEDIFF(
                CURDATE(),
                res.CheckOutDate
              ) * 24
            ) AS HoursOverdue,

            i.PaymentStatus

          FROM RESERVATION res

          JOIN CUSTOMER c
            ON res.CustomerID =
               c.CustomerID

          LEFT JOIN INVOICE i
            ON i.ReservationID =
               res.ReservationID

          WHERE res.Status =
                'Checked-In'

            AND res.CheckOutDate <
                CURDATE()

          ORDER BY
            DaysOverdue DESC
          `
        );


      res.json({

        period: {

          from:
            startDate,

          to:
            endDate

        },

        byCategory,

        overdue

      });

    } catch (err) {

      console.error(
        'Occupancy report error:',
        err
      );

      res.status(500).json({
        error: err.message
      });

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/revenue
// Revenue report
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/revenue',
  verifyToken,
  requireFinanceStaff,
  async (req, res) => {

    try {

      // ============================================================
      // MONTHLY REVENUE
      // ============================================================

      const [monthly] =
        await pool.query(
          `
          SELECT

            DATE_FORMAT(
              IssuedDate,
              '%Y-%m'
            ) AS Month,

            COALESCE(
              SUM(RoomCharges),
              0
            ) AS RoomRevenue,

            COALESCE(
              SUM(EventCharges),
              0
            ) AS EventRevenue,

            COALESCE(
              SUM(AdditionalCharges),
              0
            ) AS AdditionalRevenue,

            COALESCE(
              SUM(TotalAmount),
              0
            ) AS Total,

            COUNT(
              DISTINCT ReservationID
            ) AS RoomBookings,

            COUNT(
              DISTINCT EventID
            ) AS EventBookings

          FROM INVOICE

          WHERE PaymentStatus =
                'Paid'

          GROUP BY
            DATE_FORMAT(
              IssuedDate,
              '%Y-%m'
            )

          ORDER BY
            Month DESC

          LIMIT 12
          `
        );


      // ============================================================
      // REVENUE TOTALS
      //
      // IMPORTANT:
      // There is no AmountPaid column in INVOICE.
      // PaymentStatus is therefore used.
      // ============================================================

      const [[totals]] =
        await pool.query(
          `
          SELECT

            COALESCE(
              SUM(
                CASE
                  WHEN PaymentStatus =
                       'Paid'
                  THEN TotalAmount
                  ELSE 0
                END
              ),
              0
            ) AS TotalPaid,


            COALESCE(
              SUM(
                CASE
                  WHEN PaymentStatus =
                       'Unpaid'
                  THEN TotalAmount
                  ELSE 0
                END
              ),
              0
            ) AS TotalUnpaid,


            COALESCE(
              SUM(
                CASE
                  WHEN PaymentStatus =
                       'Partially Paid'
                  THEN TotalAmount
                  ELSE 0
                END
              ),
              0
            ) AS TotalPartial,


            COALESCE(
              SUM(
                CASE
                  WHEN PaymentStatus =
                       'Paid'
                    AND DATE(IssuedDate) =
                        CURDATE()
                  THEN TotalAmount
                  ELSE 0
                END
              ),
              0
            ) AS TodayRevenue


          FROM INVOICE
          `
        );


      res.json({

        monthly,

        totals

      });

    } catch (err) {

      console.error(
        'Revenue report error:',
        err
      );

      res.status(500).json({
        error: err.message
      });

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/feedback-summary
// Feedback analytics
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/feedback-summary',
  verifyToken,
  requireStaff,
  async (req, res) => {

    try {

      const [[summary]] =
        await pool.query(
          `
          SELECT

            COUNT(*) AS Total,

            COALESCE(
              ROUND(
                AVG(Rating),
                2
              ),
              0
            ) AS AvgRating,

            COALESCE(
              SUM(Rating = 5),
              0
            ) AS Excellent,

            COALESCE(
              SUM(Rating = 4),
              0
            ) AS Good,

            COALESCE(
              SUM(Rating = 3),
              0
            ) AS Average,

            COALESCE(
              SUM(Rating <= 2),
              0
            ) AS Poor

          FROM FEEDBACK
          `
        );


      res.json(summary);

    } catch (err) {

      console.error(
        'Feedback summary error:',
        err
      );

      res.status(500).json({
        error: err.message
      });

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/staff
// Staff summary report
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/staff',
  verifyToken,
  requireAdmin,
  async (req, res) => {

    try {

      // ============================================================
      // STAFF BY ROLE
      // ============================================================

      const [byRole] =
        await pool.query(
          `
          SELECT

            Role,

            COUNT(*) AS TotalStaff,

            COALESCE(
              SUM(IsActive),
              0
            ) AS ActiveStaff,

            COALESCE(
              SUM(
                NOT IsActive
              ),
              0
            ) AS InactiveStaff

          FROM STAFF

          GROUP BY
            Role

          ORDER BY
            Role
          `
        );


      // ============================================================
      // ALL STAFF
      // ============================================================

      const [allStaff] =
        await pool.query(
          `
          SELECT

            StaffID,

            CONCAT(
              FirstName,
              ' ',
              LastName
            ) AS StaffName,

            Email,

            Role,

            IsActive,

            CreatedAt

          FROM STAFF

          ORDER BY
            Role,
            FirstName
          `
        );


      res.json({

        byRole,

        allStaff

      });

    } catch (err) {

      console.error(
        'Staff report error:',
        err
      );

      res.status(500).json({
        error: err.message
      });

    }

  }
);


// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ROUTER
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;