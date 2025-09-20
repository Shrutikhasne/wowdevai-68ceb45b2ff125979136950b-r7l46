/**
 * API Utilities - External API integrations and internal API helpers
 * Handles air quality, weather, AI chat, and other external services
 */

import { supabase, TABLES, STORAGE_BUCKETS } from '../../config/supabase.js';

/**
 * Air Quality API Integration
 */

const AIR_QUALITY_API_KEY = 'your-air-quality-api-key';
const AIR_QUALITY_BASE_URL = 'http://api.weatherapi.com/v1';

/**
 * Check air quality for a location
 * @param {string} location - Location name or coordinates
 * @returns {Promise<Object>} Air quality data
 */
export async function checkAirQuality(location) {
  try {
    // First, try to get cached data
    const cachedData = await getCachedAirQuality(location);
    
    if (cachedData && isDataFresh(cachedData.created_at, 30)) { // 30 minutes cache
      console.log('✅ Using cached air quality data');
      return cachedData.data;
    }

    // Fetch fresh data from API
    const url = `${AIR_QUALITY_BASE_URL}/current.json?key=${AIR_QUALITY_API_KEY}&q=${encodeURIComponent(location)}&aqi=yes`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Air quality API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the data
    await cacheAirQuality(location, data);
    
    console.log('✅ Air quality data fetched successfully');
    return data;
    
  } catch (error) {
    console.error('❌ Air quality fetch failed:', error);
    
    // Return fallback data or cached data if available
    const fallbackData = await getCachedAirQuality(location);
    if (fallbackData) {
      console.log('📦 Using stale cached data as fallback');
      return fallbackData.data;
    }
    
    throw error;}
}

/**
 * Get cached air quality data
 * @param {string} location - Location name
 * @returns {Promise<Object|null>} Cached data or null
 */
async function getCachedAirQuality(location) {
  try {
    const { data, error } = await supabase
      .from(TABLES.AIR_QUALITY_CACHE)
      .select('*')
      .eq('location', location.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
    
  } catch (error) {
    console.error('Cache lookup failed:', error);
    return null;
  }
}

/**
 * Cache air quality data
 * @param {string} location - Location name
 * @param {Object} data - Air quality data to cache
 */
async function cacheAirQuality(location, data) {
  try {
    await supabase
      .from(TABLES.AIR_QUALITY_CACHE)
      .insert({
        location: location.toLowerCase(),
        data: data,
        created_at: new Date().toISOString()
      });
      
  } catch (error) {
    console.error('Cache storage failed:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Check if data is fresh within given minutes
 * @param {string} timestamp - ISO timestamp
 * @param {number} minutes - Minutes to consider fresh
 * @returns {boolean} True if data is fresh
 */
function isDataFresh(timestamp, minutes) {
  const now = new Date();
  const dataTime = new Date(timestamp);
  const diffMinutes = (now - dataTime) / (1000 * 60);
  
  return diffMinutes < minutes;
}

/**
 * AI Chat Integration
 */

const AI_CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';
const AI_API_KEY = 'your-openai-api-key';

/**
 * Send message to AI chat
 * @param {string} message - User message
 * @param {Array} context - Previous conversation context
 * @returns {Promise<string>} AI response
 */
export async function sendChatMessage(message, context = []) {
  try {
    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant specializing in asthma and respiratory health. 
        Provide accurate, helpful information while always recommending users consult healthcare professionals for medical advice. 
        Keep responses conversational and supportive. If asked about emergencies, always advise calling emergency services.`
      },
      ...context,
      {
        role: 'user',
        content: message
      }
    ];

    // For demo purposes, simulate AI response
    const response = await simulateAIResponse(message);
    
    // Save chat history
    await saveChatMessage(message, response);
    
    return response;
    
  } catch (error) {
    console.error('❌ AI chat failed:', error);
    throw new Error('Sorry, I encountered an error. Please try again.');
  }
}

/**
 * Simulate AI response (for demo purposes)
 * @param {string} message - User message
 * @returns {Promise<string>} Simulated AI response
 */
async function simulateAIResponse(message) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lowerMessage = message.toLowerCase();
  
  // Predefined responses based on keywords
  if (lowerMessage.includes('emergency') || lowerMessage.includes('can\'t breathe') || lowerMessage.includes('severe')) {
    return "🚨 This sounds like a medical emergency. Please call 911 or your local emergency services immediately. Don't wait - severe breathing difficulties require immediate medical attention.";
  }
  
  if (lowerMessage.includes('inhaler') || lowerMessage.includes('medication')) {
    return "For inhaler and medication questions, it's important to follow your doctor's prescribed instructions. If you're experiencing issues with your current medication or need adjustments, please contact your healthcare provider. Never stop or change medications without medical guidance.";
  }
  
  if (lowerMessage.includes('trigger') || lowerMessage.includes('allergen')) {
    return "Common asthma triggers include dust mites, pet dander, pollen, smoke, cold air, and strong odors. Keeping a trigger diary can help identify your specific triggers. Consider using air purifiers, regular cleaning, and avoiding known irritants when possible.";
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('activity')) {
    return "Exercise-induced asthma is manageable! Warm up gradually, consider using your rescue inhaler before exercise if recommended by your doctor, and choose activities like swimming which are often better tolerated. Always have your rescue inhaler available during physical activity.";
  }
  
  if (lowerMessage.includes('air quality') || lowerMessage.includes('pollution')) {
    return "Poor air quality can definitely trigger asthma symptoms. Check daily air quality reports, limit outdoor activities on high pollution days, keep windows closed during poor air quality periods, and consider using air purifiers indoors. Our air quality monitor can help you stay informed!";
  }
  
  if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety')) {
    return "Stress and anxiety can indeed trigger asthma symptoms. Practice relaxation techniques like deep breathing exercises, meditation, or yoga. Maintaining a regular sleep schedule and staying connected with support networks also helps. If stress is a major trigger, consider speaking with a counselor.";
  }
  
  if (lowerMessage.includes('diet') || lowerMessage.includes('food')) {
    return "While food allergies can trigger asthma in some people, maintaining a healthy diet supports overall respiratory health. Foods rich in omega-3 fatty acids, antioxidants, and vitamin D may be beneficial. If you suspect food triggers, keep a food diary and discuss with your healthcare provider.";
  }
  
  // Default response
  return "Thank you for your question about asthma management. While I can provide general information, it's important to work closely with your healthcare provider for personalized advice. Is there a specific aspect of asthma management you'd like to know more about? I'm here to help with general guidance and support.";
}

/**
 * Save chat message to database
 * @param {string} userMessage - User message
 * @param {string} aiResponse - AI response
 */
async function saveChatMessage(userMessage, aiResponse) {
  try {
    const user = supabase.auth.getUser();
    
    await supabase
      .from(TABLES.CHAT_HISTORY)
      .insert({
        user_id: user?.data?.user?.id || null,
        user_message: userMessage,
        ai_response: aiResponse,
        created_at: new Date().toISOString()
      });
      
  } catch (error) {
    console.error('Failed to save chat history:', error);
    // Don't throw - saving chat is not critical
  }
}

/**
 * Get chat history for user
 * @param {number} limit - Maximum number of messages
 * @returns {Promise<Array>} Chat history
 */
export async function getChatHistory(limit = 50) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from(TABLES.CHAT_HISTORY)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return [];
  }
}

/**
 * Health Reports API
 */

/**
 * Upload health report
 * @param {File} file - File to upload
 * @param {Object} metadata - Report metadata
 * @returns {Promise<Object>} Upload result
 */
export async function uploadHealthReport(file, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.HEALTH_REPORTS)
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.HEALTH_REPORTS)
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: reportData, error: dbError } = await supabase
      .from(TABLES.HEALTH_REPORTS)
      .insert({
        user_id: user.id,
        filename: metadata.filename || file.name,
        original_filename: file.name,
        file_path: fileName,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        document_type: metadata.type,
        notes: metadata.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(STORAGE_BUCKETS.HEALTH_REPORTS)
        .remove([fileName]);
      throw dbError;
    }

    console.log('✅ Health report uploaded successfully');
    return { data: reportData, error: null };
    
  } catch (error) {
    console.error('❌ Health report upload failed:', error);
    return { data: null, error };
  }
}

/**
 * Get health reports for user
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Health reports
 */
export async function getHealthReports(filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from(TABLES.HEALTH_REPORTS)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('document_type', filters.type);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch health reports:', error);
    throw error;
  }
}

/**
 * Delete health report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Delete result
 */
export async function deleteHealthReport(reportId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get report details first
    const { data: report, error: fetchError } = await supabase
      .from(TABLES.HEALTH_REPORTS)
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKETS.HEALTH_REPORTS)
      .remove([report.file_path]);

    if (storageError) {
      console.error('Storage delete failed:', storageError);
      // Continue with database delete even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from(TABLES.HEALTH_REPORTS)
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (dbError) {
      throw dbError;
    }

    console.log('✅ Health report deleted successfully');
    return { error: null };
    
  } catch (error) {
    console.error('❌ Health report delete failed:', error);
    return { error };
  }
}

/**
 * Appointments API
 */

/**
 * Book appointment
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<Object>} Booking result
 */
export async function bookAppointment(appointmentData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .insert({
        user_id: user.id,
        doctor_id: appointmentData.doctor,
        appointment_type: appointmentData.type,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        reason: appointmentData.reason,
        priority: appointmentData.priority,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send confirmation email (simulate)
    console.log('📧 Appointment confirmation email would be sent');

    console.log('✅ Appointment booked successfully');
    return { data, error: null };
    
  } catch (error) {console.error('❌ Appointment booking failed:', error);
    return { data: null, error };
  }
}

/**
 * Get appointments for user
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Appointments
 */
export async function getAppointments(filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from(TABLES.APPOINTMENTS)
      .select('*')
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('appointment_date', today);
    }

    if (filters.past) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('appointment_date', today);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    throw error;
  }
}

/**
 * Cancel appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object>} Cancel result
 */
export async function cancelAppointment(appointmentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Appointment cancelled successfully');
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Appointment cancellation failed:', error);
    return { data: null, error };
  }
}

/**
 * Reschedule appointment
 * @param {string} appointmentId - Appointment ID
 * @param {Object} newDateTime - New date and time
 * @returns {Promise<Object>} Reschedule result
 */
export async function rescheduleAppointment(appointmentId, newDateTime) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.APPOINTMENTS)
      .update({
        appointment_date: newDateTime.date,
        appointment_time: newDateTime.time,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Appointment rescheduled successfully');
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Appointment rescheduling failed:', error);
    return { data: null, error };
  }
}

/**
 * Symptom Tracking API
 */

/**
 * Log symptom entry
 * @param {Object} symptomData - Symptom details
 * @returns {Promise<Object>} Log result
 */
export async function logSymptom(symptomData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.SYMPTOMS)
      .insert({
        user_id: user.id,
        symptom_type: symptomData.type,
        severity: symptomData.severity,
        triggers: symptomData.triggers || [],
        medications_used: symptomData.medications || [],
        notes: symptomData.notes,
        recorded_at: symptomData.timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Symptom logged successfully');
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Symptom logging failed:', error);
    return { data: null, error };
  }
}

/**
 * Get symptom history
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Symptom history
 */
export async function getSymptomHistory(filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from(TABLES.SYMPTOMS)
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });

    // Apply date range filter
    if (filters.startDate) {
      query = query.gte('recorded_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('recorded_at', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch symptom history:', error);
    throw error;
  }
}

/**
 * Medication Tracking API
 */

/**
 * Log medication usage
 * @param {Object} medicationData - Medication details
 * @returns {Promise<Object>} Log result
 */
export async function logMedicationUsage(medicationData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.MEDICATIONS)
      .insert({
        user_id: user.id,
        medication_name: medicationData.name,
        dosage: medicationData.dosage,
        medication_type: medicationData.type,
        taken_at: medicationData.timestamp || new Date().toISOString(),
        notes: medicationData.notes
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Medication usage logged successfully');
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Medication logging failed:', error);
    return { data: null, error };
  }
}

/**
 * Get medication history
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Medication history
 */
export async function getMedicationHistory(filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from(TABLES.MEDICATIONS)
      .select('*')
      .eq('user_id', user.id)
      .order('taken_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch medication history:', error);
    throw error;
  }
}

/**
 * Emergency Contacts API
 */

/**
 * Add emergency contact
 * @param {Object} contactData - Contact details
 * @returns {Promise<Object>} Add result
 */
export async function addEmergencyContact(contactData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.EMERGENCY_CONTACTS)
      .insert({
        user_id: user.id,
        name: contactData.name,
        relationship: contactData.relationship,
        phone_number: contactData.phone,
        email: contactData.email,
        is_primary: contactData.isPrimary || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Emergency contact added successfully');
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Emergency contact addition failed:', error);
    return { data: null, error };
  }
}

/**
 * Get emergency contacts
 * @returns {Promise<Array>} Emergency contacts
 */
export async function getEmergencyContacts() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from(TABLES.EMERGENCY_CONTACTS)
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
    
  } catch (error) {
    console.error('Failed to fetch emergency contacts:', error);
    throw error;
  }
}

/**
 * Utility Functions
 */

/**
 * Generate health report summary
 * @param {Array} reports - Health reports
 * @returns {Object} Report summary
 */
export function generateHealthReportSummary(reports) {
  const summary = {
    totalReports: reports.length,
    byType: {},
    recentUploads: reports.slice(0, 5),
    storageUsed: 0
  };

  reports.forEach(report => {
    // Count by type
    summary.byType[report.document_type] = (summary.byType[report.document_type] || 0) + 1;
    
    // Calculate storage used
    summary.storageUsed += report.file_size || 0;
  });

  return summary;
}

/**
 * Calculate asthma control score
 * @param {Array} symptoms - Recent symptoms
 * @param {Array} medications - Recent medication usage
 * @returns {Object} Control score and recommendations
 */
export function calculateAsthmaControlScore(symptoms, medications) {
  if (!symptoms.length) {
    return {
      score: 100,
      level: 'Well Controlled',
      recommendations: ['Continue current management plan', 'Regular check-ups with healthcare provider']
    };
  }

  let totalScore = 100;
  const recentSymptoms = symptoms.filter(s => {
    const daysDiff = (new Date() - new Date(s.recorded_at)) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7; // Last 7 days
  });

  // Deduct points based on symptoms
  recentSymptoms.forEach(symptom => {
    totalScore -= symptom.severity * 5; // 5 points per severity level
  });

  // Determine control level and recommendations
  let level, recommendations;
  
  if (totalScore >= 80) {
    level = 'Well Controlled';
    recommendations = [
      'Continue current management plan',
      'Monitor for any changes in symptoms',
      'Regular check-ups with healthcare provider'
    ];
  } else if (totalScore >= 60) {
    level = 'Partly Controlled';
    recommendations = [
      'Review medication adherence',
      'Identify and avoid triggers',
      'Consider adjusting treatment plan with doctor'
    ];
  } else {
    level = 'Poorly Controlled';
    recommendations = [
      'Schedule urgent appointment with healthcare provider',
      'Review and update asthma action plan',
      'Ensure rescue medications are accessible',
      'Consider step-up therapy'
    ];
  }

  return {
    score: Math.max(0, totalScore),
    level,
    recommendations
  };
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid
 */
export function isValidPhoneNumber(phone) {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get air quality color coding
 * @param {number} aqi - Air Quality Index
 * @returns {Object} Color and status information
 */
export function getAirQualityColor(aqi) {
  if (aqi <= 1) {
    return { color: 'green', status: 'Good', description: 'Air quality is satisfactory' };
  } else if (aqi <= 2) {
    return { color: 'yellow', status: 'Moderate', description: 'Acceptable for most people' };
  } else if (aqi <= 3) {
    return { color: 'orange', status: 'Unhealthy for Sensitive Groups', description: 'May cause issues for sensitive individuals' };
  } else if (aqi <= 4) {
    return { color: 'red', status: 'Unhealthy', description: 'Health warnings for everyone' };
  } else {
    return { color: 'purple', status: 'Very Unhealthy', description: 'Emergency conditions' };
  }
}

/**
 * Generate appointment reminder
 * @param {Object} appointment - Appointment details
 * @returns {Object} Reminder information
 */
export function generateAppointmentReminder(appointment) {
  const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const now = new Date();
  const timeDiff = appointmentDate - now;
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  
  let reminderType = 'none';
  let message = '';
  
  if (hoursDiff <= 24 && hoursDiff > 0) {
    reminderType = 'urgent';
    message = `Appointment reminder: You have an appointment with ${appointment.doctor_name || 'your doctor'} tomorrow at ${appointment.appointment_time}`;
  } else if (hoursDiff <= 72 && hoursDiff > 24) {
    reminderType = 'upcoming';
    message = `Upcoming appointment: You have an appointment with ${appointment.doctor_name || 'your doctor'} in ${Math.ceil(hoursDiff / 24)} days`;
  }
  
  return { type: reminderType, message };
}

/**
 * Export user data for backup
 * @returns {Promise<Object>} User data backup
 */
export async function exportUserData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all user data
    const [
      profile,
      healthReports,
      appointments,
      symptoms,
      medications,
      emergencyContacts,
      chatHistory
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from(TABLES.HEALTH_REPORTS).select('*').eq('user_id', user.id),
      supabase.from(TABLES.APPOINTMENTS).select('*').eq('user_id', user.id),
      supabase.from(TABLES.SYMPTOMS).select('*').eq('user_id', user.id),
      supabase.from(TABLES.MEDICATIONS).select('*').eq('user_id', user.id),
      supabase.from(TABLES.EMERGENCY_CONTACTS).select('*').eq('user_id', user.id),
      supabase.from(TABLES.CHAT_HISTORY).select('*').eq('user_id', user.id)
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      profile: profile.data,
      healthReports: healthReports.data || [],
      appointments: appointments.data || [],
      symptoms: symptoms.data || [],
      medications: medications.data || [],
      emergencyContacts: emergencyContacts.data || [],
      chatHistory: chatHistory.data || []
    };

    console.log('✅ User data exported successfully');
    return { data: backup, error: null };
    
  } catch (error) {
    console.error('❌ Data export failed:', error);
    return { data: null, error };
  }
}

/**
 * Health insights generator
 * @param {Object} userData - User's health data
 * @returns {Object} Health insights and recommendations
 */
export function generateHealthInsights(userData) {
  const insights = {
    trends: [],
    recommendations: [],
    alerts: [],
    summary: {}
  };

  // Analyze symptom trends
  if (userData.symptoms && userData.symptoms.length > 0) {
    const recentSymptoms = userData.symptoms.filter(s => {
      const daysDiff = (new Date() - new Date(s.recorded_at)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    if (recentSymptoms.length > 0) {
      const avgSeverity = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
      
      if (avgSeverity > 3) {
        insights.alerts.push('High average symptom severity detected in the past month');
        insights.recommendations.push('Consider consulting with your healthcare provider about treatment adjustments');
      }

      insights.summary.avgSeverity = avgSeverity.toFixed(1);
      insights.summary.symptomCount = recentSymptoms.length;
    }
  }

  // Analyze medication adherence
  if (userData.medications && userData.medications.length > 0) {
    const medicationFrequency = userData.medications.reduce((freq, med) => {
      freq[med.medication_name] = (freq[med.medication_name] || 0) + 1;
      return freq;
    }, {});

    insights.summary.medicationTypes = Object.keys(medicationFrequency).length;
    insights.summary.totalMedications = userData.medications.length;
  }

  // Check appointment patterns
  if (userData.appointments && userData.appointments.length > 0) {
    const upcomingAppointments = userData.appointments.filter(apt => 
      new Date(apt.appointment_date) > new Date()
    );

    if (upcomingAppointments.length === 0) {
      insights.recommendations.push('Consider scheduling a routine check-up with your healthcare provider');
    }

    insights.summary.totalAppointments = userData.appointments.length;
    insights.summary.upcomingAppointments = upcomingAppointments.length;
  }

  return insights;
}

// Default export with all API functions
export default {
  // Air Quality
  checkAirQuality,
  
  // AI Chat
  sendChatMessage,
  getChatHistory,
  
  // Health Reports
  uploadHealthReport,
  getHealthReports,
  deleteHealthReport,
  
  // Appointments
  bookAppointment,
  getAppointments,
  cancelAppointment,
  rescheduleAppointment,
  
  // Symptom Tracking
  logSymptom,
  getSymptomHistory,
  
  // Medication Tracking
  logMedicationUsage,
  getMedicationHistory,
  
  // Emergency Contacts
  addEmergencyContact,
  getEmergencyContacts,
  
  // Utilities
  generateHealthReportSummary,
  calculateAsthmaControlScore,
  formatFileSize,
  isValidPhoneNumber,
  isValidEmail,
  getAirQualityColor,
  generateAppointmentReminder,
  exportUserData,
  generateHealthInsights
};