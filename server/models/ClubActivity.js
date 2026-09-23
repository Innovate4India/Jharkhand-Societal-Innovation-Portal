import mongoose from 'mongoose';

const clubActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    club: { type: String, required: true, trim: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

const ClubActivity = mongoose.model('ClubActivity', clubActivitySchema);
export default ClubActivity;
