-- =============================================
-- USEFUL QUERIES
-- =============================================

-- 1. PATIENT MANAGEMENT QUERIES
-- =============================================

-- Get all patients with their last visit date
SELECT 
    p.PatientID,
    p.FirstName + ' ' + p.LastName AS FullName,
    p.Phone,
    p.Email,
    MAX(v.VisitDate) AS LastVisitDate,
    COUNT(v.VisitID) AS TotalVisits
FROM Patients p
LEFT JOIN Visits v ON p.PatientID = v.PatientID
GROUP BY p.PatientID, p.FirstName, p.LastName, p.Phone, p.Email
ORDER BY LastVisitDate DESC;

-- Find patients with overdue appointments (no visit in last 6 months)
SELECT 
    p.PatientID,
    p.FirstName + ' ' + p.LastName AS FullName,
    p.Phone,
    MAX(v.VisitDate) AS LastVisitDate,
    DATEDIFF(DAY, MAX(v.VisitDate), GETDATE()) AS DaysSinceLastVisit
FROM Patients p
LEFT JOIN Visits v ON p.PatientID = v.PatientID
GROUP BY p.PatientID, p.FirstName, p.LastName, p.Phone
HAVING MAX(v.VisitDate) IS NULL OR MAX(v.VisitDate) < DATEADD(MONTH, -6, GETDATE())
ORDER BY DaysSinceLastVisit DESC;

-- Search patients by name or phone
DECLARE @SearchTerm NVARCHAR(100) = 'Mohamed'; -- Change as needed
SELECT 
    PatientID,
    FirstName + ' ' + LastName AS FullName,
    Phone,
    Email,
    Address
FROM Patients
WHERE FirstName LIKE '%' + @SearchTerm + '%' 
   OR LastName LIKE '%' + @SearchTerm + '%'
   OR Phone LIKE '%' + @SearchTerm + '%'
   OR Email LIKE '%' + @SearchTerm + '%';

-- 2. APPOINTMENT QUERIES
-- =============================================

-- Today's appointments with patient and doctor details
SELECT 
    a.AppointmentID,
    p.FirstName + ' ' + p.LastName AS PatientName,
    d.Name AS DoctorName,
    a.AppointmentDate,
    a.AppointmentTime,
    a.Status,
    a.Reason
FROM Appointments a
JOIN Patients p ON a.PatientID = p.PatientID
JOIN Doctors d ON a.DoctorID = d.DoctorID
WHERE a.AppointmentDate = CAST(GETDATE() AS DATE)
ORDER BY a.AppointmentTime;

-- Weekly appointment schedule
DECLARE @WeekStart DATE = DATEADD(DAY, -DATEPART(WEEKDAY, GETDATE()) + 1, CAST(GETDATE() AS DATE));
SELECT 
    a.AppointmentDate,
    DATENAME(WEEKDAY, a.AppointmentDate) AS DayName,
    COUNT(*) AS TotalAppointments,
    SUM(CASE WHEN a.Status = 'Scheduled' THEN 1 ELSE 0 END) AS Scheduled,
    SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS Completed,
    SUM(CASE WHEN a.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled
FROM Appointments a
WHERE a.AppointmentDate BETWEEN @WeekStart AND DATEADD(DAY, 6, @WeekStart)
GROUP BY a.AppointmentDate
ORDER BY a.AppointmentDate;

-- Doctor's daily schedule
DECLARE @DoctorID INT = 1; -- Change doctor ID
DECLARE @ScheduleDate DATE = '2026-05-10'; -- Change date
SELECT 
    a.AppointmentTime,
    p.FirstName + ' ' + p.LastName AS PatientName,
    a.Status,
    a.Reason
FROM Appointments a
JOIN Patients p ON a.PatientID = p.PatientID
WHERE a.DoctorID = @DoctorID 
  AND a.AppointmentDate = @ScheduleDate
ORDER BY a.AppointmentTime;

-- Appointment statistics by status
SELECT 
    Status,
    COUNT(*) AS Count,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS Percentage
FROM Appointments
GROUP BY Status;

-- 3. DOCTOR PERFORMANCE QUERIES
-- =============================================

-- Doctor workload summary
SELECT 
    d.DoctorID,
    d.Name,
    d.Specialty,
    COUNT(DISTINCT a.AppointmentID) AS TotalAppointments,
    COUNT(DISTINCT v.VisitID) AS TotalVisits,
    COUNT(DISTINCT p.PatientID) AS UniquePatients
FROM Doctors d
LEFT JOIN Appointments a ON d.DoctorID = a.DoctorID
LEFT JOIN Visits v ON d.DoctorID = v.DoctorID
LEFT JOIN Patients p ON v.PatientID = p.PatientID
GROUP BY d.DoctorID, d.Name, d.Specialty
ORDER BY TotalVisits DESC;

-- Doctor revenue generated
SELECT 
    d.DoctorID,
    d.Name,
    d.Specialty,
    COUNT(DISTINCT v.VisitID) AS VisitsCount,
    ISNULL(SUM(i.FinalAmount), 0) AS TotalRevenue
FROM Doctors d
LEFT JOIN Visits v ON d.DoctorID = v.DoctorID
LEFT JOIN Invoices i ON v.PatientID = i.PatientID 
    AND CAST(v.VisitDate AS DATE) = CAST(i.CreatedAt AS DATE)
GROUP BY d.DoctorID, d.Name, d.Specialty
ORDER BY TotalRevenue DESC;

-- 4. FINANCIAL QUERIES
-- =============================================

-- Revenue summary by month
SELECT 
    YEAR(CreatedAt) AS Year,
    MONTH(CreatedAt) AS Month,
    DATENAME(MONTH, CreatedAt) AS MonthName,
    COUNT(*) AS InvoiceCount,
    SUM(TotalAmount) AS GrossRevenue,
    SUM(Discount) AS TotalDiscounts,
    SUM(FinalAmount) AS NetRevenue,
    SUM(CASE WHEN Status = 'Paid' THEN FinalAmount ELSE 0 END) AS CollectedRevenue,
    SUM(CASE WHEN Status = 'Unpaid' THEN FinalAmount ELSE 0 END) AS OutstandingRevenue
FROM Invoices
GROUP BY YEAR(CreatedAt), MONTH(CreatedAt), DATENAME(MONTH, CreatedAt)
ORDER BY Year DESC, Month DESC;

-- Outstanding payments (unpaid or partially paid invoices)
SELECT 
    i.InvoiceID,
    p.FirstName + ' ' + p.LastName AS PatientName,
    p.Phone,
    i.TotalAmount,
    i.Discount,
    i.FinalAmount,
    ISNULL(SUM(py.Amount), 0) AS PaidAmount,
    i.FinalAmount - ISNULL(SUM(py.Amount), 0) AS BalanceDue,
    i.Status,
    i.CreatedAt,
    DATEDIFF(DAY, i.CreatedAt, GETDATE()) AS DaysOutstanding
FROM Invoices i
JOIN Patients p ON i.PatientID = p.PatientID
LEFT JOIN Payments py ON i.InvoiceID = py.InvoiceID
WHERE i.Status IN ('Unpaid', 'Partially Paid')
GROUP BY i.InvoiceID, p.FirstName, p.LastName, p.Phone, 
         i.TotalAmount, i.Discount, i.FinalAmount, i.Status, i.CreatedAt
HAVING i.FinalAmount - ISNULL(SUM(py.Amount), 0) > 0
ORDER BY DaysOutstanding DESC;

-- Payment methods breakdown
SELECT 
    PaymentMethod,
    COUNT(*) AS TransactionCount,
    SUM(Amount) AS TotalAmount,
    CAST(AVG(Amount) AS DECIMAL(10,2)) AS AverageAmount
FROM Payments
GROUP BY PaymentMethod
ORDER BY TotalAmount DESC;

-- 5. TREATMENT ANALYTICS
-- =============================================

-- Most popular treatments
SELECT 
    t.TreatmentID,
    t.Name,
    t.Category,
    t.Cost,
    COUNT(DISTINCT v.VisitID) AS TimesPerformed,
    CAST(AVG(t.Cost) AS DECIMAL(10,2)) AS AvgCost
FROM Treatments t
LEFT JOIN Visits v ON v.Diagnosis LIKE '%' + t.Name + '%' -- Simplified linkage
GROUP BY t.TreatmentID, t.Name, t.Category, t.Cost
ORDER BY TimesPerformed DESC;

-- Revenue by treatment category
SELECT 
    t.Category,
    COUNT(DISTINCT t.TreatmentID) AS TreatmentTypes,
    AVG(t.Cost) AS AverageCost,
    SUM(t.Cost) AS PotentialRevenue
FROM Treatments t
GROUP BY t.Category
ORDER BY PotentialRevenue DESC;

-- 6. COMPREHENSIVE PATIENT HISTORY
-- =============================================

-- Complete patient dashboard (single patient view)
DECLARE @PatientID INT = 1; -- Change as needed
SELECT 
    p.PatientID,
    p.FirstName + ' ' + p.LastName AS FullName,
    p.Gender,
    p.DateOfBirth,
    DATEDIFF(YEAR, p.DateOfBirth, GETDATE()) AS Age,
    p.Phone,
    p.Email,
    p.Address,
    p.MedicalHistory,
    
    -- Visit Summary
    (SELECT COUNT(*) FROM Visits WHERE PatientID = p.PatientID) AS TotalVisits,
    
    -- Appointment Summary
    (SELECT COUNT(*) FROM Appointments WHERE PatientID = p.PatientID) AS TotalAppointments,
    
    -- Financial Summary
    (SELECT ISNULL(SUM(FinalAmount), 0) FROM Invoices WHERE PatientID = p.PatientID) AS TotalBilled,
    (SELECT ISNULL(SUM(FinalAmount), 0) FROM Invoices WHERE PatientID = p.PatientID AND Status = 'Paid') AS TotalPaid,
    (SELECT ISNULL(SUM(FinalAmount), 0) FROM Invoices WHERE PatientID = p.PatientID AND Status = 'Unpaid') AS TotalOutstanding

FROM Patients p
WHERE p.PatientID = @PatientID;

-- Patient visit history with doctor and invoice details
SELECT 
    v.VisitID,
    v.VisitDate,
    d.Name AS DoctorName,
    d.Specialty,
    v.Diagnosis,
    v.Notes,
    v.Status,
    i.InvoiceID,
    i.FinalAmount,
    i.Status AS PaymentStatus
FROM Visits v
JOIN Doctors d ON v.DoctorID = d.DoctorID
LEFT JOIN Invoices i ON v.PatientID = i.PatientID 
    AND CAST(v.VisitDate AS DATE) = CAST(i.CreatedAt AS DATE)
WHERE v.PatientID = @PatientID
ORDER BY v.VisitDate DESC;

-- 7. OPERATIONAL DASHBOARD QUERIES
-- =============================================

-- Daily clinic summary
SELECT 
    CAST(GETDATE() AS DATE) AS Today,
    (SELECT COUNT(*) FROM Appointments WHERE AppointmentDate = CAST(GETDATE() AS DATE)) AS AppointmentsToday,
    (SELECT COUNT(*) FROM Visits WHERE VisitDate = CAST(GETDATE() AS DATE)) AS VisitsToday,
    (SELECT ISNULL(SUM(FinalAmount), 0) FROM Invoices WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)) AS RevenueToday,
    (SELECT COUNT(*) FROM Patients WHERE CreatedAt IS NULL OR CreatedAt >= DATEADD(DAY, -30, GETDATE())) AS NewPatientsThisMonth;

-- Monthly KPIs
DECLARE @CurrentMonth INT = MONTH(GETDATE());
DECLARE @CurrentYear INT = YEAR(GETDATE());
SELECT 
    @CurrentYear AS Year,
    @CurrentMonth AS Month,
    (SELECT COUNT(*) FROM Visits WHERE MONTH(VisitDate) = @CurrentMonth AND YEAR(VisitDate) = @CurrentYear) AS TotalVisits,
    (SELECT COUNT(DISTINCT PatientID) FROM Visits WHERE MONTH(VisitDate) = @CurrentMonth AND YEAR(VisitDate) = @CurrentYear) AS UniquePatients,
    (SELECT COUNT(*) FROM Appointments WHERE MONTH(AppointmentDate) = @CurrentMonth AND YEAR(AppointmentDate) = @CurrentYear) AS TotalAppointments,
    (SELECT ISNULL(SUM(FinalAmount), 0) FROM Invoices WHERE MONTH(CreatedAt) = @CurrentMonth AND YEAR(CreatedAt) = @CurrentYear) AS TotalRevenue,
    (SELECT ISNULL(AVG(FinalAmount), 0) FROM Invoices WHERE MONTH(CreatedAt) = @CurrentMonth AND YEAR(CreatedAt) = @CurrentYear) AS AverageInvoiceValue;

-- Patient retention rate (patients with visits in last 12 months)
WITH ActivePatients AS (
    SELECT DISTINCT PatientID 
    FROM Visits 
    WHERE VisitDate >= DATEADD(MONTH, -12, GETDATE())
)
SELECT 
    (SELECT COUNT(*) FROM ActivePatients) AS ActivePatientsLast12Months,
    (SELECT COUNT(*) FROM Patients) AS TotalPatients,
    CAST((SELECT COUNT(*) FROM ActivePatients) * 100.0 / (SELECT COUNT(*) FROM Patients) AS DECIMAL(5,2)) AS RetentionRatePercent;

-- 8. AUDIT & ADMINISTRATION
-- =============================================

-- Recent user activity (if you add login tracking later)
SELECT 
    UserID,
    Name,
    Role,
    Email,
    CreatedAt
FROM Users
ORDER BY CreatedAt DESC;

-- Database size estimate (basic)
SELECT 
    t.TABLE_NAME,
    (SELECT SUM(rows) FROM sys.partitions p 
     WHERE p.object_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME) 
     AND p.index_id IN (0,1)) AS RowCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE' AND t.TABLE_SCHEMA = 'dbo'
ORDER BY RowCount DESC;

PRINT 'All queries are ready for execution.';
GO