// Script to check and fix classroom video data in Firestore
const { db } = require('./config/firebase');

async function fixClassroomData() {
  console.log('Checking classroom collection...');
  
  const snapshot = await db.collection('classroom').get();
  
  if (snapshot.empty) {
    console.log('No videos found in classroom collection.');
    return;
  }
  
  console.log(`Found ${snapshot.size} videos. Checking data...`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log('\nVideo ID:', doc.id);
    console.log('Title:', data.title);
    console.log('Drive ID:', data.driveId);
    console.log('Course Type:', data.courseType);
    console.log('Course:', data.course);
    
    // If it has 'course' but not 'courseType', fix it
    if (data.course && !data.courseType) {
      console.log('  → Fixing: Moving "course" to "courseType"');
      await db.collection('classroom').doc(doc.id).update({
        courseType: data.course
      });
    }
    
    // If driveId contains a URL, extract just the ID
    if (data.driveId && data.driveId.includes('drive.google.com')) {
      const match = data.driveId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const extractedId = match[1];
        console.log('  → Fixing Drive ID: Extracting from URL');
        console.log('    Old:', data.driveId);
        console.log('    New:', extractedId);
        await db.collection('classroom').doc(doc.id).update({
          driveId: extractedId
        });
      }
    }
  }
  
  console.log('\n✅ Done checking and fixing data!');
}

fixClassroomData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
