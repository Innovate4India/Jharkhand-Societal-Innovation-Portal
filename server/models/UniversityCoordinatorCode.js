import mongoose from 'mongoose';

const universityCoordinatorCodeSchema = new mongoose.Schema(
  {
    institution: { type: String, required: true, trim: true },
    institutionKey: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true, unique: true, select: false },
    active: { type: Boolean, default: true },
    rotatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const UniversityCoordinatorCode = mongoose.model('UniversityCoordinatorCode', universityCoordinatorCodeSchema);
export default UniversityCoordinatorCode;
