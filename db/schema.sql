-- Main Companies Table
CREATE TABLE Companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job Roles Table
CREATE TABLE JobRoles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES Companies(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES Companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    permission_role VARCHAR(50) NOT NULL CHECK (permission_role IN ('Head Management', 'Employee')), -- Added other potential roles if needed later
    job_role_id INTEGER REFERENCES JobRoles(id) ON DELETE SET NULL, -- Employee might not have a job role initially or it could be optional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payrolls Table
CREATE TABLE Payrolls (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES Companies(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL, -- Assuming monetary value, adjust precision as needed
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'COMPLETED', 'PROCESSING', 'FAILED')), -- Added more statuses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PayStubs Table
CREATE TABLE PayStubs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    payroll_id INTEGER NOT NULL REFERENCES Payrolls(id) ON DELETE CASCADE,
    gross_pay NUMERIC(10, 2) NOT NULL,
    deductions NUMERIC(10, 2) NOT NULL,
    net_pay NUMERIC(10, 2) NOT NULL,
    pdf_url VARCHAR(512), -- URL to the PDF, can be quite long
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TimePunches Table
CREATE TABLE TimePunches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    punch_type VARCHAR(20) NOT NULL CHECK (punch_type IN ('CLOCK_IN', 'LUNCH_START', 'LUNCH_END', 'CLOCK_OUT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Optional: record creation time if different from punch timestamp
);

-- Indexes for frequently queried columns (Foreign Keys are often indexed by default, but explicit can be good)
CREATE INDEX idx_users_company_id ON Users(company_id);
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_jobroles_company_id ON JobRoles(company_id);
CREATE INDEX idx_payrolls_company_id ON Payrolls(company_id);
CREATE INDEX idx_paystubs_user_id ON PayStubs(user_id);
CREATE INDEX idx_paystubs_payroll_id ON PayStubs(payroll_id);
CREATE INDEX idx_timepunches_user_id ON TimePunches(user_id);

COMMENT ON COLUMN Users.permission_role IS 'Permission role within the system, e.g., Head Management, Employee.';
COMMENT ON COLUMN Payrolls.status IS 'Current status of the payroll run.';
COMMENT ON COLUMN TimePunches.punch_type IS 'Type of time punch event.';
COMMENT ON COLUMN PayStubs.pdf_url IS 'Link to the generated PDF pay stub.';

-- Ensure company_id and role_name are unique together for JobRoles within a company
ALTER TABLE JobRoles ADD CONSTRAINT unique_company_role_name UNIQUE (company_id, role_name);

-- Note: Consider adding more specific constraints or default values as business logic becomes clearer.
-- For example, ensuring pay_period_end is after pay_period_start.
-- Or specific formats/checks for email, password_hash strength (though app layer is better for some).
--CASCADE ON DELETE for company_id FKs means if a company is deleted, its related users, job roles, payrolls are also deleted.
--ON DELETE SET NULL for job_role_id in Users means if a job role is deleted, the user's job_role_id is set to NULL rather than deleting the user. This seems like a reasonable default.Tool output for `create_file_with_block`:
