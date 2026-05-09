CREATE DATABASE DentalClinicSystem1;
GO

USE DentalClinicSystem1;
GO

-- USERS
CREATE TABLE dbo.Users
(
    UserID       INT IDENTITY(1,1) PRIMARY KEY,
    Name         NVARCHAR(150) NOT NULL,
    Email        NVARCHAR(255) NOT NULL,
    Password     NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(30)  NOT NULL,
    Phone        NVARCHAR(30)  NULL,
    CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT CK_Users_Role CHECK (Role IN ('patient', 'doctor', 'receptionist'))
);
GO

-- DOCTORS
CREATE TABLE dbo.Doctors
(
    DoctorID      INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(150) NOT NULL,
    Specialty     NVARCHAR(100) NULL,
    Phone         NVARCHAR(30)  NULL,
    Email         NVARCHAR(255) NULL,
    WorkingHours  NVARCHAR(150) NULL,
    CreatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Doctors_CreatedAt DEFAULT SYSUTCDATETIME()
);
GO

-- PATIENTS
CREATE TABLE dbo.Patients
(
    PatientID        INT IDENTITY(1,1) PRIMARY KEY,
    FirstName        NVARCHAR(100) NOT NULL,
    LastName         NVARCHAR(100) NOT NULL,
    Gender           NVARCHAR(20)  NULL,
    DateOfBirth      DATE          NULL,
    Phone            NVARCHAR(30)  NULL,
    Email            NVARCHAR(255) NULL,
    Address          NVARCHAR(300) NULL,
    MedicalHistory   NVARCHAR(MAX) NULL,
    DoctorID         INT           NULL,
    CreatedAt        DATETIME2     NOT NULL CONSTRAINT DF_Patients_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Patients_Doctors FOREIGN KEY (DoctorID) REFERENCES dbo.Doctors(DoctorID)
);
GO

-- TREATMENTS
CREATE TABLE dbo.Treatments
(
    TreatmentID    INT IDENTITY(1,1) PRIMARY KEY,
    Name           NVARCHAR(150) NOT NULL,
    Description    NVARCHAR(MAX) NULL,
    Cost           DECIMAL(10,2) NOT NULL CONSTRAINT DF_Treatments_Cost DEFAULT 0,
    Duration       NVARCHAR(50)  NULL,
    Category       NVARCHAR(100) NULL,
    CreatedAt      DATETIME2     NOT NULL CONSTRAINT DF_Treatments_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Treatments_Cost CHECK (Cost >= 0)
);
GO

-- APPOINTMENTS
CREATE TABLE dbo.Appointments
(
    AppointmentID     INT IDENTITY(1,1) PRIMARY KEY,
    PatientID         INT NOT NULL,
    DoctorID          INT NOT NULL,
    AppointmentDate   DATE NOT NULL,
    AppointmentTime   NVARCHAR(50) NOT NULL,
    Status            NVARCHAR(30) NOT NULL CONSTRAINT DF_Appointments_Status DEFAULT 'Scheduled',
    Reason            NVARCHAR(MAX) NULL,
    CreatedAt         DATETIME2 NOT NULL CONSTRAINT DF_Appointments_CreatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Appointments_Patients FOREIGN KEY (PatientID) REFERENCES dbo.Patients(PatientID),
    CONSTRAINT FK_Appointments_Doctors  FOREIGN KEY (DoctorID)  REFERENCES dbo.Doctors(DoctorID),
    CONSTRAINT CK_Appointments_Status CHECK (Status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'))
);
GO

-- VISITS
CREATE TABLE dbo.Visits
(
    VisitID        INT IDENTITY(1,1) PRIMARY KEY,
    PatientID      INT NOT NULL,
    DoctorID       INT NOT NULL,
    VisitDate      DATE NOT NULL,
    Diagnosis      NVARCHAR(MAX) NULL,
    Notes          NVARCHAR(MAX) NULL,
    Status         NVARCHAR(40) NOT NULL CONSTRAINT DF_Visits_Status DEFAULT 'In Progress',
    CreatedAt      DATETIME2 NOT NULL CONSTRAINT DF_Visits_CreatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Visits_Patients FOREIGN KEY (PatientID) REFERENCES dbo.Patients(PatientID),
    CONSTRAINT FK_Visits_Doctors  FOREIGN KEY (DoctorID)  REFERENCES dbo.Doctors(DoctorID),
    CONSTRAINT CK_Visits_Status CHECK (Status IN ('In Progress', 'Completed', 'Follow-Up Required'))
);


-- VISIT TREATMENTS {N / M}
CREATE TABLE dbo.VisitTreatments
(
    VisitID       INT NOT NULL,
    TreatmentID   INT NOT NULL,
    Quantity      INT NOT NULL CONSTRAINT DF_VisitTreatments_Quantity DEFAULT 1,
    Notes         NVARCHAR(MAX) NULL,

    CONSTRAINT PK_VisitTreatments PRIMARY KEY (VisitID, TreatmentID),
    CONSTRAINT FK_VisitTreatments_Visits      FOREIGN KEY (VisitID) REFERENCES dbo.Visits(VisitID) ON DELETE CASCADE,
    CONSTRAINT FK_VisitTreatments_Treatments  FOREIGN KEY (TreatmentID) REFERENCES dbo.Treatments(TreatmentID),
    CONSTRAINT CK_VisitTreatments_Quantity CHECK (Quantity > 0)
);
GO

-- INVOICES
CREATE TABLE dbo.Invoices
(
    InvoiceID      INT IDENTITY(1,1) PRIMARY KEY,
    PatientID      INT NOT NULL,
    TotalAmount    DECIMAL(10,2) NOT NULL CONSTRAINT DF_Invoices_TotalAmount DEFAULT 0,
    Discount       DECIMAL(10,2) NOT NULL CONSTRAINT DF_Invoices_Discount DEFAULT 0,
    FinalAmount AS (
        CASE
            WHEN (TotalAmount - ISNULL(Discount, 0)) < 0 THEN CONVERT(DECIMAL(10,2), 0)
            ELSE CONVERT(DECIMAL(10,2), TotalAmount - ISNULL(Discount, 0))
        END
    ) PERSISTED,
    Status         NVARCHAR(20) NOT NULL CONSTRAINT DF_Invoices_Status DEFAULT 'Unpaid',
    CreatedAt      DATETIME2 NOT NULL CONSTRAINT DF_Invoices_CreatedAt DEFAULT SYSUTCDATETIME(),
    Notes          NVARCHAR(MAX) NULL,

    CONSTRAINT FK_Invoices_Patients FOREIGN KEY (PatientID) REFERENCES dbo.Patients(PatientID),
    CONSTRAINT CK_Invoices_Status CHECK (Status IN ('Paid', 'Unpaid', 'Partial')),
    CONSTRAINT CK_Invoices_TotalAmount CHECK (TotalAmount >= 0),
    CONSTRAINT CK_Invoices_Discount CHECK (Discount >= 0)
);
GO


-- PAYMENTS
CREATE TABLE dbo.Payments
(
    PaymentID        INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID        INT NOT NULL,
    Amount           DECIMAL(10,2) NOT NULL,
    PaymentMethod    NVARCHAR(50)  NOT NULL,
    PaymentDate      DATE          NOT NULL,
    Notes            NVARCHAR(MAX) NULL,
    CreatedAt        DATETIME2 NOT NULL CONSTRAINT DF_Payments_CreatedAt DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_Payments_Invoices FOREIGN KEY (InvoiceID) REFERENCES dbo.Invoices(InvoiceID),
    CONSTRAINT CK_Payments_Amount CHECK (Amount > 0)
);
GO