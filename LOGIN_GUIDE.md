# Authentication & Role-Based Login Guide

## System Overview

The Innonsh TinySteps system supports **4 user roles** with different dashboards and permissions:

1. **Admin** → `/dashboard`
2. **Teacher** → `/teacher-dashboard`
3. **Parent** → `/parent-dashboard`
4. **Student** → `/student-dashboard`

---

## User Authentication Flow

### 1. Login Endpoint
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "admin"  // optional - for role selection
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

**Features:**
- ✅ Password hashed with bcryptjs
- ✅ JWT token generated (7 day expiry)
- ✅ Token stored as HttpOnly cookie (secure, CSRF protected)
- ✅ Token verified on every protected route via middleware

---

## Login Instructions by Role

### ADMIN LOGIN
1. Go to: `http://localhost:3000/auth/login`
2. Select Role: **"Admin"** from dropdown
3. Enter Email: `admin@school.com`
4. Enter Password: `admin123`
5. Click **Login**
6. **Redirects to:** `/dashboard`
7. **Access:** All admin features (students, teachers, exams, fees, etc.)

**Create Admin User (First Time Setup):**
```javascript
// Run in Node.js or API client
const axios = require('axios');

axios.post('http://localhost:3000/api/auth/register', {
  name: 'Admin User',
  email: 'admin@school.com',
  password: 'admin123',
  role: 'admin'
})
.then(res => console.log(res.data))
.catch(err => console.log(err.response.data));
```

---

### TEACHER LOGIN
1. Go to: `http://localhost:3000/auth/login`
2. Select Role: **"Teacher"** from dropdown
3. Enter Email: `teacher@school.com`
4. Enter Password: `teacher123`
5. Click **Login**
6. **Redirects to:** `/teacher-dashboard`
7. **Access:** 
   - View assigned classes
   - Mark attendance
   - View timetable
   - Check exam schedules
   - Submit grades

**Create Teacher User:**
```javascript
axios.post('http://localhost:3000/api/auth/register', {
  name: 'Mr. John Smith',
  email: 'john.smith@school.com',
  password: 'teacher123',
  role: 'teacher'
});
```

---

### PARENT LOGIN
1. Go to: `http://localhost:3000/auth/login`
2. Select Role: **"Parent"** from dropdown
3. Enter Email: `parent@email.com`
4. Enter Password: `parent123`
5. Click **Login**
6. **Redirects to:** `/parent-dashboard`
7. **Access:**
   - View child's attendance
   - Check exam results
   - View fee status & payment
   - Read announcements
   - View class photos/gallery
   - Access timetable

**Create Parent User:**
```javascript
axios.post('http://localhost:3000/api/auth/register', {
  name: 'Mrs. Sarah Johnson',
  email: 'sarah.johnson@email.com',
  password: 'parent123',
  role: 'parent'
});
```

---

### STUDENT LOGIN
1. Go to: `http://localhost:3000/auth/login`
2. Select Role: **"Student"** from dropdown
3. Enter Email: `student@school.com`
4. Enter Password: `student123`
5. Click **Login**
6. **Redirects to:** `/student-dashboard`
7. **Access:**
   - View personal attendance
   - Check exam schedule & results
   - View timetable
   - Access class assignments
   - View grades
   - Check announcements

**Create Student User:**
```javascript
axios.post('http://localhost:3000/api/auth/register', {
  name: 'Rahul Kumar',
  email: 'rahul.kumar@school.com',
  password: 'student123',
  role: 'student',
  studentId: 'student_mongodb_id' // Link to Student record
});
```

---

## Database Schema for Users

### User Model Structure
```typescript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "admin" | "teacher" | "parent" | "student",
  studentId: ObjectId (ref: Student), // if role = student
  parentId: ObjectId (ref: Parent),   // if role = parent
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication Token

### JWT Token Structure
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
{
  "id": "user_mongodb_id",
  "role": "teacher",
  "iat": 1702296000,
  "exp": 1702900800  // 7 days
}
```

### Token Storage
- **Location:** HttpOnly Cookie (secure)
- **Name:** `token`
- **Path:** `/`
- **Max-Age:** 604800 seconds (7 days)
- **SameSite:** Lax (CSRF protection)
- **Secure:** true (only in HTTPS production)

### How It Works
1. User logs in with email & password
2. Backend verifies credentials
3. JWT token created with user ID & role
4. Token stored in HttpOnly cookie (not accessible to JavaScript)
5. Every request includes cookie with token
6. Middleware validates token on protected routes
7. If token invalid/expired → redirect to `/auth/login`

---

## Protected Routes (Require Authentication)

### Middleware Routes
The middleware protects these paths (checks for valid JWT token):

- `/dashboard/*` - Admin routes
- `/teacher-dashboard/*` - Teacher routes
- `/student-dashboard/*` - Student routes
- `/parent-dashboard/*` - Parent routes

### Public Routes (No Authentication)
```
/auth/login
/auth/register
/auth/forgot-password
/ (home page)
```

---

## Role-Based Access Control (RBAC)

### Permission Levels

**Admin:** Can access all modules
```
- Students management
- Teachers management
- Classes management
- Attendance
- Exams
- Fees
- Timetable
- Events
- Transport
- Meal Plans
- Gallery
- Settings
```

**Teacher:** Limited to assigned class features
```
- View own assigned classes
- Mark attendance for class
- View timetable
- Submit grades/marks
- View exam schedules
- Create assignments
```

**Parent:** View-only access to child's data
```
- Child's attendance
- Exam results & schedule
- Fee status & payment history
- Announcements
- Gallery photos
- Timetable
```

**Student:** Personal data access
```
- Own attendance
- Exam schedule & results
- Grades
- Timetable
- Assignments
- Announcements
```

---

## Testing Login Flows

### Using Postman/cURL

**1. Login as Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123"
  }'
```

**2. Login as Teacher:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "teacher123"
  }'
```

**3. Login as Parent:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@email.com",
    "password": "parent123"
  }'
```

**4. Login as Student:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@school.com",
    "password": "student123"
  }'
```

---

## Session Management

### How Sessions Work
1. **Login:** User credentials verified → JWT token generated → stored in cookie
2. **Authenticated Requests:** Cookie automatically sent with every request
3. **Middleware Check:** Token validated, user allowed/denied access
4. **Logout:** Cookie deleted, user redirected to login
5. **Token Expiry:** After 7 days, user must login again

### Cookie Management
```typescript
// Set on login (automatic)
res.cookies.set("token", jwtToken, {
  httpOnly: true,
  path: "/",
  maxAge: 604800,
  sameSite: "lax",
  secure: isProduction
});

// Clear on logout
res.cookies.delete("token");
```

---

## Common Issues & Solutions

### Issue 1: "Invalid email" error
- **Cause:** User email doesn't exist in database
- **Solution:** Create user first with register endpoint or admin panel

### Issue 2: "Invalid password" error
- **Cause:** Password doesn't match stored hash
- **Solution:** Verify password, reset if needed

### Issue 3: Redirect to login after successful auth
- **Cause:** Token not being set as cookie properly
- **Solution:** 
  - Check `credentials: "include"` in fetch
  - Verify cookies enabled in browser
  - Check middleware whitelist includes your route

### Issue 4: Can't access dashboard after login
- **Cause:** Token expired or invalid
- **Solution:** Log out, clear cookies, login again

### Issue 5: Role mismatch - login but wrong dashboard
- **Cause:** `role` field in JWT doesn't match expected role
- **Solution:** Verify role in User document, update login response

---

## Quick Setup Checklist

- [ ] Create Admin user via API or seed script
- [ ] Create Teacher users with school email
- [ ] Create Parent users with personal email
- [ ] Create Student users and link to Student records
- [ ] Test login with each role
- [ ] Verify redirection to correct dashboard
- [ ] Check protected routes require authentication
- [ ] Test logout clears session
- [ ] Verify token expires after 7 days

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |

---

## Environment Variables Required

```env
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb+srv://...
NODE_ENV=development|production
```

---

## Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT token with 7-day expiry
- HttpOnly cookies (prevents XSS attacks)
- SameSite=Lax (prevents CSRF)
- Token validated on every protected route
- Role-based access control on API routes

⚠️ **Production Recommendations:**
- Use HTTPS only (secure flag on cookies)
- Implement rate limiting on login endpoint
- Add account lockout after N failed attempts
- Log authentication events
- Implement refresh token rotation
- Add 2FA for admin accounts
