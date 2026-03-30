const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client

const app = express();
app.use(express.json());

// Database connection setup
const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'procast_db',
  password: 'your_password',
  port: 5432,
});

// ==========================================
// FEATURE 1: Daily Reflection System
// ==========================================
app.post('/api/reflections', async (req, res) => {
  const { userId, rating, notes } = req.body;

  try {
    // 1. Save the reflection
    const insertReflectionQuery = `
      INSERT INTO daily_reflections (user_id, focus_rating, reflection_notes)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const reflectionResult = await pool.query(insertReflectionQuery, [userId, rating, notes]);

    // 2. Update the user's last active date and increment streak if it's a new day
    const updateStreakQuery = `
      UPDATE users 
      SET 
        current_streak = CASE 
          WHEN last_active_date = CURRENT_DATE THEN current_streak -- Already active today
          WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 -- Continued streak
          ELSE 1 -- Started a new streak
        END,
        last_active_date = CURRENT_DATE
      WHERE user_id = $1
      RETURNING current_streak;
    `;
    const userResult = await pool.query(updateStreakQuery, [userId]);

    res.status(201).json({
      message: "Reflection saved successfully.",
      reflection: reflectionResult.rows[0],
      newStreak: userResult.rows[0].current_streak
    });

  } catch (error) {
    console.error("Error saving reflection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// FEATURE 2: Motivation & Feedback Messages
// ==========================================
app.get('/api/users/:userId/motivation', async (req, res) => {
  const { userId } = req.params;

  try {
    const userQuery = `SELECT current_streak, last_active_date FROM users WHERE user_id = $1;`;
    const result = await pool.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    let message = "";
    let messageType = "neutral";
    
    // Calculate days since last active
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.last_active_date ? new Date(user.last_active_date) : null;
    
    let daysDiff = null;
    if (lastActive) {
      const timeDiff = today.getTime() - lastActive.getTime();
      daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    }

    // Logic for Feedback Messages
    if (daysDiff === null) {
      message = "Welcome to ProCast! Complete your first focus session to start building your town.";
      messageType = "encouragement";
    } else if (daysDiff === 0) {
      message = `Great job today! You are currently on a ${user.current_streak}-day streak.`;
      messageType = "encouragement";
    } else if (daysDiff === 1) {
      message = `🔥 ${user.current_streak}-Day Streak! Your focus is unbreakable. Let's keep the momentum going today.`;
      messageType = "encouragement";
    } else if (daysDiff > 1) {
      // Missed yesterday (or more). We should reset the streak in the DB.
      await pool.query(`UPDATE users SET current_streak = 0 WHERE user_id = $1`, [userId]);
      
      message = "⚠️ Your town was quiet yesterday and your progress has locked. Complete a session today to start a new streak and unlock it!";
      messageType = "warning";
      user.current_streak = 0; // Update local variable for the response
    }

    res.status(200).json({
      streak: user.current_streak,
      messageType: messageType,
      message: message
    });

  } catch (error) {
    console.error("Error fetching motivation message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ProCast server running on port ${PORT}`));
