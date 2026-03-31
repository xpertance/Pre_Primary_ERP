const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const NEW_PASSWORD = 'password123';
const MONGO_URI = 'mongodb+srv://rohangadekar07:rohan1903@cluster0.2kosj5b.mongodb.net/xpertance?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI).then(async (m) => {
  const db = m.connection.db;
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  console.log(`\nResetting all passwords to: "${NEW_PASSWORD}"\n`);

  // 1. Update ALL users in the `users` collection (admins, parents, students)
  const usersResult = await db.collection('users').updateMany(
    {},
    { $set: { password: hash } }
  );
  console.log(`✅ users collection:    ${usersResult.modifiedCount} accounts updated`);

  // 2. Update ALL teachers in the `teachers` collection
  const teachersResult = await db.collection('teachers').updateMany(
    {},
    { $set: { password: hash } }
  );
  console.log(`✅ teachers collection: ${teachersResult.modifiedCount} accounts updated`);

  // 3. Update ALL students in the `students` collection
  const studentsResult = await db.collection('students').updateMany(
    {},
    { $set: { password: hash } }
  );
  console.log(`✅ students collection: ${studentsResult.modifiedCount} accounts updated`);

  const total = usersResult.modifiedCount + teachersResult.modifiedCount + studentsResult.modifiedCount;
  console.log(`\n✅ Done! ${total} total accounts now use password: "${NEW_PASSWORD}"`);

  m.disconnect();
}).catch(console.error);
