USE master;
GO

-- Create database if it does not exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DentalClinicSystem')
BEGIN
    CREATE DATABASE DentalClinicSystem1;
    PRINT 'Database DentalClinicSystem created.';
END
GO

USE DentalClinicSystem1;
GO

-- Patients
CREATE TABLE Patients (
    PatientID INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Gender NVARCHAR(20),
    DateOfBirth DATE,
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    MedicalHistory NVARCHAR(MAX)
);

-- Doctors
CREATE TABLE Doctors (
    DoctorID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100),
    Specialty NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    WorkingHours NVARCHAR(100)
);

-- Appointments
CREATE TABLE Appointments (
    AppointmentID INT PRIMARY KEY IDENTITY(1,1),
    PatientID INT FOREIGN KEY REFERENCES Patients(PatientID),
    DoctorID INT FOREIGN KEY REFERENCES Doctors(DoctorID),
    AppointmentDate DATE,
    AppointmentTime NVARCHAR(20),
    Status NVARCHAR(50),
    Reason NVARCHAR(MAX)
);

-- Treatments
CREATE TABLE Treatments (
    TreatmentID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100),
    Description NVARCHAR(MAX),
    Cost DECIMAL(10,2),
    Duration NVARCHAR(50),
    Category NVARCHAR(50)
);

-- Visits
CREATE TABLE Visits (
    VisitID INT PRIMARY KEY IDENTITY(1,1),
    PatientID INT FOREIGN KEY REFERENCES Patients(PatientID),
    DoctorID INT FOREIGN KEY REFERENCES Doctors(DoctorID),
    VisitDate DATE,
    Diagnosis NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    Status NVARCHAR(50)
);

-- Invoices
CREATE TABLE Invoices (
    InvoiceID INT PRIMARY KEY IDENTITY(1,1),
    PatientID INT FOREIGN KEY REFERENCES Patients(PatientID),
    TotalAmount DECIMAL(10,2),
    Discount DECIMAL(10,2),
    FinalAmount DECIMAL(10,2),
    Status NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Payments
CREATE TABLE Payments (
    PaymentID INT PRIMARY KEY IDENTITY(1,1),
    InvoiceID INT FOREIGN KEY REFERENCES Invoices(InvoiceID),
    Amount DECIMAL(10,2),
    PaymentMethod NVARCHAR(50),
    PaymentDate DATE,
    Notes NVARCHAR(MAX)
);

-- Users (للـ Auth)
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100),
    Email NVARCHAR(100) UNIQUE,
    Password NVARCHAR(255),
    Role NVARCHAR(50),
    Phone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE()
);
