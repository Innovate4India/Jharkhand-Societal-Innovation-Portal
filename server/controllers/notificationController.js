import Notification from '../models/Notification.js';

export async function getNotifications(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
  const filter = { recipient: req.user.id };
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  return res.json({ success: true, data: { notifications, unreadCount, page, limit } });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { read: true },
    { new: true },
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  return res.json({ success: true, data: notification });
}

export async function markAllNotificationsRead(req, res) {
  await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
  return res.json({ success: true });
}
