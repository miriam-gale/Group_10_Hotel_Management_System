-- =============================================================================
-- GRAND HORIZON HOTEL
-- DATABASE VIEWS
-- =============================================================================

USE grand_horizon_hotel;

-- SECTION 2 — VIEWS (7 total including 2 STAFF views)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- VIEW 1: vw_current_occupancy
-- Real-time snapshot of all occupied and reserved rooms with guest details.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_current_occupancy AS
SELECT
    r.RoomNumber,
    rc.CategoryName                                     AS RoomType,
    rc.PricePerNight,
    r.Floor,
    r.MaxOccupants,
    r.Status                                            AS RoomStatus,
    CONCAT(c.FirstName, ' ', c.LastName)                AS GuestName,
    c.ContactNumber,
    c.Email,
    res.BookingReference,
    res.CheckInDate,
    res.CheckOutDate,
    DATEDIFF(res.CheckOutDate, res.CheckInDate)         AS TotalNights,
    res.NumOccupants,
    res.Status                                          AS ReservationStatus,
    DATEDIFF(res.CheckOutDate, CURDATE())               AS NightsRemaining
FROM   ROOM          r
JOIN   ROOM_CATEGORY rc  ON r.CategoryID   = rc.CategoryID
LEFT JOIN RESERVATION   res ON r.RoomNumber  = res.RoomNumber
                            AND res.Status   IN ('Confirmed', 'Checked-In')
LEFT JOIN CUSTOMER      c   ON res.CustomerID = c.CustomerID
WHERE  r.Status IN ('Reserved', 'Occupied');


-- -----------------------------------------------------------------------------
-- VIEW 2: vw_invoice_summary
-- Full invoice details with customer name, booking type, and all charges.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_invoice_summary AS
SELECT
    i.InvoiceID,
    i.IssuedDate,
    COALESCE(
        CONCAT(c1.FirstName, ' ', c1.LastName),
        CONCAT(c2.FirstName, ' ', c2.LastName)
    )                                                   AS CustomerName,
    CASE
        WHEN i.ReservationID IS NOT NULL THEN 'Room Reservation'
        WHEN i.EventID       IS NOT NULL THEN 'Event Booking'
    END                                                 AS InvoiceType,
    COALESCE(res.BookingReference,
             CONCAT('EVT-', eb.EventID))                AS Reference,
    i.RoomCharges,
    i.EventCharges,
    i.AdditionalCharges,
    i.TotalAmount,
    i.PaymentStatus
FROM   INVOICE       i
LEFT JOIN RESERVATION   res ON i.ReservationID = res.ReservationID
LEFT JOIN EVENT_BOOKING eb  ON i.EventID       = eb.EventID
LEFT JOIN CUSTOMER      c1  ON res.CustomerID  = c1.CustomerID
LEFT JOIN CUSTOMER      c2  ON eb.CustomerID   = c2.CustomerID;


-- -----------------------------------------------------------------------------
-- VIEW 3: vw_revenue_report
-- Monthly revenue summary broken down by source, for paid invoices only.
-- Accessible to Finance/Billing Staff and Administrator.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_revenue_report AS
SELECT
    DATE_FORMAT(i.IssuedDate, '%Y-%m')  AS Month,
    SUM(i.RoomCharges)                  AS TotalRoomRevenue,
    SUM(i.EventCharges)                 AS TotalEventRevenue,
    SUM(i.AdditionalCharges)            AS TotalAdditionalRevenue,
    SUM(i.TotalAmount)                  AS GrandTotalRevenue,
    COUNT(DISTINCT i.ReservationID)     AS TotalRoomBookings,
    COUNT(DISTINCT i.EventID)           AS TotalEventBookings
FROM   INVOICE i
WHERE  i.PaymentStatus = 'Paid'
GROUP  BY DATE_FORMAT(i.IssuedDate, '%Y-%m')
ORDER  BY Month DESC;


-- -----------------------------------------------------------------------------
-- VIEW 4: vw_event_schedule
-- All upcoming and in-progress events with hall and customer details.
-- Accessible to Event Staff and Administrator.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_event_schedule AS
SELECT
    eb.EventID,
    eb.EventType,
    eb.EventDate,
    eb.StartTime,
    eb.EndTime,
    ROUND(TIMESTAMPDIFF(MINUTE, eb.StartTime, eb.EndTime) / 60.0, 2)
                                                        AS DurationHours,
    eb.ExpectedAttendees,
    eb.Status,
    h.HallName,
    h.Capacity,
    h.BookingPricePerHour,
    ROUND(h.BookingPricePerHour *
        TIMESTAMPDIFF(MINUTE, eb.StartTime, eb.EndTime) / 60.0, 2)
                                                        AS TotalHallCharge,
    CONCAT(c.FirstName, ' ', c.LastName)                AS BookedBy,
    c.ContactNumber,
    c.Email
FROM   EVENT_BOOKING eb
JOIN   HALL     h ON eb.HallID     = h.HallID
JOIN   CUSTOMER c ON eb.CustomerID = c.CustomerID
WHERE  eb.Status IN ('Confirmed', 'In Progress')
ORDER  BY eb.EventDate, eb.StartTime;


-- -----------------------------------------------------------------------------
-- VIEW 5: vw_feedback_summary
-- All customer feedback with sentiment label, booking reference, and type.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_feedback_summary AS
SELECT
    f.FeedbackID,
    f.SubmittedDate,
    CONCAT(c.FirstName, ' ', c.LastName)                AS CustomerName,
    c.Email,
    f.Rating,
    CASE
        WHEN f.Rating = 5 THEN 'Excellent'
        WHEN f.Rating = 4 THEN 'Good'
        WHEN f.Rating = 3 THEN 'Average'
        WHEN f.Rating = 2 THEN 'Poor'
        ELSE                    'Very Poor'
    END                                                 AS Sentiment,
    CASE
        WHEN f.ReservationID IS NOT NULL THEN 'Room Stay'
        ELSE 'Event'
    END                                                 AS FeedbackType,
    COALESCE(res.BookingReference,
             CONCAT('EVT-', eb.EventID))                AS Reference,
    f.Comments
FROM   FEEDBACK      f
JOIN   CUSTOMER      c   ON f.CustomerID    = c.CustomerID
LEFT JOIN RESERVATION   res ON f.ReservationID = res.ReservationID
LEFT JOIN EVENT_BOOKING eb  ON f.EventID       = eb.EventID;


-- -----------------------------------------------------------------------------
-- VIEW 6: vw_staff_directory (Administrator only)
-- All staff members with roles and active status.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_directory AS
SELECT
    s.StaffID,
    CONCAT(s.FirstName, ' ', s.LastName) AS StaffName,
    s.Email,
    s.Role,
    s.IsActive,
    s.CreatedAt
FROM STAFF s
ORDER BY s.Role, s.FirstName;


-- -----------------------------------------------------------------------------
-- VIEW 7: vw_role_summary (Administrator only)
-- Aggregated count of total, active, and inactive staff per role.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_role_summary AS
SELECT
    Role,
    COUNT(*)          AS TotalStaff,
    SUM(IsActive)     AS ActiveStaff,
    SUM(NOT IsActive) AS InactiveStaff
FROM STAFF
GROUP BY Role;


-- =============================================================================
