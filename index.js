const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MySQL connection configuration
const db = mysql.createConnection({
  host: "in-mum-web949.main-hosting.eu",
  user: "u449523692_quizaa",
  password: "20172522Sa@#",
  database: "u449523692_quizaa",
  port: 3306 // Default MySQL port
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL database");
    
    // Create users table if it doesn't exist (for payment records)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        amount INT NOT NULL,
        order_id VARCHAR(255),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ); 
    `;
    
    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating table:", err);
      } else {
        console.log("Users table ready for payment records");
      }
    });
  }
});
 


app.post("/updateBalance", async (req, res) => {
  try {
    const { email, amount, orderId } = req.body;
console.log( email, amount, orderId)
    // Basic validation
    if (!email || !amount) {
      return res.status(400).json({ 
        success: false,
        message: "Email and amount are required" 
      });
    }

    const amountNum = parseInt(amount);
   

    // 1. Record payment in users table
    const [paymentResult] = await db.promise().query(
      'INSERT INTO users (email, amount, order_id) VALUES (?, ?, ?)',
      [email, amountNum, orderId || null]
    );

    // 2. Update coins in existing table (assuming table name is 'tbl_users')
    const [updateResult] = await db.promise().query(
      'UPDATE tbl_users SET coins = coins + ? WHERE email = ?',
      [amountNum, email]
    );

    // Check if any rows were affected
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found in coins table"
      });
    }

    // 3. Get updated coins balance
    const [[userCoins]] = await db.promise().query(
      'SELECT coins FROM tbl_users WHERE email = ?',
      [email]
    );

    res.status(200).json({
      success: true,
      message: "Coins updated successfully",
      newBalance: userCoins.coins,
      paymentId: paymentResult.insertId
    });

  } catch (error) {
    console.error("Error updating coins:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});



// Simplified Transaction History Endpoint
app.get("/transactionHistory", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }

    // Directly fetch from users table where all data exists
    const [transactions] = await db.promise().query(
      `SELECT 
        order_id as orderId,
        amount,
        CONVERT_TZ(payment_date, '+00:00', '+05:30') as date,
        email
       FROM users
       WHERE email = ? AND order_id IS NOT NULL
       ORDER BY payment_date DESC`,
      [email]
    );
 
    res.status(200).json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});
app.get("/transactionHistoryaLL", async (req, res) => {
  try {
   

    // Directly fetch from users table where all data exists
    const [transactions] = await db.promise().query(
      `SELECT 
        order_id as orderId,
        amount,
        CONVERT_TZ(payment_date, '+00:00', '+05:30') as date,
        email
       FROM users
       
       ORDER BY payment_date DESC`,
       
    );
 
    res.status(200).json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});

 








app.get("/", (req, res) => res.send("Hii"));

app.get("/success", async (req, res) => {
  const { email } = req.query;
  
  // Check if user exists
  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length > 0) {
      // User exists, update balance
      const updateQuery = "UPDATE users SET balance = balance + 50 WHERE email = ?";
      db.query(updateQuery, [email], (err) => {
        if (err) {
          console.error("Error updating balance:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        // Get updated balance
        db.query("SELECT balance FROM users WHERE email = ?", [email], (err, balanceResult) => {
          if (err) {
            console.error("Error fetching balance:", err);
            return res.status(500).json({ message: "Internal server error" });
          }
          
          res.json({ message: "Balance updated", balance: balanceResult[0].balance });
        });
      });
    } else {
      // User doesn't exist, create with initial balance
      const insertQuery = "INSERT INTO users (email, balance) VALUES (?, 50)";
      db.query(insertQuery, [email], (err) => {
        if (err) {
          console.error("Error creating user:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        
        res.json({ message: "Balance updated", balance: 50 });
      });
    }
  });
});

// Route to fetch user information based on email
app.get("/fetchOne", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required in query parameters" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(results[0]);
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to fetch all users
app.get("/fetch", async (req, res) => {
  try {
    const query = "SELECT * FROM users";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.status(200).json(results);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});