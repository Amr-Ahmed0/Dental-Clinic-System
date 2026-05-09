IF NOT EXISTS (SELECT 1 FROM dbo.Doctors)
BEGIN
    INSERT INTO dbo.Doctors (Name, Specialty, Phone, Email, WorkingHours)
    VALUES
    (N'Dr. Sarah Johnson', N'General Dentistry', N'555-0101', N'sarah@clinic.com', N'Mon-Fri 09:00-17:00'),
    (N'Dr. Michael Chen', N'Orthodontics', N'555-0102', N'michael@clinic.com', N'Mon-Thu 10:00-18:00'),
    (N'Dr. Emily Davis', N'Periodontics', N'555-0103', N'emily@clinic.com', N'Tue-Sat 08:00-16:00');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    INSERT INTO dbo.Users (Name, Email, Password, Role, Phone)
    VALUES
    (N'Admin User',       N'admin@clinic.com',  N'admin123',   N'receptionist', N'555-0001'),
    (N'Dr. Sarah Johnson',N'sarah@clinic.com',  N'doctor123',  N'doctor',       N'555-0101'),
    (N'John Smith',       N'john@email.com',    N'patient123', N'patient',      N'555-1001');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Patients)
BEGIN
    INSERT INTO dbo.Patients (FirstName, LastName, Gender, DateOfBirth, Phone, Email, Address, MedicalHistory, DoctorID)
    VALUES
    (N'John',   N'Smith',    N'Male',   '1985-03-15', N'555-1001', N'john@email.com',    N'123 Main St', N'No allergies',         (SELECT TOP 1 DoctorID FROM dbo.Doctors WHERE Name = N'Dr. Sarah Johnson')),
    (N'Maria',  N'Garcia',   N'Female', '1990-07-22', N'555-1002', N'maria@email.com',   N'456 Oak Ave', N'Penicillin allergy',  (SELECT TOP 1 DoctorID FROM dbo.Doctors WHERE Name = N'Dr. Michael Chen')),
    (N'Robert', N'Williams', N'Male',   '1978-11-30', N'555-1003', N'robert@email.com',  N'789 Pine Rd', N'Diabetes type 2',     (SELECT TOP 1 DoctorID FROM dbo.Doctors WHERE Name = N'Dr. Emily Davis')),
    (N'Lisa',   N'Brown',    N'Female', '1995-01-10', N'555-1004', N'lisa@email.com',    N'321 Elm St',  N'None',                (SELECT TOP 1 DoctorID FROM dbo.Doctors WHERE Name = N'Dr. Sarah Johnson'));
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Treatments)
BEGIN
    INSERT INTO dbo.Treatments (Name, Description, Cost, Duration, Category)
    VALUES
    (N'Dental Cleaning', N'Professional teeth cleaning', 120.00, N'45 min', N'Preventive'),
    (N'Tooth Filling',   N'Composite filling',           200.00, N'60 min', N'Restorative'),
    (N'Root Canal',      N'Endodontic treatment',        800.00, N'90 min', N'Endodontics'),
    (N'Teeth Whitening', N'Professional whitening',      350.00, N'60 min', N'Cosmetic');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Appointments)
BEGIN
    INSERT INTO dbo.Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status, Reason)
    VALUES
    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'john@email.com'),
     (SELECT TOP 1 DoctorID  FROM dbo.Doctors  WHERE Name = N'Dr. Sarah Johnson'),
     CONVERT(date, GETDATE()), N'09:00 AM', N'Confirmed', N'Routine checkup'),

    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'maria@email.com'),
     (SELECT TOP 1 DoctorID  FROM dbo.Doctors  WHERE Name = N'Dr. Michael Chen'),
     DATEADD(DAY, 1, CONVERT(date, GETDATE())), N'10:30 AM', N'Scheduled', N'Braces adjustment');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Visits)
BEGIN
    INSERT INTO dbo.Visits (PatientID, DoctorID, VisitDate, Diagnosis, Notes, Status)
    VALUES
    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'lisa@email.com'),
     (SELECT TOP 1 DoctorID  FROM dbo.Doctors  WHERE Name = N'Dr. Sarah Johnson'),
     DATEADD(DAY, -1, CONVERT(date, GETDATE())), N'Mild staining', N'Whitening performed successfully.', N'Completed');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.VisitTreatments)
BEGIN
    INSERT INTO dbo.VisitTreatments (VisitID, TreatmentID, Quantity)
    VALUES
    ((SELECT TOP 1 VisitID FROM dbo.Visits ORDER BY VisitID DESC),
     (SELECT TOP 1 TreatmentID FROM dbo.Treatments WHERE Name = N'Teeth Whitening'),
     1);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Invoices)
BEGIN
    INSERT INTO dbo.Invoices (PatientID, TotalAmount, Discount, Status, Notes)
    VALUES
    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'john@email.com'),   280.00,  0.00, N'Unpaid',  N'General visit invoice'),
    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'maria@email.com'), 1500.00,150.00, N'Partial', N'Orthodontic treatment plan'),
    ((SELECT TOP 1 PatientID FROM dbo.Patients WHERE Email = N'lisa@email.com'),   350.00, 35.00, N'Paid',    N'Whitening session');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Payments)
BEGIN
    INSERT INTO dbo.Payments (InvoiceID, Amount, PaymentMethod, PaymentDate, Notes)
    VALUES
    ((SELECT TOP 1 InvoiceID FROM dbo.Invoices i INNER JOIN dbo.Patients p ON p.PatientID = i.PatientID WHERE p.Email = N'maria@email.com'), 500.00, N'Cash',      CONVERT(date, GETDATE()), N'First installment'),
    ((SELECT TOP 1 InvoiceID FROM dbo.Invoices i INNER JOIN dbo.Patients p ON p.PatientID = i.PatientID WHERE p.Email = N'lisa@email.com'),  315.00, N'Insurance', CONVERT(date, GETDATE()), N'Insurance covered');
END
GO