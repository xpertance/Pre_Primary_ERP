import Student from "@/models/Student";

// Define the Parent type for the parents array
interface Parent {
  parentId: string; // Adjust to ObjectId if needed
  [key: string]: unknown; // Allow additional fields
}

// Define the Student type for lean() result
interface StudentLean {
  _id: string;
  parents?: Parent[];
  [key: string]: unknown; // Allow additional fields
}

export async function parentOwnsStudent(studentId: string, loggedInParentId: string, parentEmail?: string): Promise<StudentLean | null> {
  // If the logged in user is directly the student (student login scenario)
  if (String(studentId) === String(loggedInParentId)) {
    return await Student.findById(studentId).lean<StudentLean>() as StudentLean | null;
  }

  // Otherwise, logged in as Parent (User model). Check the student's parents array.
  const query: any = {
    _id: studentId,
    $or: [{ "parents.parentId": loggedInParentId }]
  };

  if (parentEmail) {
    query.$or.push({ "parents.email": parentEmail });
  }

  const student = await Student.findOne(query).lean<StudentLean>();
  return student as StudentLean | null;
}