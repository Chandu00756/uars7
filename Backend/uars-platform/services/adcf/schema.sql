-- ADCF Database Schema
-- Version: 1.0.0
-- PostgreSQL 16+ with pgcrypto extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create capsules table for storing data capsule metadata
CREATE TABLE IF NOT EXISTS capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_hash VARCHAR(128) NOT NULL UNIQUE,
    policy_id UUID NOT NULL,
    encrypted_data BYTEA NOT NULL,
    metadata JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_capsules_data_hash ON capsules USING btree (data_hash),
    INDEX idx_capsules_policy_id ON capsules USING btree (policy_id),
    INDEX idx_capsules_created_by ON capsules USING btree (created_by),
    INDEX idx_capsules_status ON capsules USING btree (status),
    INDEX idx_capsules_metadata ON capsules USING gin (metadata),
    INDEX idx_capsules_created_at ON capsules USING btree (created_at DESC)
);

-- Create policies table for access control policies
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    policy_document JSONB NOT NULL,
    schema_version VARCHAR(32) DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(128) NOT NULL,
    active BOOLEAN DEFAULT true,
    
    -- Indexes
    INDEX idx_policies_created_by ON policies USING btree (created_by),
    INDEX idx_policies_active ON policies USING btree (active),
    INDEX idx_policies_name ON policies USING btree (name),
    INDEX idx_policies_document ON policies USING gin (policy_document)
);

-- Create audit_logs table for immutable audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    capsule_id UUID,
    user_id VARCHAR(128) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    event_data JSONB DEFAULT '{}',
    result VARCHAR(32) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(128),
    request_id VARCHAR(128),
    geo_location VARCHAR(64),
    
    -- Foreign key constraints
    FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE SET NULL,
    
    -- Indexes for audit queries
    INDEX idx_audit_logs_event_type ON audit_logs USING btree (event_type),
    INDEX idx_audit_logs_capsule_id ON audit_logs USING btree (capsule_id),
    INDEX idx_audit_logs_user_id ON audit_logs USING btree (user_id),
    INDEX idx_audit_logs_timestamp ON audit_logs USING btree (timestamp DESC),
    INDEX idx_audit_logs_result ON audit_logs USING btree (result),
    INDEX idx_audit_logs_event_data ON audit_logs USING gin (event_data)
);

-- Create backup_logs table for backup operations tracking
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(32) NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    backup_location TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    checksum VARCHAR(128),
    
    -- Indexes
    INDEX idx_backup_logs_backup_type ON backup_logs USING btree (backup_type),
    INDEX idx_backup_logs_status ON backup_logs USING btree (status),
    INDEX idx_backup_logs_started_at ON backup_logs USING btree (started_at DESC)
);

-- Create p2p_sync_logs table for P2P synchronization tracking
CREATE TABLE IF NOT EXISTS p2p_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peer_id VARCHAR(128) NOT NULL,
    sync_type VARCHAR(32) NOT NULL CHECK (sync_type IN ('push', 'pull', 'gossip')),
    data_type VARCHAR(32) NOT NULL CHECK (data_type IN ('capsule', 'policy', 'audit')),
    record_count INTEGER DEFAULT 0,
    bytes_transferred BIGINT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    INDEX idx_p2p_sync_logs_peer_id ON p2p_sync_logs USING btree (peer_id),
    INDEX idx_p2p_sync_logs_sync_type ON p2p_sync_logs USING btree (sync_type),
    INDEX idx_p2p_sync_logs_data_type ON p2p_sync_logs USING btree (data_type),
    INDEX idx_p2p_sync_logs_status ON p2p_sync_logs USING btree (status),
    INDEX idx_p2p_sync_logs_started_at ON p2p_sync_logs USING btree (started_at DESC)
);

-- Create access_tokens table for tracking access tokens and their usage
CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    capsule_id UUID NOT NULL,
    granted_to VARCHAR(128) NOT NULL,
    granted_by VARCHAR(128) NOT NULL,
    permissions JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    used_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_access_tokens_token_hash ON access_tokens USING btree (token_hash),
    INDEX idx_access_tokens_capsule_id ON access_tokens USING btree (capsule_id),
    INDEX idx_access_tokens_granted_to ON access_tokens USING btree (granted_to),
    INDEX idx_access_tokens_expires_at ON access_tokens USING btree (expires_at),
    INDEX idx_access_tokens_revoked_at ON access_tokens USING btree (revoked_at)
);

-- Create intent_tokens table for storing and validating intent tokens
CREATE TABLE IF NOT EXISTS intent_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(128) NOT NULL UNIQUE,
    issuer VARCHAR(128) NOT NULL,
    subject VARCHAR(128) NOT NULL,
    intent_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    signature BYTEA NOT NULL,
    public_key BYTEA NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_intent_tokens_token_id ON intent_tokens USING btree (token_id),
    INDEX idx_intent_tokens_issuer ON intent_tokens USING btree (issuer),
    INDEX idx_intent_tokens_subject ON intent_tokens USING btree (subject),
    INDEX idx_intent_tokens_intent_type ON intent_tokens USING btree (intent_type),
    INDEX idx_intent_tokens_expires_at ON intent_tokens USING btree (expires_at),
    INDEX idx_intent_tokens_revoked_at ON intent_tokens USING btree (revoked_at)
);

-- Create user_sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) NOT NULL UNIQUE,
    user_id VARCHAR(128) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    terminated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    INDEX idx_user_sessions_session_id ON user_sessions USING btree (session_id),
    INDEX idx_user_sessions_user_id ON user_sessions USING btree (user_id),
    INDEX idx_user_sessions_expires_at ON user_sessions USING btree (expires_at),
    INDEX idx_user_sessions_last_activity ON user_sessions USING btree (last_activity DESC)
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_capsules_updated_at BEFORE UPDATE ON capsules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for secure random string generation
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function for data retention cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Cleanup old audit logs (keep 1 year)
    DELETE FROM audit_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Cleanup old backup logs (keep 6 months)
    DELETE FROM backup_logs 
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    -- Cleanup old P2P sync logs (keep 3 months)
    DELETE FROM p2p_sync_logs 
    WHERE started_at < CURRENT_TIMESTAMP - INTERVAL '3 months';
    
    -- Cleanup expired access tokens
    DELETE FROM access_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL;
    
    -- Cleanup expired intent tokens
    DELETE FROM intent_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL;
    
    -- Cleanup terminated user sessions (keep 30 days)
    DELETE FROM user_sessions 
    WHERE (terminated_at IS NOT NULL AND terminated_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
       OR (expires_at < CURRENT_TIMESTAMP);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create views for commonly accessed data
CREATE OR REPLACE VIEW active_capsules AS
SELECT 
    c.*,
    p.name as policy_name,
    p.description as policy_description
FROM capsules c
JOIN policies p ON c.policy_id = p.id
WHERE c.status = 'active' 
  AND (c.expiry_date IS NULL OR c.expiry_date > CURRENT_TIMESTAMP);

CREATE OR REPLACE VIEW recent_audit_events AS
SELECT 
    al.*,
    c.data_hash,
    us.session_id
FROM audit_logs al
LEFT JOIN capsules c ON al.capsule_id = c.id
LEFT JOIN user_sessions us ON al.session_id = us.session_id
WHERE al.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;

-- Insert default policies
INSERT INTO policies (name, description, policy_document, created_by) VALUES
('Default Allow Policy', 'Default policy that allows all operations', 
 '{"version": "1.0", "rules": [{"id": "default-allow", "effect": "allow", "conditions": []}]}', 
 'system')
ON CONFLICT DO NOTHING;

INSERT INTO policies (name, description, policy_document, created_by) VALUES
('Geo-Restriction Policy', 'Policy that restricts access based on geographic location', 
 '{"version": "1.0", "rules": [{"id": "geo-restrict", "effect": "deny", "conditions": [{"field": "geo", "operator": "in", "value": ["CN", "RU", "IR"]}]}]}', 
 'system')
ON CONFLICT DO NOTHING;

-- Create indexes for full-text search (if needed)
-- CREATE INDEX idx_capsules_metadata_gin ON capsules USING gin(to_tsvector('english', metadata::text));
-- CREATE INDEX idx_policies_document_gin ON policies USING gin(to_tsvector('english', policy_document::text));

-- Performance optimization: Create partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_capsules_active 
ON capsules (created_at DESC) 
WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent 
ON audit_logs (timestamp DESC) 
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Row Level Security (RLS) setup for multi-tenancy (optional)
-- ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY capsule_isolation ON capsules FOR ALL TO PUBLIC USING (created_by = current_setting('app.current_user_id'));

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO adcf_service;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO adcf_service;

COMMIT;
