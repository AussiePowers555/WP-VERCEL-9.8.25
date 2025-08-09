-- Enhanced Interactions Schema for NEON PostgreSQL
-- Optimized for fast queries with proper indexing

-- Drop existing table if exists (for development only)
-- DROP TABLE IF EXISTS interactions;

-- Main interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'sms', 'note', 'document')),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Contact information
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    
    -- Structured interaction fields
    situation TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    outcome TEXT NOT NULL,
    
    -- Additional metadata
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'follow_up_required')),
    tags TEXT[], -- Array of tags for categorization
    
    -- File attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- User tracking
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Workspace isolation
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_interactions_case_number ON interactions(case_number);
CREATE INDEX IF NOT EXISTS idx_interactions_case_id ON interactions(case_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace ON interactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_interactions_status ON interactions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_priority ON interactions(priority);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_interactions_case_timestamp ON interactions(case_number, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace_timestamp ON interactions(workspace_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type_timestamp ON interactions(interaction_type, timestamp DESC);

-- Full-text search index for situation, action, outcome
CREATE INDEX IF NOT EXISTS idx_interactions_fulltext ON interactions 
USING gin(to_tsvector('english', situation || ' ' || action_taken || ' ' || outcome));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interactions_updated_at
    BEFORE UPDATE ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interactions_updated_at();

-- View for interaction feed with case and user details
CREATE OR REPLACE VIEW interaction_feed_view AS
SELECT 
    i.id,
    i.case_number,
    i.case_id,
    i.interaction_type,
    i.timestamp,
    i.contact_name,
    i.contact_phone,
    i.contact_email,
    i.situation,
    i.action_taken,
    i.outcome,
    i.priority,
    i.status,
    i.tags,
    i.attachments,
    i.created_at,
    i.updated_at,
    i.workspace_id,
    -- Case details
    c.hirer_name as case_hirer_name,
    c.incident_date,
    c.status as case_status,
    -- User details
    u.name as created_by_name,
    u.email as created_by_email
FROM interactions i
LEFT JOIN cases c ON i.case_id = c.id
LEFT JOIN users u ON i.created_by = u.id
ORDER BY i.timestamp DESC;

-- Grant permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON interactions TO authenticated;
GRANT SELECT ON interaction_feed_view TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE interactions_id_seq TO authenticated;