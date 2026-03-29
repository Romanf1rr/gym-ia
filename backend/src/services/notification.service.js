const { Expo } = require('expo-server-sdk');

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Send push notifications to one or more Expo push tokens.
 * Silently skips invalid tokens and logs errors.
 *
 * @param {Array<{ token, title, body, data? }>} messages
 */
async function sendPushNotifications(messages) {
  const chunks = expo.chunkPushNotifications(
    messages
      .filter(m => Expo.isExpoPushToken(m.token))
      .map(m => ({
        to: m.token,
        sound: 'default',
        title: m.title,
        body: m.body,
        data: m.data || {},
        badge: 1,
      }))
  );

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('[Push] Error ticket:', ticket.message, ticket.details);
        }
      }
    } catch (err) {
      console.error('[Push] Chunk send error:', err.message);
    }
  }
}

/**
 * Send a single notification to one token.
 */
async function sendOne(token, title, body, data = {}) {
  if (!token || !Expo.isExpoPushToken(token)) return;
  await sendPushNotifications([{ token, title, body, data }]);
}

module.exports = { sendPushNotifications, sendOne };
