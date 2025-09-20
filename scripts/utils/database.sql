-- AsthmaCare Database Schema
-- This file contains the SQL schema for all database tables and policies

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'doctor', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE priority_level AS ENUM ('routine', 'urgent', 'emergency');
CREATE TYPE document_type AS ENUM ('prescription', 'test-result', 'medical-report', 'insurance', 'x-ray', 'other');
CREATE TYPE symptom_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE medication_type AS ENUM ('rescue', 'controller', 'preventive', 'other');

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  age_group VARCHAR(50),
  phone_number VARCHAR(20),
  address TEXT,
  asthma_severity VARCHAR(100),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  role user_role DEFAULT 'user',
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Health Reports Table
CREATE TABLE health_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  document_type document_type NOT NULL,
  notes TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id VARCHAR(100) NOT NULL,
  doctor_name VARCHAR(255),
  appointment_type VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  priority priority_level DEFAULT 'routine',
  status appointment_status DEFAULT 'pending',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_appointment_datetime CHECK (
    appointment_date >= CURRENT_DATE OR 
    (appointment_date = CURRENT_DATE AND appointment_time > CURRENT_TIME)
  )
);

-- Chat History Table
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  message_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Air Quality Cache Table
CREATE TABLE air_quality_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
  
  INDEX idx_air_quality_location (location),
  INDEX idx_air_quality_expires (expires_at)
);

-- Symptoms Tracking Table
CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptom_type VARCHAR(100) NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  triggers TEXT[],
  medications_used TEXT[],
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications Table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  medication_type medication_type DEFAULT 'other',
  frequency VARCHAR(100),
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Contacts Table
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_phone_number CHECK (phone_number ~ '^[\+]?[1-9][\d]{3,14}$')
);

-- Doctor Profiles Table (for appointment system)
CREATE TABLE doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255) NOT NULL,
  credentials TEXT[],
  bio TEXT,
  profile_image_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  available_hours JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- System Logs Table (for debugging and monitoring)
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_health_reports_user_id ON health_reports(user_id);
CREATE INDEX idx_health_reports_type ON health_reports(document_type);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);
CREATE INDEX idx_symptoms_user_id ON symptoms(user_id);
CREATE INDEX idx_symptoms_recorded_at ON symptoms(recorded_at);
CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_medications_taken_at ON medications(taken_at);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for health_reports
CREATE POLICY "Users can view own health reports" ON health_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health reports" ON health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health reports" ON health_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health reports" ON health_reports
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own chat history" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for symptoms
CREATE POLICY "Users can view own symptoms" ON symptoms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" ON symptoms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms" ON symptoms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms" ON symptoms
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for medications
CREATE POLICY "Users can view own medications" ON medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications" ON medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications" ON medications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications" ON medications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can view own emergency contacts" ON emergency_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts" ON emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts" ON emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts" ON emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('health-reports', 'health-reports', false),
  ('profile-images', 'profile-images', true),
  ('chat-attachments', 'chat-attachments', false),
  ('documents', 'documents', false);

-- Storage RLS Policies
CREATE POLICY "Users can upload own health reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own health reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own health reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Profile images policies (public read)
CREATE POLICY "Profile images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at 
  BEFORE UPDATE ON health_reports 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at 
  BEFORE UPDATE ON emergency_contacts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to clean up expired air quality cache
CREATE OR REPLACE FUNCTION clean_expired_air_quality_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM air_quality_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate health summary
CREATE OR REPLACE FUNCTION get_user_health_summary(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_reports', (
      SELECT COUNT(*) FROM health_reports WHERE user_id = user_uuid
    ),
    'upcoming_appointments', (
      SELECT COUNT(*) FROM appointments 
      WHERE user_id = user_uuid 
      AND appointment_date >= CURRENT_DATE 
      AND status != 'cancelled'
    ),
    'recent_symptoms', (
      SELECT COUNT(*) FROM symptoms 
      WHERE user_id = user_uuid 
      AND recorded_at > NOW() - INTERVAL '7 days'
    ),
    'medications_count', (
      SELECT COUNT(DISTINCT medication_name) FROM medications 
      WHERE user_id = user_uuid
    ),
    'emergency_contacts', (
      SELECT COUNT(*) FROM emergency_contacts WHERE user_id = user_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get symptom trends
CREATE OR REPLACE FUNCTION get_symptom_trends(
  user_uuid UUID, 
  days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', date_trunc('day', recorded_at)::date,
      'avg_severity', ROUND(AVG(severity), 2),
      'symptom_count', COUNT(*)
    ) ORDER BY date_trunc('day', recorded_at)
  )
  FROM symptoms 
  WHERE user_id = user_uuid 
  AND recorded_at > NOW() - (days_back || ' days')::interval
  GROUP BY date_trunc('day', recorded_at)
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample Doctor Data
INSERT INTO doctor_profiles (doctor_id, full_name, specialty, credentials, bio, rating, review_count) VALUES
('dr-smith', 'Dr. Sarah Smith', 'Pulmonologist', ARRAY['MD', 'Board Certified in Pulmonary Medicine'], 'Dr. Smith has over 15 years of experience treating respiratory conditions with a focus on asthma and COPD.', 4.9, 127),
('dr-johnson', 'Dr. Michael Johnson', 'Respiratory Specialist', ARRAY['MD', 'Fellowship in Respiratory Medicine'], 'Specialist in COPD, asthma, and respiratory allergies with extensive research background.', 4.8, 93),
('dr-williams', 'Dr. Emily Williams', 'Allergy & Asthma Specialist', ARRAY['MD', 'Board Certified in Allergy and Immunology'], 'Expert in allergy testing and asthma immunotherapy with focus on pediatric care.', 5.0, 84),
('dr-brown', 'Dr. David Brown', 'Internal Medicine', ARRAY['MD', 'Internal Medicine Residency'], 'General internal medicine with specialization in chronic disease management.', 4.7, 156),
('dr-davis', 'Dr. Lisa Davis', 'Pediatric Pulmonologist', ARRAY['MD', 'Pediatric Pulmonology Fellowship'], 'Specialized care for children with asthma and other respiratory conditions.', 4.9, 72);

-- Create scheduled job to clean expired cache (if pg_cron is available)
-- SELECT cron.schedule('clean-air-quality-cache', '0 */6 * * *', 'SELECT clean_expired_air_quality_cache();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User profile information and preferences';
COMMENT ON TABLE health_reports IS 'Uploaded health documents and reports';
COMMENT ON TABLE appointments IS 'Medical appointments scheduled by users';
COMMENT ON TABLE chat_history IS 'AI chatbot conversation history';
COMMENT ON TABLE air_quality_cache IS 'Cached air quality data to reduce API calls';
COMMENT ON TABLE symptoms IS 'User-logged symptoms and severity tracking';
COMMENT ON TABLE medications IS 'Medication usage tracking and adherence';
COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for users';
COMMENT ON TABLE doctor_profiles IS 'Doctor profiles for appointment booking system';
COMMENT ON TABLE notifications IS 'System notifications and alerts for users';
COMMENT ON TABLE system_logs IS 'System activity logs for debugging and audit';

-- Additional utility views for easier querying
CREATE VIEW user_health_dashboard AS
SELECT 
  up.user_id,
  up.full_name,
  up.asthma_severity,
  (SELECT COUNT(*) FROM health_reports hr WHERE hr.user_id = up.user_id) as total_reports,
  (SELECT COUNT(*) FROM appointments a WHERE a.user_id = up.user_id AND a.appointment_date >= CURRENT_DATE AND a.status != 'cancelled') as upcoming_appointments,
  (SELECT COUNT(*) FROM symptoms s WHERE s.user_id = up.user_id AND s.recorded_at > NOW() - INTERVAL '7 days') as recent_symptoms,
  (SELECT AVG(severity) FROM symptoms s WHERE s.user_id = up.user_id AND s.recorded_at > NOW() - INTERVAL '30 days') as avg_symptom_severity,
  up.created_at as member_since
FROM user_profiles up;

-- View for appointment calendar
CREATE VIEW appointment_calendar AS
SELECT 
  a.id,
  a.user_id,
  up.full_name as patient_name,
  dp.full_name as doctor_name,
  dp.specialty,
  a.appointment_date,
  a.appointment_time,
  a.appointment_type,
  a.status,
  a.priority,
  a.reason
FROM appointments a
JOIN user_profiles up ON a.user_id = up.user_id
LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id;

-- View for recent activity
CREATE VIEW recent_activity AS
SELECT 
  'health_report' as activity_type,
  user_id,
  filename as title,
  'Uploaded ' || document_type as description,
  created_at
FROM health_reports
WHERE created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'appointment' as activity_type,
  user_id,
  'Appointment with ' || doctor_name as title,
  appointment_type || ' on ' || appointment_date::text as description,
  created_at
FROM appointments
WHERE created_at > NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'symptom' as activity_type,
  user_id,
  'Symptom logged' as title,
  symptom_type || ' (severity: ' || severity || ')' as description,
  created_at
FROM symptoms
WHERE created_at > NOW() - INTERVAL '30 days'

ORDER BY created_at DESC;

-- Performance optimization: Partial indexes
CREATE INDEX CONCURRENTLY idx_appointments_upcoming 
ON appointments (user_id, appointment_date) 
WHERE status != 'cancelled' AND appointment_date >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY idx_symptoms_recent 
ON symptoms (user_id, recorded_at) 
WHERE recorded_at > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY idx_notifications_unread 
ON notifications (user_id, created_at) 
WHERE is_read = false;

-- Health scoring function
CREATE OR REPLACE FUNCTION calculate_health_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 100;
  recent_symptoms INTEGER;
  avg_severity DECIMAL;
  missed_appointments INTEGER;
  medication_adherence DECIMAL;
  final_score INTEGER;
BEGIN
  -- Count recent symptoms (last 7 days)
  SELECT COUNT(*), COALESCE(AVG(severity), 0)
  INTO recent_symptoms, avg_severity
  FROM symptoms 
  WHERE user_id = user_uuid 
  AND recorded_at > NOW() - INTERVAL '7 days';
  
  -- Count missed appointments (last 30 days)
  SELECT COUNT(*)
  INTO missed_appointments
  FROM appointments
  WHERE user_id = user_uuid
  AND status = 'cancelled'
  AND created_at > NOW() - INTERVAL '30 days';
  
  -- Calculate medication adherence (simplified)
  SELECT COALESCE(COUNT(*) / 30.0, 0)
  INTO medication_adherence
  FROM medications
  WHERE user_id = user_uuid
  AND taken_at > NOW() - INTERVAL '30 days';
  
  -- Calculate final score
  final_score := base_score 
    - (recent_symptoms * 5)           -- -5 points per recent symptom
    - (avg_severity * 3)::INTEGER     -- -3 points per average severity point
    - (missed_appointments * 10)      -- -10 points per missed appointment
    + LEAST((medication_adherence * 2)::INTEGER, 10); -- +2 points per day with meds, max 10
  
  RETURN GREATEST(final_score, 0); -- Ensure score doesn't go below 0
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification trigger function
CREATE OR REPLACE FUNCTION create_appointment_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new appointment
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Appointment Scheduled',
      'Your appointment with ' || COALESCE(NEW.doctor_name, 'the doctor') || ' has been scheduled for ' || NEW.appointment_date || ' at ' || NEW.appointment_time,
      'success',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_created')
    );
  END IF;
  
  -- Create notification for appointment cancellation
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Appointment Cancelled',
      'Your appointment scheduled for ' || NEW.appointment_date || ' has been cancelled',
      'warning',
      json_build_object('appointment_id', NEW.id, 'type', 'appointment_cancelled')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply appointment notification trigger
CREATE TRIGGER appointment_notifications_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE create_appointment_notifications();

-- System health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users_30d', (
      SELECT COUNT(DISTINCT user_id) 
      FROM system_logs 
      WHERE created_at > NOW() - INTERVAL '30 days'
    ),
    'total_appointments', (SELECT COUNT(*) FROM appointments),
    'total_health_reports', (SELECT COUNT(*) FROM health_reports),
    'storage_usage_mb', (
      SELECT ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) 
      FROM health_reports
    ),
    'avg_health_score', (
      SELECT ROUND(AVG(calculate_health_score(user_id)), 2)
      FROM user_profiles
    ),
    'system_status', 'healthy',
    'last_updated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Clean up old air quality cache (older than 24 hours)
  DELETE FROM air_quality_cache WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  -- Clean up old chat history for anonymous users (older than 7 days)
  DELETE FROM chat_history WHERE user_id IS NULL AND created_at < NOW() - INTERVAL '7 days';
  
  -- Clean up old system logs (older than 90 days)
  DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Archive old notifications (mark as read if older than 30 days)
  UPDATE notifications 
  SET is_read = true 
  WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = false;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Emergency alert function
CREATE OR REPLACE FUNCTION create_emergency_alert(
  user_uuid UUID,
  alert_message TEXT,
  severity TEXT DEFAULT 'high'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (
    user_uuid,
    'Emergency Alert',
    alert_message,
    'error',
    json_build_object('severity', severity, 'is_emergency', true, 'created_by', 'system')
  )
  RETURNING id INTO notification_id;
  
  -- Log the emergency alert
  INSERT INTO system_logs (user_id, action, resource_type, details)
  VALUES (
    user_uuid,
    'emergency_alert_created',
    'notification',
    json_build_object('notification_id', notification_id, 'severity', severity)
  );
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backup user data function
CREATE OR REPLACE FUNCTION backup_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  user_backup JSON;
BEGIN
  SELECT json_build_object(
    'user_profile', (
      SELECT row_to_json(up) FROM user_profiles up WHERE user_id = user_uuid
    ),
    'health_reports', (
      SELECT json_agg(hr) FROM health_reports hr WHERE user_id = user_uuid
    ),
    'appointments', (
      SELECT json_agg(a) FROM appointments a WHERE user_id = user_uuid
    ),
    'symptoms', (
      SELECT json_agg(s) FROM symptoms s WHERE user_id = user_uuid
    ),
    'medications', (
      SELECT json_agg(m) FROM medications m WHERE user_id = user_uuid
    ),
    'emergency_contacts', (
      SELECT json_agg(ec) FROM emergency_contacts ec WHERE user_id = user_uuid
    ),
    'chat_history', (
      SELECT json_agg(ch) FROM chat_history ch WHERE user_id = user_uuid
    ),
    'backup_created_at', NOW()
  ) INTO user_backup;
  
  RETURN user_backup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Final setup and permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;

-- Grant execute permissions on custom functions
GRANT EXECUTE ON FUNCTION get_user_health_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_symptom_trends(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_health_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION backup_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_emergency_alert(UUID, TEXT, TEXT) TO authenticated;

-- Create sample notification for testing
-- This would typically be removed in production
INSERT INTO notifications (user_id, title, message, type) 
SELECT 
  id as user_id,
  'Welcome to AsthmaCare!',
  'Thank you for joining AsthmaCare. Start by uploading your health reports and scheduling your first appointment.',
  'info'
FROM auth.users 
WHERE email = 'test@example.com';

-- Final comment
COMMENT ON DATABASE postgres IS 'AsthmaCare application database with full health management system';