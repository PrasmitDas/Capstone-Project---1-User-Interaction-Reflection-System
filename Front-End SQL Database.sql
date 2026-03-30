-- Tracks user streaks and high-level progress
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs every attempted focus block
CREATE TABLE focus_sessions (
    session_id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    target_duration_minutes INT NOT NULL,
    actual_duration_minutes INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('completed', 'early_exit')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores the responses from the "Distraction Awareness Prompt"
CREATE TABLE distraction_logs (
    log_id UUID PRIMARY KEY,
    session_id UUID REFERENCES focus_sessions(session_id),
    user_id UUID REFERENCES users(user_id),
    reason_category VARCHAR(50) NOT NULL, -- e.g., 'Social Media', 'Boredom'
    custom_reason TEXT, -- Populated if they chose 'Other'
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores the responses from the "Daily Reflection System"
CREATE TABLE daily_reflections (
    reflection_id UUID PRIMARY KEY,
    session_id UUID REFERENCES focus_sessions(session_id),
    user_id UUID REFERENCES users(user_id),
    focus_rating INT CHECK (focus_rating >= 1 AND focus_rating <= 5),
    reflection_notes TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
