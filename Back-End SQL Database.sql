-- Table to track users and their streak status
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    current_streak INT DEFAULT 0,
    last_active_date DATE, -- Crucial for the Motivation & Feedback system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store post-focus reflections
CREATE TABLE daily_reflections (
    reflection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_date DATE DEFAULT CURRENT_DATE,
    focus_rating INT CHECK (focus_rating >= 1 AND focus_rating <= 5),
    reflection_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
