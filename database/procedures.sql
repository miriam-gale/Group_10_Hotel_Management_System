-- =============================================================================
-- GRAND HORIZON HOTEL
-- STORED PROCEDURES AND USER-DEFINED FUNCTIONS
-- =============================================================================

USE grand_horizon_hotel;

-- SECTION 3 — STORED PROCEDURES (3)
-- =============================================================================

DELIMITER $$

-- -----------------------------------------------------------------------------
-- PROCEDURE 1: sp_make_reservation
-- Creates a new room reservation with full validation and auto-generates
-- a unique booking reference. Returns ReservationID and BookingReference.
-- Note: Application layer (reservations.js) uses BEGIN/COMMIT/ROLLBACK
--       transactions for atomic reservation + invoice creation.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_make_reservation (
    IN  p_customer_id     INT,
    IN  p_room_number     VARCHAR(10),
    IN  p_check_in        DATETIME,
    IN  p_check_out       DATETIME,
    IN  p_num_occupants   INT,
    OUT p_booking_ref     VARCHAR(20),
    OUT p_reservation_id  INT
)
BEGIN
    DECLARE v_room_status   VARCHAR(20);
    DECLARE v_max_occ       INT;
    DECLARE v_conflict      INT DEFAULT 0;
    DECLARE v_ref           VARCHAR(20);
    DECLARE v_price         DECIMAL(10,2);
    DECLARE v_nights        INT;
    DECLARE v_charges       DECIMAL(10,2);

    -- Validate check-in before check-out
    IF p_check_in >= p_check_out THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Check-in date must be earlier than check-out date.';
    END IF;

    -- Validate room exists and get status
    SELECT Status, MaxOccupants
    INTO   v_room_status, v_max_occ
    FROM   ROOM WHERE RoomNumber = p_room_number;

    IF v_room_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room not found.';
    END IF;

    IF v_room_status = 'Under Maintenance' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot reserve a room that is Under Maintenance.';
    END IF;

    IF p_num_occupants > v_max_occ THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Number of occupants exceeds the room maximum.';
    END IF;

    -- Check for date overlap conflicts
    SELECT COUNT(*) INTO v_conflict
    FROM   RESERVATION
    WHERE  RoomNumber    = p_room_number
      AND  Status        IN ('Confirmed', 'Checked-In')
      AND  CheckInDate   < p_check_out
      AND  CheckOutDate  > p_check_in;

    IF v_conflict > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is already booked for the requested dates.';
    END IF;

    -- Generate unique booking reference
    SET v_ref = CONCAT('GH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-',
                       LPAD(FLOOR(RAND() * 99999), 5, '0'));

    -- BEGIN TRANSACTION
    START TRANSACTION;

    -- Insert reservation
    INSERT INTO RESERVATION (
        CustomerID, RoomNumber, CheckInDate, CheckOutDate,
        NumOccupants, Status, BookingReference
    ) VALUES (
        p_customer_id, p_room_number, p_check_in, p_check_out,
        p_num_occupants, 'Confirmed', v_ref
    );

    SET p_reservation_id = LAST_INSERT_ID();

    -- Calculate and insert invoice
    SELECT rc.PricePerNight INTO v_price
    FROM   ROOM r JOIN ROOM_CATEGORY rc ON r.CategoryID = rc.CategoryID
    WHERE  r.RoomNumber = p_room_number;

    SET v_nights  = DATEDIFF(p_check_out, p_check_in);
    SET v_charges = v_price * v_nights;

    INSERT INTO INVOICE (
        ReservationID, EventID, RoomCharges, EventCharges,
        AdditionalCharges, TotalAmount, PaymentStatus, IssuedDate
    ) VALUES (
        p_reservation_id, NULL, v_charges, 0.00, 0.00, v_charges, 'Unpaid', NOW()
    );

    -- Update room status
    UPDATE ROOM SET Status = 'Reserved' WHERE RoomNumber = p_room_number;

    COMMIT;

    SET p_booking_ref = v_ref;
    SELECT CONCAT('Reservation confirmed. Reference: ', v_ref) AS Message;
END$$


-- -----------------------------------------------------------------------------
-- PROCEDURE 2: sp_process_checkout
-- Handles the full guest check-out workflow with transaction:
--   1. Validates reservation is Checked-In
--   2. Optionally applies a late check-out fee
--   3. Validates invoice is fully paid
--   4. Updates reservation and room status atomically
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_process_checkout (
    IN p_reservation_id    INT,
    IN p_late_checkout_fee DECIMAL(10,2)
)
BEGIN
    DECLARE v_status         VARCHAR(20);
    DECLARE v_payment_status VARCHAR(20);
    DECLARE v_invoice_id     INT;
    DECLARE v_room_number    VARCHAR(10);

    -- Validate reservation
    SELECT Status, RoomNumber INTO v_status, v_room_number
    FROM   RESERVATION WHERE ReservationID = p_reservation_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reservation not found.';
    END IF;

    IF v_status != 'Checked-In' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guest is not currently Checked-In.';
    END IF;

    SELECT InvoiceID, PaymentStatus INTO v_invoice_id, v_payment_status
    FROM   INVOICE WHERE ReservationID = p_reservation_id;

    -- BEGIN TRANSACTION
    START TRANSACTION;

    -- Apply late check-out fee if provided
    IF p_late_checkout_fee > 0 THEN
        UPDATE INVOICE
        SET    AdditionalCharges = AdditionalCharges + p_late_checkout_fee,
               TotalAmount       = TotalAmount + p_late_checkout_fee
        WHERE  InvoiceID = v_invoice_id;

        SELECT PaymentStatus INTO v_payment_status
        FROM   INVOICE WHERE InvoiceID = v_invoice_id;
    END IF;

    -- Block check-out if invoice is unpaid
    IF v_payment_status != 'Paid' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Outstanding invoice must be settled before check-out.';
    END IF;

    -- Process check-out
    UPDATE RESERVATION
    SET    Status = 'Checked-Out', ActualCheckOut = NOW()
    WHERE  ReservationID = p_reservation_id;

    UPDATE ROOM SET Status = 'Available' WHERE RoomNumber = v_room_number;

    COMMIT;

    SELECT 'Check-out processed successfully.' AS Message;
END$$


-- -----------------------------------------------------------------------------
-- PROCEDURE 3: sp_generate_occupancy_report
-- Generates a summary occupancy report for a given date range.
-- Returns two result sets: overall summary and breakdown by room category.
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_generate_occupancy_report (
    IN p_start_date DATE,
    IN p_end_date   DATE
)
BEGIN
    IF p_start_date > p_end_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Start date must be before or equal to end date.';
    END IF;

    -- Overall summary
    SELECT
        p_start_date                                            AS ReportFrom,
        p_end_date                                              AS ReportTo,
        COUNT(DISTINCT res.ReservationID)                       AS TotalReservations,
        SUM(CASE WHEN res.Status = 'Checked-Out' THEN 1 ELSE 0 END) AS CompletedStays,
        SUM(CASE WHEN res.Status = 'Cancelled'   THEN 1 ELSE 0 END) AS Cancellations,
        SUM(res.NumOccupants)                                   AS TotalGuestNights,
        COALESCE(SUM(i.RoomCharges), 0)                         AS TotalRoomRevenue,
        COALESCE(SUM(i.AdditionalCharges), 0)                   AS TotalAdditionalRevenue,
        COALESCE(SUM(i.TotalAmount), 0)                         AS TotalRevenue
    FROM   RESERVATION res
    LEFT JOIN INVOICE i ON i.ReservationID = res.ReservationID
                       AND i.PaymentStatus = 'Paid'
    WHERE  DATE(res.CheckInDate) BETWEEN p_start_date AND p_end_date;

    -- Breakdown by room category
    SELECT
        rc.CategoryName,
        COUNT(res.ReservationID)                                AS Bookings,
        SUM(DATEDIFF(res.CheckOutDate, res.CheckInDate))        AS TotalNights,
        COALESCE(SUM(i.RoomCharges), 0)                         AS Revenue
    FROM   RESERVATION   res
    JOIN   ROOM          r  ON res.RoomNumber = r.RoomNumber
    JOIN   ROOM_CATEGORY rc ON r.CategoryID  = rc.CategoryID
    LEFT JOIN INVOICE    i  ON i.ReservationID = res.ReservationID
                           AND i.PaymentStatus = 'Paid'
    WHERE  DATE(res.CheckInDate) BETWEEN p_start_date AND p_end_date
    GROUP  BY rc.CategoryName
    ORDER  BY Revenue DESC;
END$$


DELIMITER ;


-- =============================================================================
-- SECTION 4 — USER-DEFINED FUNCTIONS (2)
-- =============================================================================

DELIMITER $$

-- -----------------------------------------------------------------------------
-- FUNCTION 1: fn_calculate_room_charge
-- Calculates the total room charge for a reservation.
-- Usage: SELECT fn_calculate_room_charge('201', '2026-08-10', '2026-08-14');
-- -----------------------------------------------------------------------------
CREATE FUNCTION fn_calculate_room_charge (
    p_room_number  VARCHAR(10),
    p_check_in     DATETIME,
    p_check_out    DATETIME
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_price_per_night DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_nights          INT           DEFAULT 0;

    SELECT rc.PricePerNight INTO v_price_per_night
    FROM   ROOM r
    JOIN   ROOM_CATEGORY rc ON r.CategoryID = rc.CategoryID
    WHERE  r.RoomNumber = p_room_number;

    SET v_nights = DATEDIFF(p_check_out, p_check_in);

    IF v_nights <= 0 THEN RETURN 0.00; END IF;

    RETURN v_price_per_night * v_nights;
END$$


-- -----------------------------------------------------------------------------
-- FUNCTION 2: fn_calculate_event_charge
-- Calculates the total hall charge for an event booking.
-- Usage: SELECT fn_calculate_event_charge(1, '09:00:00', '17:00:00');
-- -----------------------------------------------------------------------------
CREATE FUNCTION fn_calculate_event_charge (
    p_hall_id    INT,
    p_start_time TIME,
    p_end_time   TIME
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_price_per_hour DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_minutes        INT           DEFAULT 0;

    SELECT BookingPricePerHour INTO v_price_per_hour
    FROM   HALL WHERE HallID = p_hall_id;

    SET v_minutes = TIMESTAMPDIFF(MINUTE,
                        CONCAT('2000-01-01 ', p_start_time),
                        CONCAT('2000-01-01 ', p_end_time));

    IF v_minutes <= 0 THEN RETURN 0.00; END IF;

    RETURN ROUND(v_price_per_hour * (v_minutes / 60.0), 2);
END$$


DELIMITER ;


-- =============================================================================
