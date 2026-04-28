const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'your_db_user', host: 'localhost', database: 'procast_db', password: 'your_password', port: 5432,
});

// ==========================================
// 1. DASHBOARD & MOTIVATION ENDPOINT
// Fetches insights, unlocks, and handles lock/unlock logic
// ==========================================
app.get('/api/users/:userId/dashboard', async (req, res) => {
  const { userId } = req.params;

  try {
    // A. Check user status and calculate missed days
    const userResult = await pool.query(`SELECT current_streak, last_active_date, environment_status FROM users WHERE user_id = $1`, [userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    let user = userResult.rows[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.last_active_date ? new Date(user.last_active_date) : null;
    
    // B. Lock environment if they missed > 1 day
    if (lastActive) {
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
      if (daysDiff > 1 && user.environment_status !== 'locked') {
        await pool.query(`UPDATE users SET current_streak = 0, environment_status = 'locked' WHERE user_id = $1`, [userId]);
        user.environment_status = 'locked';
        user.current_streak = 0;
      }
    }

    // C. Fetch Behavioural Insights from our SQL View
    const insightsResult = await pool.query(`SELECT completion_rate, top_distraction FROM user_behaviour_insights WHERE user_id = $1`, [userId]);
    
    // D. Fetch Unlocked Elements
    const elementsResult = await pool.query(`SELECT element_name FROM user_unlocked_elements WHERE user_id = $1`, [userId]);

    res.status(200).json({
      streak: user.current_streak,
      environmentStatus: user.environment_status,
      userInsights: {
        completionRate: insightsResult.rows[0]?.completion_rate || 100,
        topDistraction: insightsResult.rows[0]?.top_distraction || 'None yet!'
      },
      unlockedElements: elementsResult.rows.map(row => row.element_name)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================================
// 2. EARLY EXIT ENDPOINT (Behavioural Tracking)
// Logs the session as failed and records the distraction
// ==========================================
app.post('/api/sessions/early-exit', async (req, res) => {
  const { userId, durationMinutes, distractionReason } = req.body;

  try {
    // Create the session as 'early_exit'
    const sessionRes = await pool.query(
      `INSERT INTO focus_sessions (user_id, duration_minutes, status) VALUES ($1, $2, 'early_exit') RETURNING session_id`,
      [userId, durationMinutes]
    );
    const sessionId = sessionRes.rows[0].session_id;

    // Log the distraction
    await pool.query(
      `INSERT INTO distraction_logs (session_id, user_id, reason_category) VALUES ($1, $2, $3)`,
      [sessionId, userId, distractionReason]
    );

    res.status(201).json({ message: "Distraction logged. Completion rate updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================================
// 3. COMPLETE SESSION ENDPOINT (Reflection & Rewards)
// Logs reflection, updates streak, unlocks environment
// ==========================================
app.post('/api/sessions/complete', async (req, res) => {
  const { userId, durationMinutes, rating, notes } = req.body;

  try {
    // A. Log Session as completed
    const sessionRes = await pool.query(
      `INSERT INTO focus_sessions (user_id, duration_minutes, status) VALUES ($1, $2, 'completed') RETURNING session_id`,
      [userId, durationMinutes]
    );
    
    // B. Log Reflection
    await pool.query(
      `INSERT INTO daily_reflections (user_id, focus_rating, reflection_notes) VALUES ($1, $2, $3)`,
      [userId, rating, notes]
    );

    // C. Update Streak & Unlock Environment
    const userRes = await pool.query(`
      UPDATE users 
      SET 
        current_streak = CASE 
          WHEN last_active_date = CURRENT_DATE THEN current_streak 
          WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 
          ELSE 1 
        END,
        last_active_date = CURRENT_DATE,
        environment_status = 'active', -- Unlocks the environment!
        reward_points = reward_points + 10 -- Grant points for completion
      WHERE user_id = $1
      RETURNING current_streak, environment_status, reward_points;
    `, [userId]);

    res.status(201).json({
      message: "Session complete! Environment updated.",
      userStats: userRes.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ProCast server running on port ${PORT}`));
