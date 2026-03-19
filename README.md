<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Student Finance Management System</title>
</head>

<body>

<h1>💰 Student Finance Management System</h1>

<p>
A <b>Student Finance Management System</b> is a database-driven application designed to help students manage their monthly finances effectively. 
The system allows students to deposit money at the beginning of a period and receive controlled daily allowances to prevent overspending before the end of the month.
</p>

<p>
This project is developed as part of a <b>Database Management Systems (DBMS)</b> course to demonstrate concepts such as database design, entity relationships, 
transactions, constraints, and financial data management.
</p>

<hr>

<h2>📌 Problem Statement</h2>

<p>
Many students receive a fixed amount of money for a specific time period (weekly or monthly). Often, they spend a large portion early and face financial shortages later.
</p>

<p>This system solves that problem by:</p>

<ul>
<li>Distributing deposited money over time</li>
<li>Allowing controlled withdrawals</li>
<li>Supporting goal-based savings</li>
<li>Tracking all financial transactions</li>
</ul>

<hr>

<h2>🎯 Project Objectives</h2>

<ul>
<li>Help students <b>manage monthly expenses efficiently</b></li>
<li>Prevent <b>overspending</b></li>
<li>Encourage <b>saving habits</b></li>
<li>Maintain <b>transaction transparency</b></li>
<li>Demonstrate <b>DBMS concepts through a real-world use case</b></li>
</ul>

<hr>

<h2>⚙️ Key Features</h2>

<h3>1️⃣ Money Deposit</h3>

<p>Students can deposit money into the system for a specific duration.</p>

<p><b>Example:</b></p>

<ul>
<li>Deposit: ₹1000</li>
<li>Duration: 30 Days</li>
</ul>

<p>The system automatically calculates the <b>daily allowance</b>.</p>

<hr>

<h3>2️⃣ Daily Allowance Distribution</h3>

<p>The deposited money is divided into daily spending limits.</p>

<table border="1" cellpadding="8">
<tr>
<th>Day</th>
<th>Allowed Amount</th>
</tr>
<tr>
<td>Day 1</td>
<td>₹33</td>
</tr>
<tr>
<td>Day 2</td>
<td>₹33</td>
</tr>
<tr>
<td>Day 3</td>
<td>₹33</td>
</tr>
</table>

<p>Students can withdraw only the amount available for that day.</p>

<hr>

<h3>3️⃣ Expense Tracking</h3>

<p>Every withdrawal is recorded in the system.</p>

<table border="1" cellpadding="8">
<tr>
<th>Date</th>
<th>Amount</th>
<th>Description</th>
</tr>
<tr>
<td>10 Mar</td>
<td>₹30</td>
<td>Food</td>
</tr>
<tr>
<td>12 Mar</td>
<td>₹20</td>
<td>Transport</td>
</tr>
</table>

<hr>

<h3>4️⃣ Goal-Based Savings</h3>

<p>Students can create savings goals for planned purchases.</p>

<p><b>Example:</b></p>

<ul>
<li>Goal: Buy Headphones</li>
<li>Target Amount: ₹3000</li>
</ul>

<p>Money allocated to a goal cannot be withdrawn until the target amount is reached.</p>

<hr>

<h3>5️⃣ Transaction History</h3>

<p>The system maintains a complete history of:</p>

<ul>
<li>Deposits</li>
<li>Withdrawals</li>
<li>Goal contributions</li>
</ul>

<hr>

<h2>🗄️ Database Design</h2>

<h3>Students Table</h3>

<pre>
student_id (Primary Key)
name
email
password
created_at
</pre>

<h3>Deposits Table</h3>

<pre>
deposit_id (Primary Key)
student_id (Foreign Key)
total_amount
deposit_date
duration_days
daily_limit
status
</pre>

<h3>Daily Allowance Table</h3>

<pre>
allowance_id (Primary Key)
deposit_id (Foreign Key)
date
allowed_amount
withdrawn_amount
remaining_amount
</pre>

<h3>Transactions Table</h3>

<pre>
transaction_id (Primary Key)
student_id (Foreign Key)
amount
type
date
description
</pre>

<h3>Savings Goals Table</h3>

<pre>
goal_id (Primary Key)
student_id (Foreign Key)
goal_name
target_amount
saved_amount
deadline
status
</pre>

<h3>Goal Contributions Table</h3>

<pre>
contribution_id (Primary Key)
goal_id (Foreign Key)
amount
date
</pre>

<hr>

<h2>🔗 Entity Relationships</h2>

<ul>
<li>One <b>Student</b> → Many <b>Deposits</b></li>
<li>One <b>Deposit</b> → Many <b>Daily Allowances</b></li>
<li>One <b>Student</b> → Many <b>Savings Goals</b></li>
<li>One <b>Savings Goal</b> → Many <b>Contributions</b></li>
<li>Each <b>Transaction</b> belongs to a <b>Student</b></li>
</ul>

<hr>

<h2>🧠 DBMS Concepts Used</h2>

<ul>
<li>Entity Relationship Modeling</li>
<li>Primary Keys</li>
<li>Foreign Keys</li>
<li>Relational Schema Design</li>
<li>Database Normalization</li>
<li>Transaction Management</li>
<li>Data Integrity Constraints</li>
</ul>

<hr>

<h2>🖥️ Possible Tech Stack</h2>

<ul>
<li><b>Frontend:</b> HTML, CSS, JavaScript</li>
<li><b>Backend:</b> Node.js / Python / PHP</li>
<li><b>Database:</b> MySQL / PostgreSQL</li>
</ul>

<hr>

<h2>🚀 Future Enhancements</h2>

<ul>
<li>Spending analytics and charts</li>
<li>Low balance notifications</li>
<li>AI-based financial suggestions</li>
<li>Mobile application</li>
<li>Payment gateway integration</li>
<li>Weekly financial reports</li>
</ul>

<hr>

<h2>🎓 Academic Purpose</h2>

<p>
This project is developed as part of a <b>DBMS academic project</b> to apply database design principles to a real-world financial management problem faced by students.
</p>

<hr>

<h2>📄 License</h2>

<p>This project is developed for <b>educational purposes</b>.</p>

</body>
</html>
