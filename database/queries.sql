-- =============================================================================
-- GRAND HORIZON HOTEL
-- ADVANCED SQL QUERIES
-- =============================================================================

USE grand_horizon_hotel;

-- SECTION 1 — ADVANCED SQL QUERIES (10)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUERY 1: Current Hotel Occupancy Dashboard
-- Shows all occupied/reserved rooms with guest details, nights remaining,
-- and the total revenue expected from each active reservation.
-- -----------------------------------------------------------------------------
SELECT
    r.RoomNumber,
    rc.CategoryName                                   AS RoomType,
    r.Floor,
    CONCAT(c.FirstName, ' ', c.LastName)              AS GuestName,
    c.ContactNumber,
    res.BookingReference,
    res.CheckInDate,
    res.CheckOutDate,
    res.NumOccupants,
    res.Status                                        AS ReservationStatus,
    DATEDIFF(res.CheckOutDate, CURDATE())             AS NightsRemaining,
    rc.PricePerNight * DATEDIFF(res.CheckOutDate, res.CheckInDate)
                                                      AS ExpectedRoomRevenue
FROM   ROOM r
JOIN   ROOM_CATEGORY rc  ON r.CategoryID    = rc.CategoryID
JOIN   RESERVATION   res ON r.RoomNumber    = res.RoomNumber
JOIN   CUSTOMER      c   ON res.CustomerID  = c.CustomerID
WHERE  res.Status IN ('Confirmed', 'Checked-In')
ORDER BY res.CheckInDate;


-- -----------------------------------------------------------------------------
-- QUERY 2: Revenue Report — Monthly Breakdown by Source
-- Aggregates paid invoice revenue by month, split by room vs event bookings.
-- Includes running total using window function.
-- -----------------------------------------------------------------------------
SELECT
    DATE_FORMAT(i.IssuedDate, '%Y-%m')          AS Month,
    COUNT(DISTINCT i.ReservationID)             AS RoomBookings,
    COUNT(DISTINCT i.EventID)                   AS EventBookings,
    COALESCE(SUM(i.RoomCharges),       0)       AS RoomRevenue,
    COALESCE(SUM(i.EventCharges),      0)       AS EventRevenue,
    COALESCE(SUM(i.AdditionalCharges), 0)       AS AdditionalRevenue,
    COALESCE(SUM(i.TotalAmount),       0)       AS MonthlyTotal,
    SUM(SUM(i.TotalAmount)) OVER (
        ORDER BY DATE_FORMAT(i.IssuedDate, '%Y-%m')
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                           AS RunningTotal
FROM   INVOICE i
WHERE  i.PaymentStatus = 'Paid'
GROUP  BY DATE_FORMAT(i.IssuedDate, '%Y-%m')
ORDER  BY Month;


-- -----------------------------------------------------------------------------
-- QUERY 3: Room Utilisation Rate per Category
-- Calculates what percentage of rooms in each category are currently
-- occupied or reserved vs total available rooms.
-- -----------------------------------------------------------------------------
SELECT
    rc.CategoryName,
    COUNT(r.RoomNumber)                                         AS TotalRooms,
    SUM(CASE WHEN r.Status = 'Available'         THEN 1 ELSE 0 END) AS Available,
    SUM(CASE WHEN r.Status = 'Reserved'          THEN 1 ELSE 0 END) AS Reserved,
    SUM(CASE WHEN r.Status = 'Occupied'          THEN 1 ELSE 0 END) AS Occupied,
    SUM(CASE WHEN r.Status = 'Under Maintenance' THEN 1 ELSE 0 END) AS UnderMaintenance,
    ROUND(
        SUM(CASE WHEN r.Status IN ('Reserved','Occupied') THEN 1 ELSE 0 END)
        / COUNT(r.RoomNumber) * 100, 2
    )                                                           AS OccupancyRate_Pct
FROM   ROOM_CATEGORY rc
JOIN   ROOM r ON rc.CategoryID = r.CategoryID
GROUP  BY rc.CategoryName
ORDER  BY OccupancyRate_Pct DESC;


-- -----------------------------------------------------------------------------
-- QUERY 4: Top 10 Customers by Total Spend
-- Ranks customers by their total paid invoice amount across both
-- room reservations and event bookings.
-- -----------------------------------------------------------------------------
SELECT
    c.CustomerID,
    CONCAT(c.FirstName, ' ', c.LastName)    AS CustomerName,
    c.Email,
    COUNT(DISTINCT res.ReservationID)       AS TotalReservations,
    COUNT(DISTINCT eb.EventID)              AS TotalEventBookings,
    COALESCE(SUM(i.TotalAmount), 0)         AS TotalSpend,
    RANK() OVER (ORDER BY SUM(i.TotalAmount) DESC)
                                            AS SpendRank
FROM   CUSTOMER c
LEFT JOIN RESERVATION   res ON c.CustomerID = res.CustomerID
LEFT JOIN EVENT_BOOKING eb  ON c.CustomerID = eb.CustomerID
LEFT JOIN INVOICE       i   ON (i.ReservationID = res.ReservationID
                             OR i.EventID       = eb.EventID)
                            AND i.PaymentStatus = 'Paid'
GROUP  BY c.CustomerID, c.FirstName, c.LastName, c.Email
ORDER  BY TotalSpend DESC
LIMIT  10;


-- -----------------------------------------------------------------------------
-- QUERY 5: Overdue Check-Outs with Outstanding Balance
-- Identifies guests who have exceeded their scheduled check-out time
-- and still have unpaid invoices.
-- -----------------------------------------------------------------------------
SELECT
    res.ReservationID,
    res.BookingReference,
    CONCAT(c.FirstName, ' ', c.LastName)            AS GuestName,
    c.ContactNumber,
    c.Email,
    res.RoomNumber,
    rc.CategoryName,
    res.CheckOutDate                                 AS ScheduledCheckOut,
    NOW()                                            AS CurrentDateTime,
    TIMESTAMPDIFF(HOUR, res.CheckOutDate, NOW())     AS HoursOverdue,
    i.TotalAmount                                    AS OutstandingBalance,
    i.PaymentStatus
FROM   RESERVATION   res
JOIN   CUSTOMER      c   ON res.CustomerID  = c.CustomerID
JOIN   ROOM          r   ON res.RoomNumber  = r.RoomNumber
JOIN   ROOM_CATEGORY rc  ON r.CategoryID   = rc.CategoryID
JOIN   INVOICE       i   ON i.ReservationID = res.ReservationID
WHERE  res.Status       = 'Checked-In'
  AND  res.CheckOutDate < NOW()
  AND  i.PaymentStatus != 'Paid'
ORDER  BY HoursOverdue DESC;


-- -----------------------------------------------------------------------------
-- QUERY 6: Hall Booking Frequency and Revenue Analysis
-- Shows how often each hall is booked, total revenue generated,
-- and average event duration.
-- -----------------------------------------------------------------------------
SELECT
    h.HallName,
    h.Capacity,
    h.BookingPricePerHour,
    COUNT(eb.EventID)                                           AS TotalBookings,
    SUM(CASE WHEN eb.Status = 'Completed'  THEN 1 ELSE 0 END)  AS CompletedEvents,
    SUM(CASE WHEN eb.Status = 'Cancelled'  THEN 1 ELSE 0 END)  AS CancelledEvents,
    ROUND(AVG(
        TIMESTAMPDIFF(MINUTE, eb.StartTime, eb.EndTime) / 60.0
    ), 2)                                                       AS AvgDurationHours,
    COALESCE(SUM(i.EventCharges), 0)                            AS TotalEventRevenue
FROM   HALL h
LEFT JOIN EVENT_BOOKING eb ON h.HallID       = eb.HallID
LEFT JOIN INVOICE       i  ON i.EventID      = eb.EventID
                           AND i.PaymentStatus = 'Paid'
GROUP  BY h.HallID, h.HallName, h.Capacity, h.BookingPricePerHour
ORDER  BY TotalBookings DESC;


-- -----------------------------------------------------------------------------
-- QUERY 7: Customer Feedback Analysis with Sentiment Categorisation
-- Retrieves all feedback with rating-based sentiment labels and
-- compares individual ratings against the overall average.
-- -----------------------------------------------------------------------------
SELECT
    f.FeedbackID,
    CONCAT(c.FirstName, ' ', c.LastName)        AS CustomerName,
    CASE
        WHEN f.ReservationID IS NOT NULL THEN 'Room Stay'
        ELSE 'Event'
    END                                         AS FeedbackType,
    COALESCE(res.BookingReference,
             CONCAT('EVT-', eb.EventID))        AS Reference,
    f.Rating,
    CASE
        WHEN f.Rating = 5 THEN 'Excellent'
        WHEN f.Rating = 4 THEN 'Good'
        WHEN f.Rating = 3 THEN 'Average'
        WHEN f.Rating = 2 THEN 'Poor'
        ELSE                    'Very Poor'
    END                                         AS Sentiment,
    ROUND(AVG(f.Rating) OVER (), 2)             AS OverallAvgRating,
    f.Rating - ROUND(AVG(f.Rating) OVER (), 2) AS VsAverage,
    f.Comments,
    f.SubmittedDate
FROM   FEEDBACK      f
JOIN   CUSTOMER      c   ON f.CustomerID    = c.CustomerID
LEFT JOIN RESERVATION   res ON f.ReservationID = res.ReservationID
LEFT JOIN EVENT_BOOKING eb  ON f.EventID       = eb.EventID
ORDER  BY f.SubmittedDate DESC;


-- -----------------------------------------------------------------------------
-- QUERY 8: Upcoming Events in the Next 30 Days
-- Lists all confirmed events in the next 30 days alongside remaining
-- hall capacity and the booking customer's contact details.
-- -----------------------------------------------------------------------------
SELECT
    eb.EventID,
    eb.EventType,
    eb.EventDate,
    eb.StartTime,
    eb.EndTime,
    TIMESTAMPDIFF(MINUTE, eb.StartTime, eb.EndTime) / 60.0  AS DurationHours,
    eb.ExpectedAttendees,
    h.HallName,
    h.Capacity,
    h.Capacity - eb.ExpectedAttendees                        AS RemainingCapacity,
    CONCAT(c.FirstName, ' ', c.LastName)                     AS BookedBy,
    c.ContactNumber,
    c.Email,
    h.BookingPricePerHour *
        (TIMESTAMPDIFF(MINUTE, eb.StartTime, eb.EndTime) / 60.0)
                                                             AS EstimatedCharge
FROM   EVENT_BOOKING eb
JOIN   HALL     h ON eb.HallID     = h.HallID
JOIN   CUSTOMER c ON eb.CustomerID = c.CustomerID
WHERE  eb.Status    = 'Confirmed'
  AND  eb.EventDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER  BY eb.EventDate, eb.StartTime;


-- -----------------------------------------------------------------------------
-- QUERY 9: Customer Reservation History with Stay Summary (CTE)
-- Full booking history for each customer including total nights stayed,
-- total spend, and last stay date using CTEs.
-- -----------------------------------------------------------------------------
WITH CustomerStayStats AS (
    SELECT
        res.CustomerID,
        COUNT(res.ReservationID)                                    AS TotalBookings,
        SUM(CASE WHEN res.Status = 'Checked-Out' THEN 1 ELSE 0 END) AS CompletedStays,
        SUM(CASE WHEN res.Status = 'Cancelled'   THEN 1 ELSE 0 END) AS CancelledBookings,
        SUM(DATEDIFF(res.CheckOutDate, res.CheckInDate))            AS TotalNightsBooked,
        MAX(res.CheckOutDate)                                       AS LastStayDate
    FROM   RESERVATION res
    GROUP  BY res.CustomerID
),
CustomerSpend AS (
    SELECT
        res.CustomerID,
        COALESCE(SUM(i.TotalAmount), 0)  AS TotalSpend
    FROM   RESERVATION res
    JOIN   INVOICE     i ON i.ReservationID = res.ReservationID
                        AND i.PaymentStatus = 'Paid'
    GROUP  BY res.CustomerID
)
SELECT
    c.CustomerID,
    CONCAT(c.FirstName, ' ', c.LastName)    AS CustomerName,
    c.Email,
    c.RegistrationDate,
    COALESCE(s.TotalBookings,       0)      AS TotalBookings,
    COALESCE(s.CompletedStays,      0)      AS CompletedStays,
    COALESCE(s.CancelledBookings,   0)      AS CancelledBookings,
    COALESCE(s.TotalNightsBooked,   0)      AS TotalNightsBooked,
    COALESCE(sp.TotalSpend,         0)      AS TotalSpend,
    s.LastStayDate
FROM   CUSTOMER c
LEFT JOIN CustomerStayStats s  ON c.CustomerID = s.CustomerID
LEFT JOIN CustomerSpend     sp ON c.CustomerID = sp.CustomerID
ORDER  BY TotalSpend DESC;


-- -----------------------------------------------------------------------------
-- QUERY 10: Double-Booking Risk Detection (Audit Query)
-- Identifies any reservations that overlap in date range for the same room
-- and any event bookings that overlap in time for the same hall.
-- Should return 0 rows if triggers are working correctly.
-- -----------------------------------------------------------------------------
-- Room overlap check
SELECT
    'ROOM OVERLAP'                          AS ConflictType,
    r1.ReservationID                        AS Booking1,
    r2.ReservationID                        AS Booking2,
    r1.RoomNumber,
    r1.CheckInDate                          AS B1_CheckIn,
    r1.CheckOutDate                         AS B1_CheckOut,
    r2.CheckInDate                          AS B2_CheckIn,
    r2.CheckOutDate                         AS B2_CheckOut
FROM   RESERVATION r1
JOIN   RESERVATION r2
    ON  r1.RoomNumber    = r2.RoomNumber
    AND r1.ReservationID < r2.ReservationID
    AND r1.Status        NOT IN ('Cancelled')
    AND r2.Status        NOT IN ('Cancelled')
    AND r1.CheckInDate   < r2.CheckOutDate
    AND r1.CheckOutDate  > r2.CheckInDate

UNION ALL

-- Hall overlap check
SELECT
    'HALL OVERLAP'                          AS ConflictType,
    e1.EventID                              AS Booking1,
    e2.EventID                              AS Booking2,
    CAST(e1.HallID AS CHAR)                 AS HallID,
    CAST(e1.StartTime AS DATETIME)          AS B1_Start,
    CAST(e1.EndTime   AS DATETIME)          AS B1_End,
    CAST(e2.StartTime AS DATETIME)          AS B2_Start,
    CAST(e2.EndTime   AS DATETIME)          AS B2_End
FROM   EVENT_BOOKING e1
JOIN   EVENT_BOOKING e2
    ON  e1.HallID    = e2.HallID
    AND e1.EventDate = e2.EventDate
    AND e1.EventID   < e2.EventID
    AND e1.Status    NOT IN ('Cancelled')
    AND e2.Status    NOT IN ('Cancelled')
    AND e1.StartTime < e2.EndTime
    AND e1.EndTime   > e2.StartTime;


-- =============================================================================
