const cron = require('node-cron');
const zoomService = require('../services/zoomService');
const { db } = require('../config/firebase');

// Function to sync Zoom recordings to classroom
async function syncZoomRecordings() {
  try {
    console.log('[Zoom Sync] Starting recording sync...');

    // Get all recordings from last 7 days (to catch recent classes)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const result = await zoomService.listAllRecordings(sevenDaysAgo, today);

    if (!result.success || !result.meetings || result.meetings.length === 0) {
      console.log('[Zoom Sync] No recordings found');
      return { synced: 0, skipped: 0 };
    }

    let syncedCount = 0;
    let skippedCount = 0;

    // Process each meeting with recordings
    for (const meeting of result.meetings) {
      if (!meeting.recordingFiles || meeting.recordingFiles.length === 0) {
        continue;
      }

      // Find MP4 video recordings (skip audio, transcript, chat files)
      const videoRecordings = meeting.recordingFiles.filter(
        file => file.fileType === 'MP4' && 
               file.recordingType !== 'audio_only' &&
               file.status === 'completed'
      );

      if (videoRecordings.length === 0) {
        continue;
      }

      // Check if this meeting is in our liveClasses collection
      const liveClassSnapshot = await db.collection('liveClasses')
        .where('zoomMeetingId', '==', meeting.id.toString())
        .limit(1)
        .get();

      let classTitle = meeting.topic;
      let instructor = 'Instructor';
      let courseId = null;

      if (!liveClassSnapshot.empty) {
        const classData = liveClassSnapshot.docs[0].data();
        classTitle = classData.title || meeting.topic;
        instructor = classData.instructor || 'Instructor';
        courseId = classData.courseId || null;
      }

      // Add each video recording to classroom collection
      for (const recording of videoRecordings) {
        // Check if recording already exists
        const existingSnapshot = await db.collection('classroom')
          .where('zoomRecordingId', '==', recording.id)
          .limit(1)
          .get();

        if (existingSnapshot.empty) {
          // Add new recording to classroom
          const classroomRef = db.collection('classroom').doc();
          await classroomRef.set({
            id: classroomRef.id,
            title: classTitle,
            instructor: instructor,
            duration: `${Math.floor(meeting.duration / 60)} min`,
            date: meeting.startTime,
            videoUrl: recording.playUrl, // Zoom video URL
            thumbnail: `https://via.placeholder.com/400x225/4A90E2/ffffff?text=${encodeURIComponent(classTitle)}`,
            zoomRecordingId: recording.id,
            zoomMeetingId: meeting.id.toString(),
            fileSize: recording.fileSize,
            recordingStart: recording.recordingStart,
            recordingEnd: recording.recordingEnd,
            downloadUrl: recording.downloadUrl,
            source: 'zoom',
            courseId: courseId,
            views: 0,
            createdAt: new Date().toISOString()
          });

          console.log(`[Zoom Sync] Added recording: ${classTitle}`);
          syncedCount++;
        } else {
          skippedCount++;
        }
      }
    }

    console.log(`[Zoom Sync] Completed: ${syncedCount} synced, ${skippedCount} skipped`);
    return { synced: syncedCount, skipped: skippedCount };
  } catch (error) {
    console.error('[Zoom Sync] Error:', error.message);
    return { error: error.message };
  }
}

// Schedule the job to run every hour
function startRecordingSync() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Zoom Sync] Running scheduled sync...');
    await syncZoomRecordings();
  });

  // Also run on startup (after 2 minutes to let server stabilize)
  setTimeout(async () => {
    console.log('[Zoom Sync] Running initial sync...');
    await syncZoomRecordings();
  }, 120000);

  console.log('[Zoom Sync] Scheduler started - will run every hour');
}

module.exports = {
  startRecordingSync,
  syncZoomRecordings
};
