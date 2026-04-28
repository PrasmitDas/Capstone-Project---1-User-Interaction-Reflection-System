-- 1. Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    current_streak INT DEFAULT 0,
    last_active_date DATE,
    environment_status VARCHAR(20) DEFAULT 'active' CHECK (environment_status IN ('active', 'locked')),
    reward_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Focus Sessions (Base for completion rate tracking)
CREATE TABLE focus_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('completed', 'early_exit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Distraction Logs (Base for interruption tracking)
CREATE TABLE distraction_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES focus_sessions(session_id),
    user_id UUID REFERENCES users(user_id),
    reason_category VARCHAR(50) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Reward System: Unlocked Elements Table
CREATE TABLE user_unlocked_elements (
    unlock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    element_name VARCHAR(50) NOT NULL, -- e.g., 'Oak Tree', 'Fountain'
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Behavioural Tracking: Insights View
-- This view automatically calculates session completion rates and the #1 distraction per user.
CREATE VIEW user_behaviour_insights AS
SELECT 
    u.user_id,
    COUNT(fs.session_id) AS total_sessions,
    SUM(CASE WHEN fs.status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
    ROUND((SUM(CASE WHEN fs.status = 'completed' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(fs.session_id), 0), 2) AS completion_rate,
    (SELECT reason_category FROM distraction_logs dl WHERE dl.user_id = u.user_id GROUP BY reason_category ORDER BY COUNT(*) DESC LIMIT 1) AS top_distraction
FROM users u
LEFT JOIN focus_sessions fs ON u.user_id = fs.user_id
GROUP BY u.user_id;
