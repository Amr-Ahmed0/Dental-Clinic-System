-- ============================================================
--  Dental Clinic Management System — Database Schema
--  Compatible with: SQL Server 2016+
-- ============================================================

USE master;
GO

-- Create database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DentalClinicSystem')
BEGIN
    CREATE DATABASE DentalClinicSystem;
    PRINT 'Database DentalClinicSystem created.';
END
GO

USE DentalClinicSystem;
GO

-- ─────────────────────────────────────────────────────────────
--  Patient
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Patient', 'U') IS NULL
BEGIN
    CREATE TABLE Patient (
        Patient_ID     INT           IDENTITY(1,1) PRIMARY KEY,
        First_Name     NVARCHAR(50)  NOT NULL,
        Last_Name      NVARCHAR(50)  NOT NULL,
        Gender         NVARCHAR(10)  NULL,          -- 'Male' | 'Female' | 'Other'
        DateOfBirth    DATE          NULL,
        Phone          NVARCHAR(20)  NULL,
        Address        NVARCHAR(MAX) NULL,
        Email          NVARCHAR(100) NULL,
        MedicalHistory NVARCHAR(MAX) NULL,
        Created_At     DATETIME      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Patient created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Doctor
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Doctor', 'U') IS NULL
BEGIN
    CREATE TABLE Doctor (
        Doctor_ID    INT           IDENTITY(1,1) PRIMARY KEY,
        Name         NVARCHAR(100) NOT NULL,
        Specialty    NVARCHAR(100) NULL,
        Phone        NVARCHAR(20)  NULL,
        Email        NVARCHAR(100) NULL,
        WorkingHours NVARCHAR(100) NULL,
        Created_At   DATETIME      NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Doctor created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Treatment
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Treatment', 'U') IS NULL
BEGIN
    CREATE TABLE Treatment (
        Treatment_ID   INT            IDENTITY(1,1) PRIMARY KEY,
        Treatment_Name NVARCHAR(100)  NOT NULL,
        Description    NVARCHAR(MAX)  NULL,
        Cost           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Created_At     DATETIME       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table Treatment created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Appointment
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Appointment', 'U') IS NULL
BEGIN
    CREATE TABLE Appointment (
        Appointment_ID   INT           IDENTITY(1,1) PRIMARY KEY,
        Patient_ID       INT           NOT NULL,
        Doctor_ID        INT           NOT NULL,
        AppointmentDate  DATE          NOT NULL,
        Appointment_Time NVARCHAR(8)   NOT NULL,   -- e.g. '09:00 AM'
        Status           NVARCHAR(20)  NOT NULL DEFAULT 'Scheduled',
        -- Scheduled | Confirmed | Completed | Cancelled | No-Show
        Reason           NVARCHAR(MAX) NULL,
        Created_At       DATETIME      NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Appointment_Patient FOREIGN KEY (Patient_ID)
            REFERENCES Patient(Patient_ID) ON DELETE CASCADE,
        CONSTRAINT FK_Appointment_Doctor  FOREIGN KEY (Doctor_ID)
            REFERENCES Doctor(Doctor_ID)  ON DELETE CASCADE,
        CONSTRAINT CK_Appointment_Status CHECK (
            Status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show')
        )
    );
    PRINT 'Table Appointment created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Visit
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Visit', 'U') IS NULL
BEGIN
    CREATE TABLE Visit (
        Visit_ID       INT           IDENTITY(1,1) PRIMARY KEY,
        Appointment_ID INT           NOT NULL UNIQUE,  -- one visit per appointment
        Diagnosis      NVARCHAR(MAX) NULL,
        Notes          NVARCHAR(MAX) NULL,
        Visit_Date     DATE          NOT NULL,
        Created_At     DATETIME      NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Visit_Appointment FOREIGN KEY (Appointment_ID)
            REFERENCES Appointment(Appointment_ID) ON DELETE CASCADE
    );
    PRINT 'Table Visit created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Visit_Treatment  (junction)
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Visit_Treatment', 'U') IS NULL
BEGIN
    CREATE TABLE Visit_Treatment (
        VT_ID        INT IDENTITY(1,1) PRIMARY KEY,
        Visit_ID     INT NOT NULL,
        Treatment_ID INT NOT NULL,
        Quantity     INT NOT NULL DEFAULT 1,

        CONSTRAINT FK_VT_Visit     FOREIGN KEY (Visit_ID)
            REFERENCES Visit(Visit_ID)         ON DELETE CASCADE,
        CONSTRAINT FK_VT_Treatment FOREIGN KEY (Treatment_ID)
            REFERENCES Treatment(Treatment_ID) ON DELETE NO ACTION,
        CONSTRAINT UQ_VT UNIQUE (Visit_ID, Treatment_ID)
    );
    PRINT 'Table Visit_Treatment created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Invoice
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Invoice', 'U') IS NULL
BEGIN
    CREATE TABLE Invoice (
        Invoice_ID   INT            IDENTITY(1,1) PRIMARY KEY,
        Visit_ID     INT            NOT NULL UNIQUE,   -- one invoice per visit
        Total_Amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Discount     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Final_Amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        Status       NVARCHAR(20)   NOT NULL DEFAULT 'Unpaid',
        -- Unpaid | Paid | Cancelled | Partial
        Created_At   DATETIME       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Invoice_Visit FOREIGN KEY (Visit_ID)
            REFERENCES Visit(Visit_ID) ON DELETE CASCADE,
        CONSTRAINT CK_Invoice_Status CHECK (
            Status IN ('Paid', 'Unpaid', 'Cancelled', 'Partial')
        )
    );
    PRINT 'Table Invoice created.';
END
GO

-- ─────────────────────────────────────────────────────────────
--  Payment
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.Payment', 'U') IS NULL
BEGIN
    CREATE TABLE Payment (
        Payment_ID     INT            IDENTITY(1,1) PRIMARY KEY,
        Invoice_ID     INT            NOT NULL,
        Payment_Date   DATE           NOT NULL,
        Amount         DECIMAL(10, 2) NOT NULL,
        Payment_Method NVARCHAR(50)   NOT NULL,
        -- Cash | Card | Insurance | Bank Transfer | Online
        Created_At     DATETIME       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_Payment_Invoice FOREIGN KEY (Invoice_ID)
            REFERENCES Invoice(Invoice_ID) ON DELETE CASCADE,
        CONSTRAINT CK_Payment_Method CHECK (
            Payment_Method IN ('Cash', 'Card', 'Insurance', 'Bank Transfer', 'Online')
        )
    );
    PRINT 'Table Payment created.';
END
GO

PRINT '============================================================';
PRINT '  Schema created successfully!';
PRINT '============================================================';
