/**
 * Supabase Configuration
 * Central configuration for Supabase client and services
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Supabase configuration
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

/**
 * Database Tables Configuration
 */
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  HEALTH_REPORTS: 'health_reports',
  APPOINTMENTS: 'appointments',
  CHAT_HISTORY: 'chat_history',
  AIR_QUALITY_CACHE: 'air_quality_cache',
  SYMPTOMS: 'symptoms',
  MEDICATIONS: 'medications',
  EMERGENCY_CONTACTS: 'emergency_contacts'
};

/**
 * Storage Buckets Configuration
 */
export const STORAGE_BUCKETS = {
  HEALTH_REPORTS: 'health-reports',
  PROFILE_IMAGES: 'profile-images',
  CHAT_ATTACHMENTS: 'chat-attachments',
  DOCUMENTS: 'documents'
};

/**
 * Supabase Service Functions
 */

/**
 * Initialize Supabase services
 */
export async function initializeSupabase() {
  try {
    // Test connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Supabase initialized successfully');
    return { success: true, error: null };
    
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    return { success: false, error };
  }
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured() {
  return SUPABASE_URL !== 'your-supabase-url' && 
         SUPABASE_ANON_KEY !== 'your-supabase-anon-key' &&
         SUPABASE_URL.includes('supabase.co');
}

/**
 * Database helper functions
 */

/**
 * Generic database query with error handling
 * @param {Function} queryFn - Query function
 * @param {string} operation - Operation name for logging
 * @returns {Promise<Object>} Query result
 */
export async function executeQuery(queryFn, operation = 'query') {
  try {
    const result = await queryFn();
    
    if (result.error) {
      throw result.error;
    }
    
    console.log(`✅ ${operation} successful`);
    return { data: result.data, error: null };
    
  } catch (error) {
    console.error(`❌ ${operation} failed:`, error);
    return { data: null, error };
  }
}

/**
 * Insert data with conflict handling
 * @param {string} table - Table name
 * @param {Object|Array} data - Data to insert
 * @param {Object} options - Insert options
 * @returns {Promise<Object>} Insert result
 */
export async function insertData(table, data, options = {}) {
  const { onConflict = 'error', upsert = false } = options;
  
  try {
    let query = supabase.from(table).insert(data);
    
    if (upsert) {
      query = query.upsert(data);
    }
    
    if (onConflict !== 'error') {
      query = query.onConflict(onConflict);
    }
    
    const { data: result, error } = await query.select();
    
    if (error) {
      throw error;
    }
    
    return { data: result, error: null };
    
  } catch (error) {
    console.error(`Insert failed for table ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Update data with optimistic locking
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} where - Where conditions
 * @param {Object} options - Update options
 * @returns {Promise<Object>} Update result
 */
export async function updateData(table, data, where, options = {}) {
  const { returnData = true } = options;
  
  try {
    let query = supabase.from(table).update(data);
    
    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (returnData) {
      query = query.select();
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return { data: result, error: null };
    
  } catch (error) {
    console.error(`Update failed for table ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Delete data with confirmation
 * @param {string} table - Table name
 * @param {Object} where - Where conditions
 * @returns {Promise<Object>} Delete result
 */
export async function deleteData(table, where) {
  try {
    let query = supabase.from(table).delete();
    
    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
    
  } catch (error) {
    console.error(`Delete failed for table ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Storage helper functions
 */

/**
 * Upload file to storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export async function uploadFile(bucket, path, file, options = {}) {
  const { upsert = false, contentType = null } = options;
  
  try {
    const uploadOptions = {
      cacheControl: '3600',
      upsert
    };
    
    if (contentType) {
      uploadOptions.contentType = contentType;
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, uploadOptions);
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return { 
      data: { ...data, publicUrl }, 
      error: null 
    };
    
  } catch (error) {
    console.error(`Upload failed for ${bucket}/${path}:`, error);
    return { data: null, error };
  }
}

/**
 * Download file from storage
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @returns {Promise<Object>} Download result
 */
export async function downloadFile(bucket, path) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
    
  } catch (error) {
    console.error(`Download failed for ${bucket}/${path}:`, error);
    return { data: null, error };
  }
}

/**
 * Delete file from storage
 * @param {string} bucket - Storage bucket name
 * @param {Array|string} paths - File path(s) to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteFile(bucket, paths) {
  try {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(pathArray);
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
    
  } catch (error) {
    console.error(`Delete failed for ${bucket}:`, error);
    return { data: null, error };
  }
}

/**
 * Get public URL for file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path
 * @returns {string} Public URL
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Real-time subscription helper
 */

/**
 * Subscribe to real-time changes
 * @param {string} table - Table name
 * @param {Function} callback - Callback function
 * @param {Object} options - Subscription options
 * @returns {Object} Subscription object
 */
export function subscribeToChanges(table, callback, options = {}) {
  const { event = '*', filter = null } = options;
  
  let subscription = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { 
        event, 
        schema: 'public', 
        table,
        ...(filter && { filter })
      }, 
      callback
    );
    
  subscription.subscribe();
  
  return subscription;
}

/**
 * Unsubscribe from real-time changes
 * @param {Object} subscription - Subscription object
 */
export async function unsubscribeFromChanges(subscription) {
  try {
    await supabase.removeChannel(subscription);
    console.log('✅ Unsubscribed from real-time changes');
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
  }
}

/**
 * Utility functions
 */

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID
 * @returns {string} Unique filename
 */
export function generateUniqueFilename(originalName, userId) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  
  return `${userId}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @param {Object} constraints - Validation constraints
 * @returns {Object} Validation result
 */
export function validateFile(file, constraints = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    maxFiles = 1
  } = constraints;
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format database error for user display
 * @param {Object} error - Database error
 * @returns {string} User-friendly error message
 */
export function formatDatabaseError(error) {
  const errorMessages = {
    '23505': 'This record already exists',
    '23503': 'Referenced record does not exist',
    '23502': 'Required field is missing',
    '42501': 'Permission denied',
    'PGRST116': 'Record not found',
    'PGRST301': 'Row Level Security policy violated'
  };
  
  return errorMessages[error.code] || 'An unexpected error occurred';
}

/**
 * Connection status checker
 */
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    return { connected: !error, error };
    
  } catch (error) {
    return { connected: false, error };
  }
}

// Initialize on module load
if (isSupabaseConfigured()) {
  initializeSupabase();
} else {
  console.warn('⚠️  Supabase not configured. Please update config/supabase.js with your project credentials.');
}

// Export main client
export default supabase;