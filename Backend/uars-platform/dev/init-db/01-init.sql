-- UARS-7 Platform Database Schema
-- This script initializes the development database

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS directory;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS events;
CREATE SCHEMA IF NOT EXISTS governance;

-- Auth schema tables
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auth.user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES auth.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Directory schema tables
CREATE TABLE directory.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    attributes JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE directory.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE directory.group_memberships (
    group_id UUID REFERENCES directory.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Security schema tables
CREATE TABLE security.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE security.security_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    policy_data JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events schema tables
CREATE TABLE events.system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(255) NOT NULL,
    source_service VARCHAR(255) NOT NULL,
    event_data JSONB NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Governance schema tables (for blockchain integration)
CREATE TABLE governance.proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    proposer_id UUID REFERENCES auth.users(id),
    proposal_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    voting_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE governance.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES governance.proposals(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES auth.users(id),
    vote_value VARCHAR(50) NOT NULL, -- 'yes', 'no', 'abstain'
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_sessions_token_hash ON auth.sessions(token_hash);
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON security.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON security.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON security.audit_logs(created_at);
CREATE INDEX idx_system_events_type ON events.system_events(event_type);
CREATE INDEX idx_system_events_source ON events.system_events(source_service);
CREATE INDEX idx_system_events_created_at ON events.system_events(created_at);

-- Insert default data
INSERT INTO auth.roles (name, description, permissions) VALUES
('admin', 'System Administrator', '["*"]'),
('user', 'Regular User', '["read:profile", "update:profile"]'),
('auditor', 'System Auditor', '["read:audit", "read:logs"]');

-- Insert default admin user (password: admin123)
INSERT INTO auth.users (id, username, email, password_hash) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'admin@uars7.com', '$2a$14$rWdyI.H/0ChFLXV8SQfyqO9OvFwF.qS6tW5VZtw5wXN8.5qhpQGay');

-- Assign admin role to admin user
INSERT INTO auth.user_roles (user_id, role_id) 
SELECT u.id, r.id 
FROM auth.users u, auth.roles r 
WHERE u.username = 'admin' AND r.name = 'admin';

-- Insert admin profile
INSERT INTO directory.user_profiles (user_id, first_name, last_name, attributes) VALUES
('00000000-0000-0000-0000-000000000001', 'System', 'Administrator', '{"department": "IT", "location": "HQ"}');

-- Create default security policies
INSERT INTO security.security_policies (name, description, policy_data) VALUES
('password_policy', 'Default password requirements', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true}'),
('session_policy', 'Session management policy', '{"max_duration": "24h", "idle_timeout": "2h", "max_concurrent": 5}');

COMMIT;
