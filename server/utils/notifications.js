import Notification from '../models/Notification.js';

export async function createNotification({
  recipient,
  recipientRole,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
  actor = null,
  actorRole = null,
  eventKey = null,
}) {
  if (!recipient) return null;
  const payload = {
    recipient,
    recipientRole,
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId,
    actor,
    actorRole,
    ...(eventKey ? { eventKey } : {}),
  };
  if (eventKey) {
    return Notification.findOneAndUpdate({ eventKey }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  return Notification.create(payload);
}

export async function createNotifications(recipients, notification) {
  return Promise.all(recipients.filter(Boolean).map((recipient) => createNotification({ ...notification, recipient })));
}

export async function notifyUsers(users, notification) {
  return createNotifications(users.map((user) => user._id || user), notification);
}
