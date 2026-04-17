CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    processed_records INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processed_claims (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    procedure_description TEXT,
    clinical_notes TEXT,
    icd_code VARCHAR(50),
    procedure_code VARCHAR(50),
    confidence_score DECIMAL(5,4),
    model_used VARCHAR(50) DEFAULT 'medgamma',
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, success, failed, review_required
    reasoning_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS failed_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
    input_data JSONB NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for reporting and worker query performance
CREATE INDEX idx_processed_claims_upload ON processed_claims(upload_id);
CREATE INDEX idx_processed_claims_status ON processed_claims(processing_status);
CREATE INDEX idx_uploads_status ON uploads(status);
