ALTER TABLE notifications ADD COLUMN reminder_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN last_reminded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_notifications_due_unread ON notifications(username, read_flag, due_at);
CREATE INDEX idx_notifications_type_due ON notifications(type, read_flag, due_at);

