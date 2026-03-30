// server/db.js
// MySQL connection using mysql2 promise-based API

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'iphone',        // ← change to your MySQL root password
  database:           process.env.DB_NAME     || 'student_finance_db',
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// Quick connectivity test on startup
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected — student_finance_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    → Check your credentials in server/db.js');
  });

module.exports = pool;