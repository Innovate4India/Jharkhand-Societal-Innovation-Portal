import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../server/config/db.js';
import User from '../server/models/User.js';
import UniversityCoordinatorCode from '../server/models/UniversityCoordinatorCode.js';
import { createCoordinatorCode, hashCoordinatorCode, normalizeInstitution } from '../server/utils/universityCoordinatorCodes.js';

dotenv.config();

const [, , command = 'sync'] = process.argv;
await connectDB();

try {
  const institutions = await User.distinct('institution', { role: 'university', institution: { $exists: true, $ne: '' } });
  const output = [];
  for (const institution of institutions) {
    const institutionKey = normalizeInstitution(institution);
    const existing = await UniversityCoordinatorCode.findOne({ institutionKey }).select('+codeHash');
    if (command === 'revoke') {
      if (existing) await UniversityCoordinatorCode.updateOne({ _id: existing._id }, { active: false });
      continue;
    }
    if (existing && command !== 'rotate') continue;
    const code = createCoordinatorCode();
    const update = {
      institution,
      institutionKey,
      codeHash: hashCoordinatorCode(code),
      active: true,
      ...(existing ? { rotatedAt: new Date() } : {})
    };
    if (existing) await UniversityCoordinatorCode.updateOne({ _id: existing._id }, update);
    else await UniversityCoordinatorCode.create(update);
    output.push(`${institution} -> ${code}`);
  }
  if (output.length) console.log(output.join('\n'));
  else console.log(command === 'revoke' ? 'Coordinator codes revoked.' : 'No new coordinator codes generated.');
} finally {
  await mongoose.disconnect();
}
