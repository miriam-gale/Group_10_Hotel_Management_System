const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken, requireFinanceStaff, requireStaff } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invoices/my — Customer's own invoices
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*,
        CASE WHEN i.ReservationID IS NOT NULL THEN 'Room Reservation' ELSE 'Event Booking' END AS InvoiceType,
        COALESCE(res.BookingReference, CONCAT('EVT-', eb.EventID)) AS Reference,
        COALESCE(res.CheckInDate, eb.EventDate) AS ServiceDate
      FROM INVOICE i
      LEFT JOIN RESERVATION   res ON i.ReservationID = res.ReservationID
      LEFT JOIN EVENT_BOOKING eb  ON i.EventID       = eb.EventID
      WHERE res.CustomerID = ? OR eb.CustomerID = ?
      ORDER BY i.IssuedDate DESC
    `, [req.user.id, req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invoices — All invoices (any staff role)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyToken, requireStaff, async (req, res) => {
  const { status, search, type } = req.query;
  try {
    let query = `
      SELECT i.*,
        CASE WHEN i.ReservationID IS NOT NULL THEN 'Room Reservation' ELSE 'Event Booking' END AS InvoiceType,
        COALESCE(CONCAT(c1.FirstName,' ',c1.LastName), CONCAT(c2.FirstName,' ',c2.LastName)) AS CustomerName,
        COALESCE(res.BookingReference, CONCAT('EVT-', eb.EventID)) AS Reference
      FROM INVOICE i
      LEFT JOIN RESERVATION   res ON i.ReservationID = res.ReservationID
      LEFT JOIN EVENT_BOOKING eb  ON i.EventID       = eb.EventID
      LEFT JOIN CUSTOMER      c1  ON res.CustomerID  = c1.CustomerID
      LEFT JOIN CUSTOMER      c2  ON eb.CustomerID   = c2.CustomerID
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND i.PaymentStatus = ?'; params.push(status); }
    if (type === 'room')  { query += ' AND i.ReservationID IS NOT NULL'; }
    if (type === 'event') { query += ' AND i.EventID IS NOT NULL'; }
    if (search) {
      query += ' AND (c1.FirstName LIKE ? OR c1.LastName LIKE ? OR c2.FirstName LIKE ? OR c2.LastName LIKE ? OR res.BookingReference LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY i.IssuedDate DESC LIMIT 200';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/invoices/:id — Single invoice detail (Customer or any Staff)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*,
        CASE WHEN i.ReservationID IS NOT NULL THEN 'Room Reservation' ELSE 'Event Booking' END AS InvoiceType,
        COALESCE(CONCAT(c1.FirstName,' ',c1.LastName), CONCAT(c2.FirstName,' ',c2.LastName)) AS CustomerName,
        COALESCE(c1.Email, c2.Email)                 AS CustomerEmail,
        COALESCE(c1.ContactNumber, c2.ContactNumber) AS CustomerContact,
        COALESCE(res.BookingReference, CONCAT('EVT-', eb.EventID)) AS Reference,
        res.CheckInDate, res.CheckOutDate, res.RoomNumber,
        eb.EventType, eb.EventDate, eb.StartTime, eb.EndTime, h.HallName
      FROM INVOICE i
      LEFT JOIN RESERVATION   res ON i.ReservationID = res.ReservationID
      LEFT JOIN EVENT_BOOKING eb  ON i.EventID       = eb.EventID
      LEFT JOIN CUSTOMER      c1  ON res.CustomerID  = c1.CustomerID
      LEFT JOIN CUSTOMER      c2  ON eb.CustomerID   = c2.CustomerID
      LEFT JOIN HALL          h   ON eb.HallID       = h.HallID
      WHERE i.InvoiceID = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Invoice not found.' });

    // Customers can only see their own invoices
    // role === 'customer' matches ROLES.CUSTOMER in auth.js middleware
    if (req.user.role === 'customer') {
      const inv = rows[0];
      const [check] = await pool.query(`
        SELECT 1 FROM RESERVATION WHERE ReservationID = ? AND CustomerID = ?
        UNION
        SELECT 1 FROM EVENT_BOOKING WHERE EventID = ? AND CustomerID = ?
      `, [inv.ReservationID, req.user.id, inv.EventID, req.user.id]);
      if (!check.length) return res.status(403).json({ error: 'Not authorized.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/invoices/:id/customer-pay — Customer self-payment (demo/recording)
//
// Allows an authenticated customer to pay ONLY their own invoice.
// Works for BOTH room reservation invoices AND event booking invoices.
// This is a demo payment endpoint — no real payment gateway is integrated.
// To add MoMo/Card: insert the gateway call before the UPDATE INVOICE below.
//
// TRANSACTION SCOPE:
//   BEGIN
//     1. Lock invoice row (FOR UPDATE)
//     2. Validate invoice belongs to the authenticated customer
//     3. Validate invoice is not already fully paid
//     4. UPDATE PaymentStatus based on amount paid
//   COMMIT / ROLLBACK
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/invoices/:id/customer-pay
// Customer self-payment
// Customers can only pay their own invoices.
router.post('/:id/customer-pay', verifyToken, async (req, res) => {

  const paymentAmount =
    parseFloat(req.body.AmountPaid);

  const customerID =
    req.user.id;

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    return res.status(400).json({
      error: 'AmountPaid must be greater than 0.'
    });
  }

  const conn =
    await pool.getConnection();

  try {

    await conn.beginTransaction();

    /*
     * Lock the invoice while processing the payment.
     */
    const [rows] = await conn.query(
      `
      SELECT
        InvoiceID,
        ReservationID,
        EventID,
        TotalAmount,
        AmountPaid,
        PaymentStatus
      FROM INVOICE
      WHERE InvoiceID = ?
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!rows.length) {

      await conn.rollback();

      return res.status(404).json({
        error: 'Invoice not found.'
      });
    }

    const invoice = rows[0];

    /*
     * Make sure this invoice belongs to
     * the authenticated customer.
     *
     * This works for both:
     * - Room reservation invoices
     * - Event booking invoices
     */
    const [ownership] = await conn.query(
      `
      SELECT 1
      FROM RESERVATION
      WHERE ReservationID = ?
        AND CustomerID = ?

      UNION

      SELECT 1
      FROM EVENT_BOOKING
      WHERE EventID = ?
        AND CustomerID = ?
      `,
      [
        invoice.ReservationID,
        customerID,
        invoice.EventID,
        customerID
      ]
    );

    if (!ownership.length) {

      await conn.rollback();

      return res.status(403).json({
        error:
          'You are not authorised to pay this invoice.'
      });
    }

    const totalAmount =
      Number(invoice.TotalAmount || 0);

    const currentAmountPaid =
      Number(invoice.AmountPaid || 0);

    /*
     * Prevent payment on an already-paid invoice.
     */
    if (currentAmountPaid >= totalAmount) {

      await conn.rollback();

      return res.status(400).json({
        error:
          'This invoice has already been fully paid.'
      });
    }

    /*
     * Calculate the outstanding balance.
     */
    const outstandingBalance =
      Math.max(
        totalAmount - currentAmountPaid,
        0
      );

    /*
     * Prevent overpayment.
     */
    if (paymentAmount > outstandingBalance) {

      await conn.rollback();

      return res.status(400).json({
        error:
          `Payment cannot exceed the outstanding balance of ${outstandingBalance.toFixed(2)}.`
      });
    }

    /*
     * Add the new payment to the
     * amount already paid.
     */
    const newAmountPaid =
      currentAmountPaid + paymentAmount;

    /*
     * Determine the new payment status.
     */
    let newStatus =
      'Partially Paid';

    if (newAmountPaid >= totalAmount) {
      newStatus = 'Paid';
    }

    /*
     * Update the invoice.
     */
    await conn.query(
      `
      UPDATE INVOICE
      SET
        AmountPaid = ?,
        PaymentStatus = ?
      WHERE InvoiceID = ?
      `,
      [
        newAmountPaid,
        newStatus,
        req.params.id
      ]
    );

    

    await conn.commit();

    res.json({

      message:
        `Payment recorded successfully. Status: ${newStatus}.`,

      InvoiceID:
        Number(req.params.id),

      PaymentAmount:
        paymentAmount,

      AmountPaid:
        newAmountPaid,

      TotalAmount:
        totalAmount,

      OutstandingBalance:
        Math.max(
          totalAmount - newAmountPaid,
          0
        ),

      PaymentStatus:
        newStatus
    });

  } catch (err) {

    await conn.rollback();

    console.error(
      'Customer payment error:',
      err
    );

    res.status(500).json({
      error: err.message
    });

  } finally {

    conn.release();
  }
});
// ============================================================
// POST /api/invoices
// Create a new invoice
//
// Allowed roles:
//   - Administrator
//   - Finance/Billing Staff
//
// An invoice must belong to either:
//   - one Reservation
//   - OR one Event Booking
//
// The backend calculates TotalAmount.
// ============================================================

router.post(
  '/',
  verifyToken,
  requireFinanceStaff,
  async (req, res) => {

    const {
      ReservationID,
      EventID,
      RoomCharges = 0,
      EventCharges = 0,
      AdditionalCharges = 0
    } = req.body;

    try {

      // ------------------------------------------------------
      // Validate that exactly ONE source was provided
      // ------------------------------------------------------

      const hasReservation =
        ReservationID !== undefined &&
        ReservationID !== null &&
        ReservationID !== '';

      const hasEvent =
        EventID !== undefined &&
        EventID !== null &&
        EventID !== '';

      if (hasReservation === hasEvent) {
        return res.status(400).json({
          error:
            'Invoice must be linked to either a reservation or an event, but not both.'
        });
      }


      // ------------------------------------------------------
      // Validate charge amounts
      // ------------------------------------------------------

      const roomCharges =
        Number(RoomCharges);

      const eventCharges =
        Number(EventCharges);

      const additionalCharges =
        Number(AdditionalCharges);


      if (
        !Number.isFinite(roomCharges) ||
        roomCharges < 0
      ) {
        return res.status(400).json({
          error: 'RoomCharges must be a valid non-negative amount.'
        });
      }


      if (
        !Number.isFinite(eventCharges) ||
        eventCharges < 0
      ) {
        return res.status(400).json({
          error: 'EventCharges must be a valid non-negative amount.'
        });
      }


      if (
        !Number.isFinite(additionalCharges) ||
        additionalCharges < 0
      ) {
        return res.status(400).json({
          error:
            'AdditionalCharges must be a valid non-negative amount.'
        });
      }


      // ------------------------------------------------------
      // Validate that the correct charge type is being used
      // ------------------------------------------------------

      if (hasReservation && eventCharges > 0) {
        return res.status(400).json({
          error:
            'EventCharges cannot be used for a room reservation invoice.'
        });
      }


      if (hasEvent && roomCharges > 0) {
        return res.status(400).json({
          error:
            'RoomCharges cannot be used for an event invoice.'
        });
      }


      // ------------------------------------------------------
      // Validate Reservation
      // ------------------------------------------------------

      if (hasReservation) {

        const [reservationRows] = await pool.query(
          `
          SELECT
            ReservationID,
            CustomerID,
            Status
          FROM RESERVATION
          WHERE ReservationID = ?
          `,
          [ReservationID]
        );


        if (!reservationRows.length) {

          return res.status(404).json({
            error: 'Reservation not found.'
          });

        }


        // ----------------------------------------------------
        // Check whether this reservation already has invoice
        // ----------------------------------------------------

        const [existingInvoice] = await pool.query(
          `
          SELECT InvoiceID
          FROM INVOICE
          WHERE ReservationID = ?
          `,
          [ReservationID]
        );


        if (existingInvoice.length) {

          return res.status(409).json({
            error:
              'This reservation already has an invoice.',
            InvoiceID:
              existingInvoice[0].InvoiceID
          });

        }

      }


      // ------------------------------------------------------
      // Validate Event
      // ------------------------------------------------------

      if (hasEvent) {

        const [eventRows] = await pool.query(
          `
          SELECT
            EventID,
            CustomerID,
            Status
          FROM EVENT_BOOKING
          WHERE EventID = ?
          `,
          [EventID]
        );


        if (!eventRows.length) {

          return res.status(404).json({
            error: 'Event booking not found.'
          });

        }


        // ----------------------------------------------------
        // Check whether this event already has an invoice
        // ----------------------------------------------------

        const [existingInvoice] = await pool.query(
          `
          SELECT InvoiceID
          FROM INVOICE
          WHERE EventID = ?
          `,
          [EventID]
        );


        if (existingInvoice.length) {

          return res.status(409).json({
            error:
              'This event booking already has an invoice.',
            InvoiceID:
              existingInvoice[0].InvoiceID
          });

        }

      }


      // ------------------------------------------------------
      // Calculate total on the SERVER
      // ------------------------------------------------------

      const totalAmount =
        roomCharges +
        eventCharges +
        additionalCharges;


      // ------------------------------------------------------
      // Create invoice
      // ------------------------------------------------------

      const [result] = await pool.query(
        `
        INSERT INTO INVOICE (
          ReservationID,
          EventID,
          RoomCharges,
          EventCharges,
          AdditionalCharges,
          TotalAmount,
          AmountPaid,
          PaymentStatus
        )
        VALUES (?, ?, ?, ?, ?, ?, 0.00, 'Unpaid')
        `,
        [
          hasReservation ? ReservationID : null,
          hasEvent ? EventID : null,
          roomCharges,
          eventCharges,
          additionalCharges,
          totalAmount
        ]
      );


      // ------------------------------------------------------
      // Return newly created invoice
      // ------------------------------------------------------

      const [newInvoice] = await pool.query(
        `
        SELECT
          i.*,
          CASE
            WHEN i.ReservationID IS NOT NULL
              THEN 'Room Reservation'
            ELSE 'Event Booking'
          END AS InvoiceType,

          COALESCE(
            CONCAT(c1.FirstName, ' ', c1.LastName),
            CONCAT(c2.FirstName, ' ', c2.LastName)
          ) AS CustomerName,

          COALESCE(
            res.BookingReference,
            CONCAT('EVT-', eb.EventID)
          ) AS Reference

        FROM INVOICE i

        LEFT JOIN RESERVATION res
          ON i.ReservationID = res.ReservationID

        LEFT JOIN EVENT_BOOKING eb
          ON i.EventID = eb.EventID

        LEFT JOIN CUSTOMER c1
          ON res.CustomerID = c1.CustomerID

        LEFT JOIN CUSTOMER c2
          ON eb.CustomerID = c2.CustomerID

        WHERE i.InvoiceID = ?
        `,
        [result.insertId]
      );


      return res.status(201).json({
        message: 'Invoice created successfully.',
        invoice: newInvoice[0]
      });


    } catch (err) {

      console.error(
        'Create invoice error:',
        err
      );


      // ------------------------------------------------------
      // Handle duplicate-key errors from database constraints
      // ------------------------------------------------------

      if (err.code === 'ER_DUP_ENTRY') {

        return res.status(409).json({
          error:
            'An invoice already exists for this reservation or event.'
        });

      }


      return res.status(500).json({
        error: err.message
      });

    }
  }
);

// POST /api/invoices/:id/pay — Record payment (Finance/Billing Staff or Admin)
// Staff-only endpoint — not accessible by customers
router.post('/:id/pay', verifyToken, requireFinanceStaff, async (req, res) => {

  const paymentAmount = parseFloat(req.body.AmountPaid);

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({
      error: 'AmountPaid must be greater than 0.'
    });
  }

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    
    const [rows] = await conn.query(
      `
      SELECT
        InvoiceID,
        TotalAmount,
        AmountPaid,
        PaymentStatus
      FROM INVOICE
      WHERE InvoiceID = ?
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!rows.length) {

      await conn.rollback();

      return res.status(404).json({
        error: 'Invoice not found.'
      });
    }

    const invoice = rows[0];

    const totalAmount =
      Number(invoice.TotalAmount || 0);

    const currentAmountPaid =
      Number(invoice.AmountPaid || 0);

    /*
     * Do not allow payments on an invoice that
     * has already been completely paid.
     */
    if (currentAmountPaid >= totalAmount) {

      await conn.rollback();

      return res.status(400).json({
        error: 'This invoice has already been fully paid.'
      });
    }

    /*
     * Calculate the remaining balance.
     */
    const outstandingBalance =
      Math.max(
        totalAmount - currentAmountPaid,
        0
      );

    /*
     * Prevent the payment from exceeding
     * the remaining balance.
     */
    if (paymentAmount > outstandingBalance) {

      await conn.rollback();

      return res.status(400).json({
        error:
          `Payment cannot exceed the outstanding balance of ${outstandingBalance.toFixed(2)}.`
      });
    }

    /*
     * Add the new payment to the amount already paid.
     */
    const newAmountPaid =
      currentAmountPaid + paymentAmount;

    /*
     * Determine the new invoice status.
     */
    let newStatus = 'Partially Paid';

    if (newAmountPaid >= totalAmount) {
      newStatus = 'Paid';
    }

    /*
     * Update both AmountPaid and PaymentStatus.
     */
    await conn.query(
      `
      UPDATE INVOICE
      SET
        AmountPaid = ?,
        PaymentStatus = ?
      WHERE InvoiceID = ?
      `,
      [
        newAmountPaid,
        newStatus,
        req.params.id
      ]
    );

    await conn.commit();

    /*
     * Return the updated payment information
     * to the frontend.
     */
    res.json({

      message:
        `Payment recorded. Status: ${newStatus}.`,

      InvoiceID:
        Number(req.params.id),

      PaymentAmount:
        paymentAmount,

      AmountPaid:
        newAmountPaid,

      TotalAmount:
        totalAmount,

      OutstandingBalance:
        Math.max(
          totalAmount - newAmountPaid,
          0
        ),

      PaymentStatus:
        newStatus
    });

  } catch (err) {

    await conn.rollback();

    console.error(
      'Record payment error:',
      err
    );

    res.status(500).json({
      error: err.message
    });

  } finally {

    conn.release();
  }
});
module.exports = router;