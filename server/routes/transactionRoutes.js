// server/routes/transactionRoutes.js
// Handles: Withdraw (respects daily limit), View all transactions

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── POST /api/transactions/withdraw ───────────────────────
router.post('/withdraw', async (req, res) => {
  const { student_id, amount, description } = req.body;

  if (!student_id || !amount)
    return res.status(400).json({ error: 'student_id and amount are required.' });

  const amt = parseFloat(amount);
  if (amt <= 0)
    return res.status(400).json({ error: 'Withdrawal amount must be positive.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get account
    const [accRows] = await conn.query(
      'SELECT account_id, balance FROM Accounts WHERE student_id = ?',
      [student_id]
    );
    if (accRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Account not found.' });
    }
    const account = accRows[0];

    // Check overall balance
    if (parseFloat(account.balance) < amt) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient account balance.' });
    }

    // Get today's allowance for active deposit
    const [allowRows] = await conn.query(
      `SELECT da.allowance_id, da.remaining_amount
       FROM DailyAllowances da
       JOIN Deposits d ON da.deposit_id = d.deposit_id
       WHERE d.student_id = ? AND d.is_active = TRUE AND da.allowance_date = CURDATE()
       FOR UPDATE`,
      [student_id]
    );

    if (allowRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({
        error: 'No active daily allowance found. Please make a deposit first.',
      });
    }

    const allowance = allowRows[0];
    const remaining = parseFloat(allowance.remaining_amount);

    if (amt > remaining) {
      await conn.rollback();
      return res.status(400).json({
        error: `Exceeds today's remaining allowance of ₹${remaining.toFixed(2)}.`,
        remaining_allowance: remaining,
      });
    }

    // Deduct from DailyAllowance
    await conn.query(
      `UPDATE DailyAllowances
       SET withdrawn_amount = withdrawn_amount + ?,
           remaining_amount = remaining_amount - ?
       WHERE allowance_id = ?`,
      [amt, amt, allowance.allowance_id]
    );

    // Deduct from account balance
    await conn.query(
      'UPDATE Accounts SET balance = balance - ? WHERE account_id = ?',
      [amt, account.account_id]
    );

    // Record transaction
    const desc = description || 'Daily spending withdrawal';
    await conn.query(
      `INSERT INTO Transactions (account_id, amount, transaction_type, description)
       VALUES (?, ?, 'withdraw', ?)`,
      [account.account_id, amt, desc]
    );

    await conn.commit();

    // Return updated balance and allowance
    const [updatedAcc]   = await db.query('SELECT balance FROM Accounts WHERE account_id = ?', [account.account_id]);
    const [updatedAllow] = await db.query('SELECT remaining_amount FROM DailyAllowances WHERE allowance_id = ?', [allowance.allowance_id]);

    res.json({
      message:             'Withdrawal successful!',
      withdrawn:           amt,
      new_balance:         updatedAcc[0].balance,
      remaining_allowance: updatedAllow[0].remaining_amount,
    });
  } catch (err) {
    await conn.rollback();
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Server error processing withdrawal.' });
  } finally {
    conn.release();
  }
});

// ── GET /api/transactions/student/:id ─────────────────────
router.get('/student/:id', async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID.' });

  try {
    const [rows] = await db.query(
      `SELECT t.transaction_id, t.amount, t.transaction_type,
              t.transaction_date, t.description
       FROM Transactions t
       JOIN Accounts a ON t.account_id = a.account_id
       WHERE a.student_id = ?
       ORDER BY t.transaction_date DESC`,
      [studentId]
    );
    res.json({ transactions: rows });
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Server error fetching transactions.' });
  }
});

module.exports = router;