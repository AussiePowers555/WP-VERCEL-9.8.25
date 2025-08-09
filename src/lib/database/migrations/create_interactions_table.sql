-- Create interactions table with comprehensive schema
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL,
    case_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'sms', 'note', 'document')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    situation TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    outcome TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'follow_up_required')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attachments JSONB DEFAULT '[]'::jsonb,
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    workspace_id UUID NOT NULL
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_interactions_case_timestamp ON interactions(case_number, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace_timestamp ON interactions(workspace_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_case_id ON interactions(case_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_priority ON interactions(priority);
CREATE INDEX IF NOT EXISTS idx_interactions_status ON interactions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_created_by ON interactions(created_by);

-- Full-text search index for situation, action, and outcome
CREATE INDEX IF NOT EXISTS idx_interactions_fulltext ON interactions 
USING gin(to_tsvector('english', situation || ' ' || action_taken || ' ' || outcome));

-- Tag search index
CREATE INDEX IF NOT EXISTS idx_interactions_tags ON interactions USING gin(tags);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_interactions_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_interactions_updated_at ON interactions;
CREATE TRIGGER trigger_interactions_updated_at
    BEFORE UPDATE ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interactions_updated_at();

-- Comments for documentation
COMMENT ON TABLE interactions IS 'Customer interaction log with SAR (Situation, Action, Result) structure';
COMMENT ON COLUMN interactions.case_number IS 'Human-readable case identifier';
COMMENT ON COLUMN interactions.case_id IS 'Foreign key reference to cases table';
COMMENT ON COLUMN interactions.interaction_type IS 'Type of interaction: call, email, meeting, sms, note, document';
COMMENT ON COLUMN interactions.timestamp IS 'When the interaction occurred (user-specified)';
COMMENT ON COLUMN interactions.situation IS 'Description of the situation that prompted the interaction';
COMMENT ON COLUMN interactions.action_taken IS 'Actions taken during the interaction';
COMMENT ON COLUMN interactions.outcome IS 'Result or outcome of the interaction';
COMMENT ON COLUMN interactions.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN interactions.status IS 'Current status: pending, in_progress, completed, follow_up_required';
COMMENT ON COLUMN interactions.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN interactions.attachments IS 'JSON array of attachment metadata';
COMMENT ON COLUMN interactions.workspace_id IS 'Associated workspace for multi-tenant support';