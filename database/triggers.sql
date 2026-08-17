-- ============================================================
-- GRAND HORIZON HOTEL MANAGEMENT SYSTEM
-- DATABASE TRIGGERS
-- ============================================================

DELIMITER $$

-- ------------------------------------------------------------
-- TRIGGER 1: Prevent room double-booking
-- ------------------------------------------------------------
CREATE TRIGGER trg_prevent_room_double_booking
BEFORE INSERT ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE v_room_status VARCHAR(20);
    DECLARE v_conflict INT DEFAULT 0;

    SELECT Status INTO v_room_status
    FROM ROOM
    WHERE RoomNumber = NEW.RoomNumber;

    IF v_room_status = 'Under Maintenance' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Cannot reserve a room that is Under Maintenance.';
    END IF;

    SELECT COUNT(*) INTO v_conflict
    FROM RESERVATION
    WHERE RoomNumber = NEW.RoomNumber
      AND Status IN ('Confirmed', 'Checked-In')
      AND CheckInDate < NEW.CheckOutDate
      AND CheckOutDate > NEW.CheckInDate;

    IF v_conflict > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Room is already booked for the requested dates. Double-booking prevented.';
    END IF;
END$$


-- ------------------------------------------------------------
-- TRIGGER 2: Automatically create invoice and reserve room
-- ------------------------------------------------------------
CREATE TRIGGER trg_auto_invoice_and_room_status
AFTER INSERT ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE v_room_charges DECIMAL(10,2);

    SET v_room_charges = fn_calculate_room_charge(
        NEW.RoomNumber,
        NEW.CheckInDate,
        NEW.CheckOutDate
    );

    INSERT INTO INVOICE (
        ReservationID,
        EventID,
        RoomCharges,
        EventCharges,
        AdditionalCharges,
        TotalAmount,
        PaymentStatus,
        IssuedDate
    )
    VALUES (
        NEW.ReservationID,
        NULL,
        v_room_charges,
        0.00,
        0.00,
        v_room_charges,
        'Unpaid',
        NOW()
    );

    UPDATE ROOM
    SET Status = 'Reserved'
    WHERE RoomNumber = NEW.RoomNumber;
END$$


-- ------------------------------------------------------------
-- TRIGGER 3: Synchronize room status and block unpaid checkout
-- ------------------------------------------------------------
CREATE TRIGGER trg_sync_room_status_and_block_unpaid_checkout
BEFORE UPDATE ON RESERVATION
FOR EACH ROW
BEGIN
    DECLARE v_payment_status VARCHAR(20);

    IF NEW.Status = 'Checked-Out'
       AND OLD.Status != 'Checked-Out' THEN

        SELECT PaymentStatus
        INTO v_payment_status
        FROM INVOICE
        WHERE ReservationID = NEW.ReservationID;

        IF v_payment_status IS NULL
           OR v_payment_status != 'Paid' THEN

            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT =
                    'Check-out blocked: customer must settle all outstanding payments first.';
        END IF;
    END IF;

    IF NEW.Status = 'Confirmed' THEN

        UPDATE ROOM
        SET Status = 'Reserved'
        WHERE RoomNumber = NEW.RoomNumber;

    ELSEIF NEW.Status = 'Checked-In' THEN

        UPDATE ROOM
        SET Status = 'Occupied'
        WHERE RoomNumber = NEW.RoomNumber;

    ELSEIF NEW.Status IN ('Checked-Out', 'Cancelled') THEN

        UPDATE ROOM
        SET Status = 'Available'
        WHERE RoomNumber = NEW.RoomNumber;

    END IF;
END$$

DELIMITER ;
