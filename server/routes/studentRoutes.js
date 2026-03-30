// server/routes/studentRoutes.js
// Handles: Register, Login, Dashboard summary

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── POST /api/students/register ────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    // Check duplicate email
    const [existing] = await db.query(
      'SELECT student_id FROM Students WHERE email = ?', [email]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered.' });

    // Insert student (plain-text password — acceptable for academic demo)
    const [result] = await db.query(
      'INSERT INTO Students (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    const studentId = result.insertId;

    // Auto-create account with 0 balance
    await db.query(
      'INSERT INTO Accounts (student_id, balance) VALUES (?, 0.00)',
      [studentId]
    );

    res.status(201).json({
      message:    'Registration successful!',
      student_id: studentId,
      name,
      email,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── POST /api/students/login ───────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required.' });

  try {
    const [rows] = await db.query(
      'SELECT student_id, name, email, password FROM Students WHERE email = ?',
      [email]
    );

    if (rows.length === 0 || rows[0].password !== password)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const student = rows[0];
    res.json({
      message:    'Login successful!',
      student_id: student.student_id,
      name:       student.name,
      email:      student.email,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── GET /api/students/:id/dashboard ───────────────────────
router.get('/:id/dashboard', async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID.' });

  try {
    // Student info + balance
    const [studentRows] = await db.query(
      `SELECT s.student_id, s.name, s.email, a.account_id, a.balance
       FROM Students s
       JOIN Accounts a ON s.student_id = a.student_id
       WHERE s.student_id = ?`,
      [studentId]
    );
    if (studentRows.length === 0)
      return res.status(404).json({ error: 'Student not found.' });

    const student = studentRows[0];

    // Active deposit + today's allowance
    const [allowanceRows] = await db.query(
      `SELECT d.deposit_id, d.amount, d.duration_days, d.daily_limit,
              d.deposit_date, d.end_date,
              da.allowance_date, da.allowed_amount,
              da.withdrawn_amount, da.remaining_amount
       FROM Deposits d
       LEFT JOIN DailyAllowances da
             ON d.deposit_id = da.deposit_id AND da.allowance_date = CURDATE()
       WHERE d.student_id = ? AND d.is_active = TRUE
       ORDER BY d.deposit_date DESC
       LIMIT 1`,
      [studentId]
    );

    // Active goals
    const [goals] = await db.query(
      `SELECT goal_id, goal_name, target_amount, saved_amount, deadline, status,
              ROUND((saved_amount / target_amount) * 100, 2) AS progress_pct
       FROM Goals
       WHERE student_id = ? AND status = 'active'
       ORDER BY created_at DESC`,
      [studentId]
    );

    // Recent 5 transactions
    const [transactions] = await db.query(
      `SELECT t.transaction_id, t.amount, t.transaction_type,
              t.transaction_date, t.description
       FROM Transactions t
       WHERE t.account_id = ?
       ORDER BY t.transaction_date DESC
       LIMIT 5`,
      [student.account_id]
    );

    res.json({
      student: {
        student_id: student.student_id,
        name:       student.name,
        email:      student.email,
      },
      account: {
        account_id: student.account_id,
        balance:    student.balance,
      },
      active_deposit:  allowanceRows[0] || null,
      goals,
      recent_transactions: transactions,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error fetching dashboard.' });
  }
});

module.exports = router;