/**
 * Authentication Manager - Handles all authentication operations
 * Integrates with Supabase Auth for user management
 */

import { supabase } from '../config/supabase.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authCallbacks = [];
    this.initialized = false;
    
    this.init();
  }

  /**
   * Initialize authentication manager
   */
  async init() {
    try{
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        this.currentUser = session?.user || null;
      }

      // Listen to auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        this.currentUser = session?.user || null;
        
        // Notify all callbacks
        this.authCallbacks.forEach(callback => {
          try {
            callback(this.currentUser, event);
          } catch (error) {
            console.error('Error in auth callback:', error);
          }
        });
        
        // Update navbar auth state
        if (window.updateNavbarAuth) {
          window.updateNavbarAuth(this.currentUser);
        }
      });

      this.initialized = true;
      console.log('✅ AuthManager initialized');
      
      // Make auth manager globally available
      window.authManager = this;
      
    } catch (error) {
      console.error('Failed to initialize AuthManager:', error);
    }
  }

  /**
   * Register callback for auth state changes
   * @param {Function} callback - Callback function (user, event) => void
   */
  onAuthStateChange(callback) {
    this.authCallbacks.push(callback);
    
    // Call immediately with current state
    if (this.initialized) {
      callback(this.currentUser, 'INITIAL_SESSION');
    }
  }

  /**
   * Remove auth state change callback
   * @param {Function} callback - Callback function to remove
   */
  removeAuthStateCallback(callback) {
    const index = this.authCallbacks.indexOf(callback);
    if (index > -1) {
      this.authCallbacks.splice(index, 1);
    }
  }

  /**
   * Get current authenticated user
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Sign up new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Additional user metadata
   * @returns {Promise<Object>} Sign up result
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ User signed up:', data.user?.email);
      
      // Create user profile
      if (data.user) {
        await this.createUserProfile(data.user, metadata);
      }

      return { data, error: null };
      
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Sign in result
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      console.log('✅ User signed in:', data.user?.email);
      return { data, error: null };
      
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} Sign in result
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
      
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign in with GitHub
   * @returns {Promise<Object>} Sign in result
   */
  async signInWithGitHub() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
      
    } catch (error) {
      console.error('GitHub sign in error:', error);
      return { data: null, error };
    }
  }

  /**
   * Sign out user
   * @returns {Promise<Object>} Sign out result
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log('✅ User signed out');
      return { error: null };
      
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<Object>} Reset password result
   */
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password reset email sent');
      return { data, error: null };
      
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password updated');
      return { data, error: null };
      
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        throw error;
      }

      console.log('✅ Profile updated');
      return { data, error: null };
      
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  }

  /**
   * Create user profile in database
   * @param {Object} user - User object from auth
   * @param {Object} metadata - Additional metadata
   */
  async createUserProfile(user, metadata = {}) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: metadata.full_name,
          age_group: metadata.age_group,
          gender: metadata.gender,
          asthma_severity: metadata.asthma_severity,
          created_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      console.log('✅ User profile created');
      
    } catch (error) {
      console.error('Create profile error:', error);
      // Don't throw - profile creation is not critical for auth flow
    }
  }

  /**
   * Get user profile from database
   * @returns {Promise<Object|null>} User profile or null
   */
  async getUserProfile() {
    if (!this.currentUser) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore not found errors
        throw error;
      }

      return data;
      
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile in database
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Update result
   */
  async updateUserProfile(updates) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUser.id)
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ User profile updated');
      return { data, error: null };
      
    } catch (error) {
      console.error('Update user profile error:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user has required permissions
   * @param {string|Array} requiredRoles - Required role(s)
   * @returns {boolean} True if user has permission
   */
  hasPermission(requiredRoles) {
    if (!this.currentUser) {
      return false;
    }

    const userRole = this.currentUser.user_metadata?.role || 'user';
    
    if (typeof requiredRoles === 'string') {
      return userRole === requiredRoles;
    }
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(userRole);
    }
    
    return false;
  }

  /**
   * Require authentication - redirect to login if not authenticated
   * @param {string} redirectUrl - URL to redirect to after login
   */
  requireAuth(redirectUrl = null) {
    if (!this.isAuthenticated()) {
      const returnUrl = redirectUrl || window.location.href;
      const loginUrl = `login.html?redirect=${encodeURIComponent(returnUrl)}`;
      window.location.href = loginUrl;
      return false;
    }
    return true;
  }

  /**
   * Handle authentication redirects
   */
  handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    if (redirectUrl && this.isAuthenticated()) {
      window.location.href = decodeURIComponent(redirectUrl);
    }
  }

  /**
   * Get authentication token
   * @returns {Promise<string|null>} JWT token or null
   */
  async getToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication session
   * @returns {Promise<Object>} Refresh result
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Session refreshed');
      return { data, error: null };
      
    } catch (error) {
      console.error('Refresh session error:', error);
      return { data: null, error };
    }
  }
}

// Export default instance
export default new AuthManager();