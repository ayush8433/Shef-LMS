const axios = require('axios');
const zoomConfig = require('../config/zoom');

class ZoomService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Get OAuth access token
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const authString = Buffer.from(
        `${zoomConfig.clientId}:${zoomConfig.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        `${zoomConfig.oauthUrl}?grant_type=account_credentials&account_id=${zoomConfig.accountId}`,
        {},
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 50 minutes (tokens last 1 hour)
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Zoom access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Zoom API');
    }
  }

  // Create a Zoom meeting
  async createMeeting(meetingData) {
    try {
      const token = await this.getAccessToken();
      
      // If usePMR is true, get the user's PMR link instead of creating a new meeting
      if (meetingData.usePMR) {
        return await this.getPMRLink(meetingData);
      }
      
      const meetingConfig = {
        topic: meetingData.topic || 'Live Class',
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime, // Format: 2024-01-07T10:00:00Z
        duration: meetingData.duration || 60, // in minutes
        timezone: meetingData.timezone || 'UTC',
        password: meetingData.password || this.generatePassword(),
        agenda: meetingData.agenda || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: false,
          audio: 'both',
          auto_recording: 'cloud', // Enable cloud recording by default
          approval_type: 2 // No registration required
        }
      };

      const response = await axios.post(
        `${zoomConfig.apiBaseUrl}/users/me/meetings`,
        meetingConfig,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        meeting: {
          id: response.data.id,
          meetingId: response.data.id,
          topic: response.data.topic,
          startTime: response.data.start_time,
          duration: response.data.duration,
          joinUrl: response.data.join_url,
          startUrl: response.data.start_url,
          password: response.data.password,
          timezone: response.data.timezone
        }
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  // Get Personal Meeting Room (PMR) link
  async getPMRLink(meetingData) {
    try {
      const token = await this.getAccessToken();
      
      // Get user's profile to get PMR link
      const response = await axios.get(
        `${zoomConfig.apiBaseUrl}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const pmrId = response.data.pmi;
      const pmrLink = `https://zoom.us/j/${pmrId}`;

      return {
        success: true,
        meeting: {
          id: pmrId,
          meetingId: pmrId,
          topic: meetingData.topic || 'Live Class',
          startTime: meetingData.startTime,
          duration: meetingData.duration || 60,
          joinUrl: pmrLink,
          startUrl: `https://zoom.us/s/${pmrId}`,
          password: response.data.pmi_password || '',
          timezone: meetingData.timezone || 'UTC',
          isPMR: true
        }
      };
    } catch (error) {
      console.error('Error getting PMR link:', error.response?.data || error.message);
      throw new Error('Failed to get Personal Meeting Room link');
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${zoomConfig.apiBaseUrl}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        meeting: {
          id: response.data.id,
          topic: response.data.topic,
          startTime: response.data.start_time,
          duration: response.data.duration,
          joinUrl: response.data.join_url,
          status: response.data.status
        }
      };
    } catch (error) {
      console.error('Error getting Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to get Zoom meeting details');
    }
  }

  // Update a meeting
  async updateMeeting(meetingId, updateData) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.patch(
        `${zoomConfig.apiBaseUrl}/meetings/${meetingId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Meeting updated successfully'
      };
    } catch (error) {
      console.error('Error updating Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to update Zoom meeting');
    }
  }

  // Delete a meeting
  async deleteMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      await axios.delete(
        `${zoomConfig.apiBaseUrl}/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        message: 'Meeting deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to delete Zoom meeting');
    }
  }

  // Generate random password
  generatePassword() {
    return Math.random().toString(36).substring(2, 10);
  }

  // List all upcoming meetings
  async listMeetings() {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${zoomConfig.apiBaseUrl}/users/me/meetings?type=upcoming`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        meetings: response.data.meetings.map(m => ({
          id: m.id,
          topic: m.topic,
          startTime: m.start_time,
          duration: m.duration,
          joinUrl: m.join_url
        }))
      };
    } catch (error) {
      console.error('Error listing Zoom meetings:', error.response?.data || error.message);
      throw new Error('Failed to list Zoom meetings');
    }
  }

  // Get cloud recordings for a meeting
  async getRecordings(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${zoomConfig.apiBaseUrl}/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        recordings: response.data.recording_files?.map(file => ({
          id: file.id,
          meetingId: file.meeting_id,
          recordingStart: file.recording_start,
          recordingEnd: file.recording_end,
          fileType: file.file_type, // MP4, M4A, TIMELINE, TRANSCRIPT, CHAT
          fileSize: file.file_size,
          playUrl: file.play_url,
          downloadUrl: file.download_url,
          status: file.status,
          recordingType: file.recording_type // shared_screen_with_speaker_view, audio_only, etc
        })) || [],
        duration: response.data.duration,
        totalSize: response.data.total_size
      };
    } catch (error) {
      console.error('Error getting Zoom recordings:', error.response?.data || error.message);
      // If no recordings found, return empty array instead of error
      if (error.response?.status === 404) {
        return {
          success: true,
          recordings: [],
          message: 'No recordings found for this meeting'
        };
      }
      throw new Error('Failed to get Zoom recordings');
    }
  }

  // List all cloud recordings for the account
  async listAllRecordings(from, to) {
    try {
      const token = await this.getAccessToken();
      
      // Default to last 30 days if not specified
      const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = to || new Date().toISOString().split('T')[0];
      
      const response = await axios.get(
        `${zoomConfig.apiBaseUrl}/users/me/recordings?from=${fromDate}&to=${toDate}&page_size=300`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        meetings: response.data.meetings?.map(meeting => ({
          uuid: meeting.uuid,
          id: meeting.id,
          accountId: meeting.account_id,
          hostId: meeting.host_id,
          topic: meeting.topic,
          startTime: meeting.start_time,
          duration: meeting.duration,
          totalSize: meeting.total_size,
          recordingCount: meeting.recording_count,
          recordingFiles: meeting.recording_files?.map(file => ({
            id: file.id,
            meetingId: file.meeting_id,
            recordingStart: file.recording_start,
            recordingEnd: file.recording_end,
            fileType: file.file_type,
            fileSize: file.file_size,
            playUrl: file.play_url,
            downloadUrl: file.download_url,
            status: file.status,
            recordingType: file.recording_type
          }))
        })) || [],
        pageCount: response.data.page_count,
        pageSize: response.data.page_size,
        totalRecords: response.data.total_records
      };
    } catch (error) {
      console.error('Error listing all recordings:', error.response?.data || error.message);
      throw new Error('Failed to list Zoom recordings');
    }
  }

  // Enable cloud recording for a meeting
  async enableRecording(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      await axios.patch(
        `${zoomConfig.apiBaseUrl}/meetings/${meetingId}`,
        {
          settings: {
            auto_recording: 'cloud' // Options: 'local', 'cloud', 'none'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Cloud recording enabled for meeting'
      };
    } catch (error) {
      console.error('Error enabling recording:', error.response?.data || error.message);
      throw new Error('Failed to enable cloud recording');
    }
  }
}

module.exports = new ZoomService();
