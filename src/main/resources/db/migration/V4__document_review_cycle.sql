ALTER TABLE documents ADD COLUMN next_review_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN review_cycle_days INTEGER NOT NULL DEFAULT 365;

UPDATE documents
SET next_review_at = COALESCE(next_review_at, created_at + (review_cycle_days * INTERVAL '1 day'));

ALTER TABLE documents ALTER COLUMN next_review_at SET NOT NULL;

CREATE INDEX idx_documents_next_review_at ON documents(next_review_at);

