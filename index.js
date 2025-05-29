const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://HeySatyam:20172522Satyam@cluster0.xqoozjj.mongodb.net/FF?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  name: { type: String },
  // Add other fields as needed
});

const User = mongoose.model("User", userSchema);

// Route to add ₹50 when email is provided in query
app.get("/add-balance", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required in query parameters" });
    }

    // Find user and update balance (create if doesn't exist)
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $inc: { balance: 50 } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "₹50 added successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error adding balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/", (res, rs) => rs.send("Hii"));

app.get("/success", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOneAndUpdate(
    { email },
    { $inc: { balance: 50 }, $setOnInsert: { email } },
    { upsert: true, new: true }
  );
  res.json({ message: "Balance updated", balance: user.balance });
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(
      
      user,
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/fetch", async (req, res) => {
  try {
    const user = await User.find();

    res.status(200).json(
     
      user
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
