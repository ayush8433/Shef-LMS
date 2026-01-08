# Zoom Integration Setup Guide

## Overview
This guide explains how to integrate Zoom API with your SHEF LMS to enable automatic Zoom meeting creation and management for live classes.

## Features Implemented
✅ **Automatic Zoom Meeting Creation** - Admin creates a live class, Zoom meeting is auto-generated
✅ **Direct Join Links** - Students click "Join Live Class" and are redirected to Zoom
✅ **Meeting Management** - Update, delete, and track Zoom meetings from admin panel
✅ **Student Tracking** - Track how many students join each session
✅ **Course-Specific Classes** - Filter live classes by student's enrolled course

## Prerequisites
1. A Zoom Pro, Business, or Enterprise account
2. Access to Zoom App Marketplace
3. Your LMS backend must be running

## Step-by-Step Setup

### Step 1: Create Zoom Server-to-Server OAuth App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click **"Develop"** → **"Build App"**
3. Choose **"Server-to-Server OAuth"** app type
4. Fill in the app information:
   - **App Name**: SHEF LMS Integration
   - **Short Description**: LMS integration for live classes
   - **Company Name**: Your Company
   - **Developer Contact**: Your Email

5. Click **"Create"**

### Step 2: Get Your Credentials

After creating the app, you'll see:
- **Account ID**
- **Client ID**
- **Client Secret**

**Important**: Copy these credentials immediately!

### Step 3: Add Required Scopes

In the **"Scopes"** section, add these permissions:
- `meeting:write:admin` - Create and manage meetings
- `meeting:read:admin` - Read meeting information
- `user:read:admin` - Read user information

Click **"Continue"** and then **"Activate"** your app.

### Step 4: Configure Your Backend

1. Open `/root/Shef-LMS/backend/.env`
2. Replace the placeholder values with your actual Zoom credentials:

```env
# Zoom API Configuration
ZOOM_ACCOUNT_ID=your_actual_account_id
ZOOM_CLIENT_ID=your_actual_client_id
ZOOM_CLIENT_SECRET=your_actual_client_secret
```

### Step 5: Restart Your Backend Server

```bash
cd /root/Shef-LMS/backend
pm2 restart all
# OR if running with npm:
npm start
```

### Step 6: Test the Integration

#### As Admin:
1. Log in to your admin dashboard
2. Go to **"Live Classes"** section
3. Click **"Schedule Live Class"**
4. Fill in the form:
   - **Title**: Introduction to Data Science
   - **Course**: Data Science
   - **Date**: Select a future date
   - **Time**: Select time
   - **Duration**: 60 mins
   - **Instructor**: Your name
   - **Description**: Optional agenda
5. Click **"Save"**

If successful, you'll see:
- ✅ "Zoom meeting created successfully!"
- The Zoom link will be auto-generated
- Students can now see and join this class

#### As Student:
1. Log in as a student
2. Go to **"Live Classes"** section
3. You'll see the scheduled class
4. Click **"📡 Join Live Class"** button
5. You'll be redirected to the Zoom meeting

## API Endpoints

### Create Meeting
```
POST /api/zoom/meetings
Authorization: Bearer {token}

Body:
{
  "topic": "Class Title",
  "startTime": "2024-01-07T10:00:00Z",
  "duration": 60,
  "agenda": "Class agenda",
  "courseId": "Data Science",
  "timezone": "Asia/Kolkata"
}
```

### Get All Meetings
```
GET /api/zoom/meetings
Authorization: Bearer {token}
```

### Get Join URL
```
GET /api/zoom/join/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "joinUrl": "https://zoom.us/j/123456789?pwd=...",
  "password": "abc123",
  "title": "Class Title"
}
```

### Update Meeting
```
PUT /api/zoom/meetings/:id
Authorization: Bearer {token}

Body:
{
  "topic": "Updated Title",
  "startTime": "2024-01-08T10:00:00Z",
  "duration": 90
}
```

### Delete Meeting
```
DELETE /api/zoom/meetings/:id
Authorization: Bearer {token}
```

## Troubleshooting

### Error: "Failed to authenticate with Zoom API"
**Solution**: 
- Check your Zoom credentials in `.env` file
- Make sure your Zoom app is activated
- Verify the Account ID, Client ID, and Client Secret are correct

### Error: "Meeting not found"
**Solution**: 
- The meeting might have been deleted from Zoom
- Check if the meeting ID is correct in Firestore

### Students can't join the meeting
**Solution**: 
- Check if the join URL is valid
- Make sure the meeting hasn't been deleted
- Verify the meeting time hasn't passed

### No "Schedule Live Class" button visible
**Solution**: 
- Make sure you're logged in as an admin
- Check if the backend is running
- Verify the routes are properly configured

## Features Breakdown

### Backend Components
- **`/backend/config/zoom.js`** - Zoom API configuration
- **`/backend/services/zoomService.js`** - Zoom API service layer
- **`/backend/routes/zoom.js`** - API routes for Zoom operations
- **`/backend/server.js`** - Main server with Zoom routes registered

### Frontend Components
- **Admin Dashboard** - Schedule and manage live classes with auto Zoom creation
- **Student Dashboard** - View and join live classes directly
- **Join Button** - One-click join with automatic tracking

## Security Notes

1. **Never commit `.env` file** to version control
2. **Keep Zoom credentials secret**
3. **Use HTTPS** in production
4. **Implement rate limiting** for API endpoints
5. **Validate user authentication** before allowing meeting creation

## Zoom Meeting Settings

Default settings applied to all meetings:
- Host video: ON
- Participant video: ON
- Join before host: OFF
- Mute on entry: YES
- Waiting room: OFF
- Auto recording: OFF
- No registration required

You can customize these in `/backend/services/zoomService.js` in the `createMeeting` method.

## Timezone Configuration

Default timezone is set to `Asia/Kolkata` (IST). To change:

Edit `/backend/routes/zoom.js`, line where timezone is set:
```javascript
timezone: 'America/New_York'  // Change to your timezone
```

[List of Zoom timezones](https://marketplace.zoom.us/docs/api-reference/other-references/abbreviation-lists#timezones)

## Cost Considerations

- **Zoom Pro Account**: Required (~$15/month per host)
- **API Calls**: Server-to-Server OAuth is free
- **Meeting Duration**: Depends on your Zoom plan
- **Number of Participants**: Depends on your Zoom plan

## Support

For issues or questions:
1. Check Zoom API logs in backend console
2. Verify Firestore `liveClasses` collection
3. Check browser console for frontend errors
4. Review backend logs with `pm2 logs`

## Advanced Configuration

### Custom Meeting Templates
Edit `/backend/services/zoomService.js` to customize meeting settings:
```javascript
settings: {
  host_video: true,
  participant_video: true,
  join_before_host: true,  // Allow early joins
  waiting_room: true,       // Enable waiting room
  auto_recording: 'cloud',  // Cloud recording
  // ... more options
}
```

### Email Notifications
Integrate with your email service to send meeting reminders:
1. When meeting is created
2. 1 hour before meeting starts
3. When meeting link is updated

### Recurring Meetings
To create recurring classes, modify the meeting type:
```javascript
type: 8,  // Recurring meeting with fixed time
recurrence: {
  type: 1,  // Daily
  repeat_interval: 1,
  weekly_days: "1,3,5",  // Mon, Wed, Fri
  end_times: 10
}
```

## Production Checklist

- [ ] Zoom credentials configured in `.env`
- [ ] Backend server restarted
- [ ] Test meeting creation from admin panel
- [ ] Test meeting join from student account
- [ ] Verify meetings appear in Zoom dashboard
- [ ] Check Firestore for meeting data
- [ ] Test on mobile devices
- [ ] Set up monitoring/logging
- [ ] Configure error notifications

---

**Last Updated**: January 2026
**Integration Version**: 1.0
**Zoom API Version**: v2
