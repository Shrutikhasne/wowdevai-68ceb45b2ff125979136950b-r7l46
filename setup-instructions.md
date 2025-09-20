# 🚀 AsthmaCare Setup Instructions

> **Complete step-by-step guide** to set up your AsthmaCare full-stack application with Supabase backend

## 📋 **Overview**

This guide will walk you through setting up AsthmaCare, a complete healthcare management platform with:
- ✅ **User authentication** (email/password + OAuth)
- ✅ **Database integration** with PostgreSQL
- ✅ **File storage** for health documents
- ✅ **Real-time features** with Supabase
- ✅ **AI chat assistant** for health guidance
- ✅ **Air quality monitoring** with external APIs

---

## 🛠️ **Step 1: Environment Setup**

### **System Requirements**
```bash
# Check your versions
node --version    # Should be 16.0.0 or higher
npm --version     # Should be 8.0.0 or higher
```

### **Install Dependencies**
```bash
# Clone the repository
git clone https://github.com/asthmacare/asthmacare-app.git
cd asthmacare-app

# Install dependencies
npm install
```

---

## 🗄️ **Step 2: Supabase Project Setup**

### **2.1 Create Supabase Account**
1. Visit [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### **2.2 Create New Project**
1. Click **"New Project"**
2. Choose your organization (or create one)
3. Fill in project details:
   ```
   Name: AsthmaCare
   Database Password: [Generate strong password]
   Region: [Choose closest to your users]
   ```
4. Click **"Create new project"**
5. ⏱️ **Wait 2-3 minutes** for project initialization

### **2.3 Get Project Credentials**
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOi...`)

---

## ⚙️ **Step 3: Configure Application**

### **3.1 Update Supabase Configuration**
Edit `config/supabase.js`:

```javascript
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**⚠️ Important:** Replace the placeholder values with your actual credentials!

### **3.2 Verify Connection**
```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Check browser console for "✅ Supabase initialized successfully"
```

---

## 🗃️ **Step 4: Database Schema Setup**

### **4.1 Run Database Migrations**
1. Open Supabase Dashboard → **SQL Editor**
2. Copy the **entire contents** of `scripts/utils/database.sql`
3. Paste into the SQL Editor
4. Click **"Run"** to execute all commands

### **4.2 Verify Tables Created**
Go to **Table Editor** and verify these tables exist:
- ✅ `user_profiles`
- ✅ `health_reports` 
- ✅ `appointments`
- ✅ `chat_history`
- ✅ `symptoms`
- ✅ `medications`
- ✅ `emergency_contacts`
- ✅ `air_quality_cache`
- ✅ `doctor_profiles`
- ✅ `notifications`

### **4.3 Check Sample Data**
Verify sample doctors were inserted:
```sql
SELECT * FROM doctor_profiles;
```

You should see 5 sample doctors (Dr. Smith, Dr. Johnson, etc.)

---

## 📁 **Step 5: Storage Setup**

### **5.1 Create Storage Buckets**
1. Go to **Storage** in Supabase Dashboard
2. Click **"Create a new bucket"** for each:
   ```
   Bucket Name: health-reports
   Public: No ❌
   
   Bucket Name: profile-images  
   Public: Yes ✅
   
   Bucket Name: chat-attachments
   Public: No ❌
   
   Bucket Name: documents
   Public: No ❌
   ```

### **5.2 Verify Storage Policies**
Go to **Storage** → **Policies** and verify RLS policies exist for each bucket.

---

## 🔐 **Step 6: Authentication Setup**

### **6.1 Configure Auth Settings**
1. Go to **Authentication** → **Settings**
2. **Site URL:** `http://localhost:3000` (for development)
3. **Redirect URLs:** Add:
   - `http://localhost:3000`
   - `http://localhost:3000/login.html`
   - `http://localhost:3000/signup.html`

### **6.2 Enable OAuth Providers (Optional)**
1. **Google OAuth:**
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Add your Google OAuth credentials

2. **GitHub OAuth:**
   - Enable **GitHub**
   - Add your GitHub OAuth credentials

### **6.3 Email Settings**
1. Go to **Authentication** → **Templates**
2. Customize email templates (optional)
3. Configure SMTP settings (for production)

---

## 🧪 **Step 7: Test Core Features**

### **7.1 Test User Authentication**
1. Visit `http://localhost:3000/signup.html`
2. Create a new user account
3. Check **Authentication** → **Users** in Supabase
4. Verify user appears in dashboard

### **7.2 Test Database Integration**
1. Sign up and log in
2. Try uploading a health report
3. Check **Table Editor** → `health_reports`
4. Verify record was created

### **7.3 Test File Storage**
1. Upload a test file (PDF or image)
2. Go to **Storage** → **health-reports**
3. Verify file was stored

### **7.4 Test Real-time Features**
1. Book an appointment
2. Check **Table Editor** → `appointments`
3. Verify data appears instantly

---

## 🌍 **Step 8: External APIs (Optional)**

### **8.1 Air Quality API**
1. Sign up at [WeatherAPI.com](https://www.weatherapi.com)
2. Get your free API key (1M requests/month)
3. Update `scripts/utils/api.js`:
   ```javascript
   const AIR_QUALITY_API_KEY = 'your-weather-api-key';
   ```

### **8.2 AI Chat API**
1. Sign up at [OpenAI](https://openai.com/api)
2. Get your API key
3. Update `scripts/utils/api.js`:
   ```javascript
   const AI_API_KEY = 'your-openai-api-key';
   ```
   
**Note:** The app works with mock AI responses if no API key is provided.

---

## 🚀 **Step 9: Production Deployment**

### **9.1 Update Production URLs**
1. Update `config/supabase.js` with production URLs
2. Add production domain to Supabase **Authentication** → **Settings**

### **9.2 Deploy Options**

**Netlify (Recommended):**
```bash
# Connect your GitHub repo
# Set build command: npm run build
# Set publish directory: /
```

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Traditional Hosting:**
```bash
# Upload all files to your web server
# Ensure server supports HTML5 history mode
```

---

## 🔒 **Step 10: Security Checklist**

### **Production Security:**
- [ ] Change default passwords
- [ ] Enable 2FA on Supabase account
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and alerts
- [ ] Review and test RLS policies
- [ ] Configure rate limiting
- [ ] Set up backup procedures

### **Data Privacy:**
- [ ] Review HIPAA compliance requirements
- [ ] Configure data retention policies
- [ ] Set up audit logging
- [ ] Test user data export/deletion

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**❌ "Supabase initialization failed"**
```bash
# Check your credentials in config/supabase.js
# Verify project URL and anon key are correct
# Check browser network tab for 401/403 errors
```

**❌ "Database query failed"**
```bash
# Verify database schema was created
# Check Table Editor in Supabase dashboard
# Review RLS policies in Authentication
```

**❌ "File upload failed"**
```bash
# Verify storage buckets exist
# Check storage policies
# Ensure file size is under limits
```

**❌ "Authentication not working"**
```bash
# Check auth configuration in Supabase
# Verify redirect URLs are correct
# Test with different browsers
```

### **Debug Mode:**
```javascript
// Add this to check Supabase connection
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase connected:', await checkConnection());
```

---

## 📞 **Getting Help**

### **Support Channels:**
- 📧 **Email:** support@asthmacare.com
- 💬 **Discord:** [Join our community](https://discord.gg/asthmacare)
- 🐛 **GitHub Issues:** [Report bugs](https://github.com/asthmacare/asthmacare-app/issues)
- 📚 **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

### **Before Asking for Help:**
1. ✅ Check this setup guide
2. ✅ Review error messages in browser console
3. ✅ Verify Supabase dashboard settings
4. ✅ Test with a fresh browser session
5. ✅ Check GitHub issues for similar problems

---

## 📊 **Verification Checklist**

Use this checklist to verify your setup is complete:

### **✅ Basic Setup**
- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Development server starts (`npm run dev`)

### **✅ Supabase Configuration**
- [ ] Supabase project created
- [ ] Project URL and anon key configured
- [ ] Connection verified (green status indicators)

### **✅ Database**
- [ ] Database schema deployed
- [ ] All tables visible in Table Editor
- [ ] Sample data loaded (doctors)
- [ ] RLS policies active

### **✅ Authentication**
- [ ] User registration works
- [ ] User login works  
- [ ] Password reset works
- [ ] User profile created automatically

### **✅ Storage**
- [ ] Storage buckets created
- [ ] File upload works
- [ ] Files visible in Storage dashboard
- [ ] Download/delete works

### **✅ Features**
- [ ] Air quality data displays
- [ ] AI chat responds (mock or real API)
- [ ] Health reports upload/display
- [ ] Appointments can be booked
- [ ] Mobile responsive design

### **✅ Security**
- [ ] RLS policies prevent unauthorized access
- [ ] File uploads restricted to authenticated users
- [ ] User data isolated between accounts

---

## 🎉 **Success!**

If all checkboxes above are complete, congratulations! 🎊 

Your AsthmaCare application is now fully set up with:
- ✅ **Full-stack architecture** with Supabase backend
- ✅ **User authentication** and profile management
- ✅ **Database integration** with PostgreSQL
- ✅ **File storage** for health documents
- ✅ **Real-time features** and notifications
- ✅ **AI-powered health assistant**
- ✅ **Air quality monitoring**
- ✅ **Mobile-responsive design**

---

## 📈 **Next Steps**

### **Customization:**
1. **Brand customization** - Update colors, logos, text
2. **Feature additions** - Add new health tracking features
3. **Integration** - Connect to external health APIs
4. **Localization** - Add multi-language support

### **Scaling:**
1. **Performance optimization** - CDN, caching, image optimization
2. **Monitoring** - Error tracking, analytics, performance monitoring
3. **Backups** - Automated database and storage backups
4. **Team management** - Add additional developers

### **Community:**
1. **Join our Discord** for tips and community support
2. **Star the repository** if this helped you
3. **Share your success** with the community
4. **Contribute improvements** back to the project

---

**🏥 Ready to help people manage their asthma better!**