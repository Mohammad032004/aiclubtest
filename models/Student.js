import mongoose from "mongoose";

export const COURSE_OPTIONS = ["BCA", "B.Com", "BBA"];

export const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
];

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    course: {
      type: String,
      required: true,
      enum: COURSE_OPTIONS,
    },

    year: {
      type: String,
      required: true,
      enum: YEAR_OPTIONS,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },

    mustResetPassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({
  fullName: "text",
  email: "text",
  course: "text",
});

if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

export default mongoose.model("Student", studentSchema);