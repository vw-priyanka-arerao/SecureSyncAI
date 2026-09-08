ALTER TABLE documents ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN deleted_by VARCHAR(80);

CREATE INDEX idx_documents_deleted ON documents(deleted);

