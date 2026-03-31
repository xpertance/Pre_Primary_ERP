const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const newPassword = 'Admin@1234';
const MONGO_URI = 'mongodb+srv://rohangadekar07:rohan1903@cluster0.2kosj5b.mongodb.net/xpertance?retryWrites=true&w=majority&appName=Cluster0';

const adminEmails = [
  'admin@school.com',
  'harshladukar@gmail.com',
  'admin2@gmail.com',
  'admin123@school.com',
];

mongoose.connect(MONGO_URI)
  .then(async (m) => {
    const hash = await bcrypt.hash(newPassword, 10);
    console.log('Resetting passwords for all admin users...\n');

    for (const email of adminEmails) {
      const result = await m.connection.db.collection('users').updateOne(
        { email },
        { $set: { password: hash } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ ${email} => password reset to: ${newPassword}`);
      } else {
        console.log(`⚠️  ${email} => not found or not modified`);
      }
    }

    console.log('\nDone! Use password: Admin@1234 to log in.');
    m.disconnect();
  })
  .catch(console.error);
