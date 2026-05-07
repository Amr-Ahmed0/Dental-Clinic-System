import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import sql from 'mssql';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    res.json({ status: 'ok', connected: true });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ─── Auth (Mock - لحد ما تعمل جدول Users) ────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // لو عندك جدول Users شغل الـ query ده بدل الـ mock
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    // هنا لازم تشيك الـ password بـ bcrypt
    res.json({ 
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        phone: user.Phone,
        createdAt: user.CreatedAt
      }
    });
  } catch (err) {
    // Mock fallback لو مفيش جدول Users
    res.json({
      user: {
        id: '1',
        name: email.split('@')[0],
        email: email,
        role: 'receptionist',
        phone: '',
        createdAt: new Date().toISOString()
      }
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password) // لازم hash
      .input('role', sql.NVarChar, role)
      .input('phone', sql.NVarChar, phone)
      .query(`
        INSERT INTO Users (Name, Email, Password, Role, Phone, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@name, @email, @password, @role, @phone, GETDATE())
      `);
    
    const user = result.recordset[0];
    res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        phone: user.Phone,
        createdAt: user.CreatedAt
      }
    });
  } catch (err) {
    // Mock fallback
    res.json({
      user: {
        id: Date.now().toString(),
        name, email, role, phone,
        createdAt: new Date().toISOString()
      }
    });
  }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const [patients, doctors, appointments, treatments, visits, invoices, payments] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as count FROM Patients'),
      pool.request().query('SELECT COUNT(*) as count FROM Doctors'),
      pool.request().query('SELECT COUNT(*) as count FROM Appointments'),
      pool.request().query('SELECT COUNT(*) as count FROM Treatments'),
      pool.request().query('SELECT COUNT(*) as count FROM Visits'),
      pool.request().query('SELECT COUNT(*) as count FROM Invoices'),
      pool.request().query('SELECT SUM(Amount) as total FROM Payments'),
    ]);

    res.json({
      totalPatients: patients.recordset[0].count,
      totalDoctors: doctors.recordset[0].count,
      totalAppointments: appointments.recordset[0].count,
      totalTreatments: treatments.recordset[0].count,
      totalVisits: visits.recordset[0].count,
      totalInvoices: invoices.recordset[0].count,
      totalRevenue: payments.recordset[0].total || 0,
    });
  } catch (err) {
    res.json({
      totalPatients: 0, totalDoctors: 0, totalAppointments: 0,
      totalTreatments: 0, totalVisits: 0, totalInvoices: 0, totalRevenue: 0
    });
  }
});

app.get('/api/dashboard/today-appointments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.request()
      .input('today', sql.Date, today)
      .query(`
        SELECT a.*, p.FirstName + ' ' + p.LastName as PatientName, d.Name as DoctorName
        FROM Appointments a
        JOIN Patients p ON a.PatientID = p.PatientID
        JOIN Doctors d ON a.DoctorID = d.DoctorID
        WHERE CAST(a.AppointmentDate as DATE) = @today
      `);
    res.json({ data: result.recordset });
  } catch (err) {
    res.json({ data: [] });
  }
});

app.get('/api/dashboard/appointments-with-names', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT a.*, p.FirstName + ' ' + p.LastName as PatientName, d.Name as DoctorName
      FROM Appointments a
      JOIN Patients p ON a.PatientID = p.PatientID
      JOIN Doctors d ON a.DoctorID = d.DoctorID
    `);
    res.json({ data: result.recordset });
  } catch (err) {
    res.json({ data: [] });
  }
});

// ─── Patients ─────────────────────────────────────────────────────────────────
app.get('/api/patients', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Patients');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { firstName, lastName, gender, dateOfBirth, phone, email, address, medicalHistory } = req.body;
    
    const result = await pool.request()
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('gender', sql.NVarChar, gender)
      .input('dob', sql.Date, dateOfBirth)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NVarChar, address)
      .input('medicalHistory', sql.NVarChar, medicalHistory)
      .query(`
        INSERT INTO Patients (FirstName, LastName, Gender, DateOfBirth, Phone, Email, Address, MedicalHistory)
        OUTPUT INSERTED.*
        VALUES (@firstName, @lastName, @gender, @dob, @phone, @email, @address, @medicalHistory)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { firstName, lastName, gender, dateOfBirth, phone, email, address, medicalHistory } = req.body;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('gender', sql.NVarChar, gender)
      .input('dob', sql.Date, dateOfBirth)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('address', sql.NVarChar, address)
      .input('medicalHistory', sql.NVarChar, medicalHistory)
      .query(`
        UPDATE Patients SET
          FirstName = @firstName, LastName = @lastName, Gender = @gender,
          DateOfBirth = @dob, Phone = @phone, Email = @email,
          Address = @address, MedicalHistory = @medicalHistory
        WHERE PatientID = @id
      `);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Patients WHERE PatientID = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Doctors ──────────────────────────────────────────────────────────────────
app.get('/api/doctors', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Doctors');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { name, specialty, phone, email, workingHours } = req.body;
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('specialty', sql.NVarChar, specialty)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('workingHours', sql.NVarChar, workingHours)
      .query(`
        INSERT INTO Doctors (Name, Specialty, Phone, Email, WorkingHours)
        OUTPUT INSERTED.*
        VALUES (@name, @specialty, @phone, @email, @workingHours)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { name, specialty, phone, email, workingHours } = req.body;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('specialty', sql.NVarChar, specialty)
      .input('phone', sql.NVarChar, phone)
      .input('email', sql.NVarChar, email)
      .input('workingHours', sql.NVarChar, workingHours)
      .query(`
        UPDATE Doctors SET
          Name = @name, Specialty = @specialty, Phone = @phone,
          Email = @email, WorkingHours = @workingHours
        WHERE DoctorID = @id
      `);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Doctors WHERE DoctorID = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Appointments ─────────────────────────────────────────────────────────────
app.get('/api/appointments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Appointments');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { patientId, doctorId, appointmentDate, appointmentTime, status, reason } = req.body;
    
    const result = await pool.request()
      .input('patientId', sql.Int, patientId)
      .input('doctorId', sql.Int, doctorId)
      .input('date', sql.Date, appointmentDate)
      .input('time', sql.NVarChar, appointmentTime)
      .input('status', sql.NVarChar, status)
      .input('reason', sql.NVarChar, reason)
      .query(`
        INSERT INTO Appointments (PatientID, DoctorID, AppointmentDate, AppointmentTime, Status, Reason)
        OUTPUT INSERTED.*
        VALUES (@patientId, @doctorId, @date, @time, @status, @reason)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const fields = req.body;
    
    let setClause = Object.keys(fields).map(key => `${key} = @${key}`).join(', ');
    let request = pool.request().input('id', sql.Int, req.params.id);
    
    Object.entries(fields).forEach(([key, value]) => {
      request = request.input(key, sql.NVarChar, value);
    });
    
    await request.query(`UPDATE Appointments SET ${setClause} WHERE AppointmentID = @id`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Appointments WHERE AppointmentID = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Treatments ───────────────────────────────────────────────────────────────
app.get('/api/treatments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Treatments');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/treatments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { name, description, cost, duration, category } = req.body;
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('cost', sql.Decimal(10,2), cost)
      .input('duration', sql.NVarChar, duration)
      .input('category', sql.NVarChar, category)
      .query(`
        INSERT INTO Treatments (Name, Description, Cost, Duration, Category)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @cost, @duration, @category)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/treatments/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { name, description, cost, duration, category } = req.body;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('cost', sql.Decimal(10,2), cost)
      .input('duration', sql.NVarChar, duration)
      .input('category', sql.NVarChar, category)
      .query(`
        UPDATE Treatments SET
          Name = @name, Description = @description, Cost = @cost,
          Duration = @duration, Category = @category
        WHERE TreatmentID = @id
      `);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/treatments/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Treatments WHERE TreatmentID = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Visits ───────────────────────────────────────────────────────────────────
app.get('/api/visits', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Visits');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { patientId, doctorId, visitDate, diagnosis, notes, status } = req.body;
    
    const result = await pool.request()
      .input('patientId', sql.Int, patientId)
      .input('doctorId', sql.Int, doctorId)
      .input('date', sql.Date, visitDate)
      .input('diagnosis', sql.NVarChar, diagnosis)
      .input('notes', sql.NVarChar, notes)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO Visits (PatientID, DoctorID, VisitDate, Diagnosis, Notes, Status)
        OUTPUT INSERTED.*
        VALUES (@patientId, @doctorId, @date, @diagnosis, @notes, @status)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/visits/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Visits WHERE VisitID = @id');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invoices ─────────────────────────────────────────────────────────────────
app.get('/api/invoices', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Invoices');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { status } = req.body;
    
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE Invoices SET Status = @status WHERE InvoiceID = @id');
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payments ─────────────────────────────────────────────────────────────────
app.get('/api/payments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Payments');
    res.json({ data: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { invoiceId, amount, paymentMethod, paymentDate, notes } = req.body;
    
    const result = await pool.request()
      .input('invoiceId', sql.Int, invoiceId)
      .input('amount', sql.Decimal(10,2), amount)
      .input('method', sql.NVarChar, paymentMethod)
      .input('date', sql.Date, paymentDate)
      .input('notes', sql.NVarChar, notes)
      .query(`
        INSERT INTO Payments (InvoiceID, Amount, PaymentMethod, PaymentDate, Notes)
        OUTPUT INSERTED.*
        VALUES (@invoiceId, @amount, @method, @date, @notes)
      `);
    
    res.json({ data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;