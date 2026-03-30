// server/routes/depositRoutes.js
// Handles: Create deposit, view deposits, get today's allowance

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── POST /api/deposits ─────────────────────────────────────
// Creates a new deposit and generates DailyAllowance rows
router.post('/', async (req, res) => {
  const { student_id, amount, duration_days } = req.body;

  if (!student_id || !amount || !duration_days)
    return res.status(400).json({ error: 'student_id, amount, and duration_days are required.' });

  const amt  = parseFloat(amount);
  const days = parseInt(duration_days);

  if (amt <= 0 || days <= 0)
    return res.status(400).json({ error: 'Amount and duration must be positive.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify student + account
    const [accRows] = await conn.query(
      'SELECT account_id, balance FROM Accounts WHERE student_id = ?',
      [student_id]
    );
    if (accRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Account not found.' });
    }
    const account = accRows[0];

    // Deactivate any previous active deposits
    await conn.query(
      'UPDATE Deposits SET is_active = FALSE WHERE student_id = ? AND is_active = TRUE',
      [student_id]
    );

    // Calculate daily limit
    const daily_limit = parseFloat((amt / days).toFixed(2));
    const today       = new Date();
    const endDate     = new Date(today);
    endDate.setDate(today.getDate() + days - 1);

    const fmt = d => d.toISOString().split('T')[0];   // YYYY-MM-DD

    // Insert Deposit
    const [depResult] = await conn.query(
      `INSERT INTO Deposits (student_id, amount, duration_days, daily_limit, deposit_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, amt, days, daily_limit, fmt(today), fmt(endDate)]
    );
    const deposit_id = depResult.insertId;

    // Generate DailyAllowance row for each day
    const allowanceValues = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      allowanceValues.push([deposit_id, fmt(d), daily_limit, 0.00, daily_limit]);
    }
    await conn.query(
      `INSERT INTO DailyAllowances (deposit_id, allowance_date, allowed_amount, withdrawn_amount, remaining_amount)
       VALUES ?`,
      [allowanceValues]
    );

    // Credit account balance
    await conn.query(
      'UPDATE Accounts SET balance = balance + ? WHERE account_id = ?',
      [amt, account.account_id]
    );

    // Record transaction
    await conn.query(
      `INSERT INTO Transactions (account_id, amount, transaction_type, description)
       VALUES (?, ?, 'deposit', ?)`,
      [account.account_id, amt, `Deposit for ${days} days @ ₹${daily_limit}/day`]
    );

    await conn.commit();

    res.status(201).json({
      message:     'Deposit successful!',
      deposit_id,
      amount:      amt,
      daily_limit,
      duration_days: days,
      deposit_date:  fmt(today),
      end_date:      fmt(endDate),
    });
  } catch (err) {
    await conn.rollback();
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Server error creating deposit.' });
  } finally {
    conn.release();
  }
});

// ── GET /api/deposits/student/:id ─────────────────────────
router.get('/student/:id', async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID.' });

  try {
    const [deposits] = await db.query(
      `SELECT deposit_id, amount, duration_days, daily_limit,
              deposit_date, end_date, is_active
       FROM Deposits
       WHERE student_id = ?
       ORDER BY deposit_date DESC`,
      [studentId]
    );
    res.json({ deposits });
  } catch (err) {
    console.error('Fetch deposits error:', err);
    res.status(500).json({ error: 'Server error fetching deposits.' });
  }
});

// ── GET /api/deposits/allowance/:student_id ───────────────
// Returns today's allowance for the active deposit
router.get('/allowance/:student_id', async (req, res) => {
  const studentId = parseInt(req.params.student_id);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID.' });

  try {
    const [rows] = await db.query(
      `SELECT da.allowance_id, da.deposit_id, da.allowance_date,
              da.allowed_amount, da.withdrawn_amount, da.remaining_amount,
              d.daily_limit, d.end_date
       FROM DailyAllowances da
       JOIN Deposits d ON da.deposit_id = d.deposit_id
       WHERE d.student_id = ? AND d.is_active = TRUE AND da.allowance_date = CURDATE()`,
      [studentId]
    );
    if (rows.length === 0)
      return res.json({ allowance: null, message: 'No active deposit for today.' });

    res.json({ allowance: rows[0] });
  } catch (err) {
    console.error('Allowance error:', err);
    res.status(500).json({ error: 'Server error fetching allowance.' });
  }
});

module.exports = router;