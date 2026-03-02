import mongoose from "mongoose";

export type IParent = {
  name: string;
  phone?: string;
  email?: string;
  relation?: string;
};

export type IStudentDoc = mongoose.Document & {
  firstName: string;
  lastName?: string;
  email?: string; // for login
  password?: string; // hashed
  dob?: Date;
  gender?: "male" | "female" | "other";
  classId?: mongoose.Types.ObjectId | string;
  section?: string;
  admissionNo?: string;
  admissionDate?: Date;
  parents?: IParent[];
  medical?: {
    allergies?: string[];
    notes?: string;
  };
  pickupInfo?: {
    pickupPerson?: string;
    pickupPhone?: string;
  };
  documents?: { name: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
};



const DocumentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
  },
  { _id: false }
);




const studentSchema = new mongoose.Schema<IStudentDoc>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true },
    password: String, // hashed password
    dob: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    section: String,
    admissionNo: { type: String, unique: true, sparse: true },
    admissionDate: Date,
    medical: {
      allergies: [String],
      notes: String,
    },
    parents: [
      {
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        phone: String,
        email: String,
        relation: String,
      }
    ],
    pickupInfo: {
      pickupPerson: String,
      pickupPhone: String,
    },
    documents: [DocumentSchema],
  },
  { timestamps: true }
);
delete mongoose.models.Student;
export default mongoose.models.Student ||
  mongoose.model<IStudentDoc>("Student", studentSchema);
