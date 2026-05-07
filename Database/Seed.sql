
USE DentalClinicSystem1;
GO

-- =============================================
-- SEED DATA
-- =============================================

-- 2. Doctors
INSERT INTO Doctors (Name, Specialty, Phone, Email, WorkingHours) VALUES
('Dr. Ahmed Hassan', 'Orthodontics', '+201001234567', 'ahmed.hassan@dental.com', 'Sun-Thu 09:00-17:00'),
('Dr. Sarah Khalil', 'Endodontics', '+201002345678', 'sarah.khalil@dental.com', 'Sun-Thu 10:00-18:00'),
('Dr. Omar Fathi', 'Periodontics', '+201004567890', 'omar.fathi@dental.com', 'Mon-Wed 09:00-15:00'),
('Dr. Layla Mahmoud', 'Pediatric Dentistry', '+201006789012', 'layla@dental.com', 'Sun-Tue 08:00-14:00'),
('Dr. Karim Said', 'Oral Surgery', '+201007890123', 'karim@dental.com', 'Thu-Sat 10:00-16:00');

-- 3. Patients
INSERT INTO Patients (FirstName, LastName, Gender, DateOfBirth, Phone, Email, Address, MedicalHistory) VALUES
('Mohamed', 'Ali', 'Male', '1985-03-15', '+201111111111', 'mohamed.ali@email.com', 'Cairo, Nasr City', 'No known allergies. Hypertension controlled with medication.'),
('Fatima', 'Hassan', 'Female', '1990-07-22', '+201122222222', 'fatima.h@email.com', 'Cairo, Maadi', 'Allergic to penicillin. Asthma.'),
('Omar', 'Ibrahim', 'Male', '1978-11-05', '+201133333333', 'omar.ibrahim@email.com', 'Giza, Dokki', 'Diabetes Type 2. No other conditions.'),
('Aisha', 'Mahmoud', 'Female', '2000-01-10', '+201144444444', 'aisha.m@email.com', 'Cairo, Heliopolis', 'No medical history.'),
('Youssef', 'Khalil', 'Male', '1995-09-18', '+201155555555', 'youssef.k@email.com', 'Alexandria', 'Bruxism (teeth grinding).'),
('Laila', 'Said', 'Female', '1988-04-30', '+201166666666', 'laila.said@email.com', 'Cairo, Zamalek', 'Pregnant - 2nd trimester. No allergies.'),
('Hassan', 'Omar', 'Male', '1965-12-25', '+201177777777', 'hassan.o@email.com', 'Cairo, New Cairo', 'Heart condition. Taking blood thinners.'),
('Nour', 'Fathi', 'Female', '2005-08-14', '+201188888888', 'nour.fathi@email.com', 'Giza', 'No medical history. First dental visit.'),
('Khaled', 'Abdelrahman', 'Male', '1982-06-20', '+201199999999', 'khaled.a@email.com', 'Cairo, Madinaty', 'Gum disease history.'),
('Samar', 'Tarek', 'Female', '1993-12-03', '+201100000000', 'samar.t@email.com', 'Cairo, Rehab', 'Orthodontic treatment completed 2015.');

-- 4. Treatments
INSERT INTO Treatments (Name, Description, Cost, Duration, Category) VALUES
('Teeth Cleaning', 'Professional dental cleaning and polishing', 300.00, '30 min', 'Preventive'),
('Dental Filling', 'Composite resin filling for cavities', 500.00, '45 min', 'Restorative'),
('Root Canal Treatment', 'Complete root canal therapy with crown', 2500.00, '90 min', 'Endodontics'),
('Teeth Whitening', 'Professional in-office bleaching', 1500.00, '60 min', 'Cosmetic'),
('Dental Crown', 'Porcelain crown placement', 2000.00, '60 min', 'Prosthodontics'),
('Dental Implant', 'Single tooth implant with abutment', 8000.00, '120 min', 'Oral Surgery'),
('Orthodontic Consultation', 'Initial braces/Invisalign assessment', 200.00, '30 min', 'Orthodontics'),
('Wisdom Tooth Extraction', 'Surgical removal of impacted wisdom tooth', 1500.00, '45 min', 'Oral Surgery'),
('Periodontal Treatment', 'Deep cleaning for gum disease', 1200.00, '60 min', 'Periodontics'),
('Dental X-Ray', 'Full mouth radiographic examination', 250.00, '15 min', 'Diagnostic'),
('Pediatric Checkup', 'Child dental examination and fluoride', 200.00, '20 min', 'Pediatric'),
('Veneers', 'Porcelain veneer per tooth', 3000.00, '45 min', 'Cosmetic');

-- 5. Appointments
INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status, Reason) VALUES
(1, 1, '2026-05-10', '09:00', 'Scheduled', 'Regular checkup and cleaning'),
(2, 2, '2026-05-10', '10:30', 'Scheduled', 'Root canal follow-up'),
(3, 3, '2026-05-11', '11:00', 'Scheduled', 'Gum bleeding consultation'),
(4, 4, '2026-05-12', '09:30', 'Scheduled', 'First pediatric visit'),
(5, 1, '2026-05-12', '14:00', 'Scheduled', 'Braces consultation'),
(6, 2, '2026-05-13', '10:00', 'Scheduled', 'Pregnancy dental check'),
(7, 5, '2026-05-13', '11:30', 'Scheduled', 'Wisdom tooth pain'),
(8, 4, '2026-05-14', '08:30', 'Scheduled', 'Routine checkup'),
(9, 3, '2026-05-14', '13:00', 'Scheduled', 'Periodontal maintenance'),
(10, 1, '2026-05-15', '15:00', 'Scheduled', 'Retainer check'),
(1, 2, '2026-05-08', '09:00', 'Completed', 'Toothache - filling done'),
(3, 1, '2026-05-05', '11:00', 'Completed', 'Cleaning completed'),
(5, 5, '2026-05-06', '10:00', 'Cancelled', 'Patient rescheduled'),
(2, 4, '2026-05-07', '14:30', 'No-Show', 'Did not attend');

-- 6. Visits
INSERT INTO Visits (PatientID, DoctorID, VisitDate, Diagnosis, Notes, Status) VALUES
(1, 2, '2026-05-08', 'Dental caries on tooth #14', 'Composite filling placed. Patient tolerated well.', 'Completed'),
(3, 1, '2026-05-05', 'General plaque buildup', 'Scaling and polishing done. Oral hygiene instructions given.', 'Completed'),
(7, 5, '2026-05-06', 'Pericoronitis - wisdom tooth', 'Prescribed antibiotics. Schedule extraction next week.', 'In Progress'),
(2, 2, '2026-04-28', 'Pulpitis tooth #21', 'Root canal initiated. Next appointment 2026-05-10.', 'In Progress'),
(5, 1, '2026-04-20', 'Malocclusion Class II', 'Recommended orthodontic treatment. Patient considering options.', 'Pending'),
(8, 4, '2026-05-01', 'Healthy dentition', 'First visit. No issues found. Schedule 6-month recall.', 'Completed'),
(9, 3, '2026-04-15', 'Chronic periodontitis', 'Deep scaling done. Review in 3 months.', 'Completed'),
(4, 4, '2026-05-12', 'Early childhood caries', 'First visit scheduled for today.', 'Scheduled'),
(6, 2, '2026-05-13', 'Pregnancy gingivitis', 'Routine check scheduled. Avoid X-rays.', 'Scheduled'),
(10, 1, '2026-04-10', 'Retainer fitting check', 'Retainer fits well. Continue nightly wear.', 'Completed');

-- 7. Invoices
INSERT INTO Invoices (PatientID, TotalAmount, Discount, FinalAmount, Status, CreatedAt) VALUES
(1, 800.00, 0.00, 800.00, 'Paid', '2026-05-08 10:30:00'),
(3, 300.00, 0.00, 300.00, 'Paid', '2026-05-05 11:45:00'),
(7, 1500.00, 0.00, 1500.00, 'Unpaid', '2026-05-06 12:00:00'),
(2, 2500.00, 250.00, 2250.00, 'Partially Paid', '2026-04-28 15:00:00'),
(5, 200.00, 0.00, 200.00, 'Paid', '2026-04-20 10:15:00'),
(8, 200.00, 0.00, 200.00, 'Paid', '2026-05-01 09:45:00'),
(9, 1200.00, 100.00, 1100.00, 'Paid', '2026-04-15 14:00:00'),
(1, 300.00, 0.00, 300.00, 'Unpaid', '2026-05-10 09:30:00'),
(4, 200.00, 0.00, 200.00, 'Unpaid', '2026-05-12 10:00:00'),
(6, 200.00, 0.00, 200.00, 'Unpaid', '2026-05-13 10:30:00');

-- 8. Payments
INSERT INTO Payments (InvoiceID, Amount, PaymentMethod, PaymentDate, Notes) VALUES
(1, 800.00, 'Cash', '2026-05-08', 'Full payment for filling'),
(2, 300.00, 'Credit Card', '2026-05-05', 'Cleaning service'),
(4, 1000.00, 'Credit Card', '2026-04-28', 'Root canal partial payment'),
(5, 200.00, 'Cash', '2026-04-20', 'Consultation fee'),
(6, 200.00, 'Debit Card', '2026-05-01', 'Pediatric checkup'),
(7, 1100.00, 'Cash', '2026-04-15', 'Periodontal treatment with discount'),
(4, 1250.00, 'Cash', '2026-05-07', 'Root canal final payment');

PRINT 'Seed data inserted successfully.';
GO

