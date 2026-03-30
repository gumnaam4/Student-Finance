// server/routes/goalRoutes.js
// Handles: Create goal, Contribute to goal, List goals, Delete goal

const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ── POST /api/goals ────────────────────────────────────────
router.post('/', async (req, res) => {
  const { student_id, goal_name, target_amount, deadline } = req.body;

  if (!student_id || !goal_name || !target_amount)
    return res.status(400).json({ error: 'student_id, goal_name, and target_amount are required.' });

  const target = parseFloat(target_amount);
  if (target <= 0)
    return res.status(400).json({ error: 'Target amount must be positive.' });

  try {
    const [result] = await db.query(
      `INSERT INTO Goals (student_id, goal_name, target_amount, deadline)
       VALUES (?, ?, ?, ?)`,
      [student_id, goal_name, target, deadline || null]
    );
    res.status(201).json({
      message: 'Goal created!',
      goal_id: result.insertId,
      goal_name,
      target_amount: target,
    });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Server error creating goal.' });
  }
});

// ── GET /api/goals/student/:id ─────────────────────────────
router.get('/student/:id', async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID.' });

  try {
    const [goals] = await db.query(
      `SELECT goal_id, goal_name, target_amount, saved_amount, deadline, status,
              ROUND((saved_amount / target_amount) * 100, 2) AS progress_pct,
              created_at
       FROM Goals
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );
    res.json({ goals });
  } catch (err) {
    console.error('Fetch goals error:', err);
    res.status(500).json({ error: 'Server error fetching goals.' });
  }
});

// ── POST /api/goals/:goal_id/contribute ───────────────────
router.post('/:goal_id/contribute', async (req, res) => {
  const goalId    = parseInt(req.params.goal_id);
  const { student_id, amount } = req.body;

  if (isNaN(goalId) || !student_id || !amount)
    return res.status(400).json({ error: 'goal_id, student_id, and amount are required.' });

  const amt = parseFloat(amount);
  if (amt <= 0)
    return res.status(400).json({ error: 'Contribution amount must be positive.' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify goal belongs to student and is active
    const [goalRows] = await conn.query(
      'SELECT goal_id, target_amount, saved_amount, status FROM Goals WHERE goal_id = ? AND student_id = ?',
      [goalId, student_id]
    );
    if (goalRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Goal not found.' });
    }
    const goal = goalRows[0];
    if (goal.status !== 'active') {
      await conn.rollback();
      return res.status(400).json({ error: 'Goal is not active.' });
    }

    // Check account balance
    const [accRows] = await conn.query(
      'SELECT account_id, balance FROM Accounts WHERE student_id = ?',
      [student_id]
    );
    if (accRows.length === 0 || parseFloat(accRows[0].balance) < amt) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient balance for contribution.' });
    }
    const account = accRows[0];

    // Record contribution
    await conn.query(
      'INSERT INTO GoalContributions (goal_id, amount) VALUES (?, ?)',
      [goalId, amt]
    );

    // Update goal saved_amount
    const newSaved  = parseFloat(goal.saved_amount) + amt;
    const newStatus = newSaved >= parseFloat(goal.target_amount) ? 'completed' : 'active';
    await conn.query(
      'UPDATE Goals SET saved_amount = ?, status = ? WHERE goal_id = ?',
      [newSaved, newStatus, goalId]
    );

    // Deduct from account balance
    await conn.query(
      'UPDATE Accounts SET balance = balance - ? WHERE account_id = ?',
      [amt, account.account_id]
    );

    // Record transaction
    await conn.query(
      `INSERT INTO Transactions (account_id, amount, transaction_type, description)
       VALUES (?, ?, 'goal_contribution', ?)`,
      [account.account_id, amt, `Contribution to goal: ${goal.goal_id}`]
    );

    await conn.commit();

    res.json({
      message:    newStatus === 'completed' ? '🎉 Goal completed!' : 'Contribution saved!',
      goal_id:    goalId,
      contributed: amt,
      saved_amount: newSaved,
      status:     newStatus,
    });
  } catch (err) {
    await conn.rollback();
    console.error('Contribute goal error:', err);
    res.status(500).json({ error: 'Server error contributing to goal.' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/goals/:goal_id ─────────────────────────────
router.delete('/:goal_id', async (req, res) => {
  const goalId    = parseInt(req.params.goal_id);
  const studentId = parseInt(req.query.student_id);

  try {
    const [result] = await db.query(
      'UPDATE Goals SET status = ? WHERE goal_id = ? AND student_id = ?',
      ['cancelled', goalId, studentId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Goal not found.' });

    res.json({ message: 'Goal cancelled.' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Server error cancelling goal.' });
  }
});

module.exports = router;