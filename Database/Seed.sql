-- ============================================================
--  Dental Clinic — Professional Seed Data (with Auth & Roles)
-- ============================================================
USE DentalClinicSystem;
GO

-- 2. CREATE SYSTEM USERS (Password for all is: 123456)
-- Hash: a3c0bcb373ed21bb0aa75fd0d9868f75c29673722b9a2f5f073fbd1f4d736d36
-- Note: Real apps should hash uniquely. These are placeholders.
IF NOT EXISTS (SELECT 1 FROM SystemUser WHERE Email = 'admin@dental.com')
BEGIN
    INSERT INTO SystemUser (Name, Email, Password_Hash, Role, Phone)
    VALUES ('System Admin', 'admin@dental.com', '12345678', 'admin', '01000000000');
END

IF NOT EXISTS (SELECT 1 FROM SystemUser WHERE Email = 'staff@dental.com')
BEGIN
    INSERT INTO SystemUser (Name, Email, Password_Hash, Role, Phone)
    VALUES ('Amr Receptionist', 'staff@dental.com', '12345678', 'receptionist', '01234567890');
END

IF NOT EXISTS (SELECT 1 FROM SystemUser WHERE Email = 'doctor@dental.com')
BEGIN
    INSERT INTO SystemUser (Name, Email, Password_Hash, Role, Phone)
    VALUES ('Dr. Ali Ahmed', 'doctor@dental.com', '12345678', 'doctor', '01111111111');
END

IF NOT EXISTS (SELECT 1 FROM SystemUser WHERE Email = 'patient@dental.com')
BEGIN
    INSERT INTO SystemUser (Name, Email, Password_Hash, Role, Phone)
    VALUES ('Amr Patient', 'patient@dental.com', '12345678', 'patient', '01040203369');
END
GO

-- 3. LINK USERS TO ROLE TABLES
-- Receptionist
IF NOT EXISTS (SELECT 1 FROM Receptionist WHERE Email = 'staff@dental.com')
BEGIN
    INSERT INTO Receptionist (User_ID, Name, Email, Phone)
    SELECT User_ID, Name, Email, Phone FROM SystemUser WHERE Email = 'staff@dental.com';
END

-- Doctor
IF NOT EXISTS (SELECT 1 FROM Doctor WHERE Email = 'doctor@dental.com')
BEGIN
    INSERT INTO Doctor (User_ID, Name, Specialty, Email, Phone, WorkingHours)
    SELECT User_ID, Name, 'General Dentist', Email, Phone, 'Sun-Thu 09:00-17:00' 
    FROM SystemUser WHERE Email = 'doctor@dental.com';
END

-- Patient
IF NOT EXISTS (SELECT 1 FROM Patient WHERE Email = 'patient@dental.com')
BEGIN
    INSERT INTO Patient (User_ID, First_Name, Last_Name, Email, Phone, Gender, DateOfBirth)
    SELECT User_ID, 'Amr', 'Patient', Email, Phone, 'Male', '1995-01-01'
    FROM SystemUser WHERE Email = 'patient@dental.com';
END
GO

-- 4. ADD SAMPLE DOCTORS
IF NOT EXISTS (SELECT 1 FROM Doctor WHERE Email = 'laila@dental.com')
BEGIN
    INSERT INTO Doctor (Name, Specialty, Phone, Email, WorkingHours) VALUES
    ('Dr. Laila Khaled',  'Orthodontist', '01198765432', 'laila@dental.com', 'Mon-Fri 10:00-18:00'),
    ('Dr. Omar Youssef',  'Oral Surgeon',  '01234567890', 'omar@dental.com',  'Sat-Wed 08:00-16:00');
END

-- 5. ADD SAMPLE TREATMENTS
IF NOT EXISTS (SELECT 1 FROM Treatment WHERE Treatment_Name = 'Teeth Cleaning')
BEGIN
    INSERT INTO Treatment (Treatment_Name, Description, Cost) VALUES
    ('Teeth Cleaning',   'Professional cleaning and scaling', 150.00),
    ('Tooth Filling',    'Composite resin filling',           200.00),
    ('Root Canal',       'Endodontic treatment',              800.00),
    ('Teeth Whitening',  'In-office bleaching',               500.00);
END
GO

-- 6. ADD SAMPLE APPOINTMENTS (Link to the created patient and doctor)
DECLARE @pId INT, @dId INT;
SELECT @pId = Patient_ID FROM Patient WHERE Email = 'patient@dental.com';
SELECT @dId = Doctor_ID FROM Doctor WHERE Email = 'doctor@dental.com';

IF @pId IS NOT NULL AND @dId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Appointment WHERE Patient_ID = @pId AND CAST(AppointmentDate AS DATE) = CAST(GETDATE() AS DATE))
    BEGIN
        INSERT INTO Appointment (Patient_ID, Doctor_ID, AppointmentDate, Appointment_Time, Status, Reason)
        VALUES (@pId, @dId, CAST(GETDATE() AS DATE), '10:00 AM', 'Confirmed', 'Routine Checkup');
        
        INSERT INTO Appointment (Patient_ID, Doctor_ID, AppointmentDate, Appointment_Time, Status, Reason)
        VALUES (@pId, @dId, DATEADD(DAY, 1, GETDATE()), '02:00 PM', 'Scheduled', 'Follow up cleaning');
    END
END
GO

PRINT '============================================================';
PRINT '  Professional Seed Data Inserted Successfully!';
PRINT '  Login Emails: admin@dental.com, staff@dental.com,';
PRINT '                doctor@dental.com, patient@dental.com';
PRINT '  Password for all: 123456 (Note: Hashes are placeholders)';
PRINT '============================================================';
