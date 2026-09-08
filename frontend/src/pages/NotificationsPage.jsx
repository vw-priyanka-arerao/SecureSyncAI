import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function NotificationsPage({ api, showMessage, onChanged }) {
  const [notifications, setNotifications] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setNotifications(await api.listNotifications());
      const overdue = await api.getOverdueNotificationCount();
      setOverdueCount(overdue?.overdue || 0);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load notifications');
      showMessage(loadError.message || 'Unable to load notifications', 'error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(notification) {
    try {
      await api.markNotificationRead(notification.id, !notification.readFlag);
      showMessage(`Notification marked as ${notification.readFlag ? 'unread' : 'read'}`, 'success');
      await load();
      await onChanged?.();
    } catch (actionError) {
      showMessage(actionError.message || 'Unable to update notification', 'error');
    }
  }

  async function runReminders() {
    try {
      const result = await api.runNotificationReminders();
      showMessage(`Reminder sweep completed. Sent ${result?.sent || 0} reminder(s).`, 'success');
      await load();
    } catch (actionError) {
      showMessage(actionError.message || 'Unable to run reminder sweep', 'error');
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>Notifications</Typography>
        <Typography color="text.secondary">Review reminders, approval outcomes, and workflow prompts. Overdue: {overdueCount}</Typography>
      </Box>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="outlined" onClick={runReminders}>Run reminder sweep</Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent>
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{ px: 0, bgcolor: notification.dueAt && !notification.readFlag && new Date(notification.dueAt) < new Date() ? 'rgba(220, 38, 38, 0.08)' : 'transparent' }}
                secondaryAction={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={notification.type} size="small" />
                    <Button size="small" onClick={() => toggle(notification)}>
                      Mark as {notification.readFlag ? 'unread' : 'read'}
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={notification.message}
                  secondary={`Created: ${formatDate(notification.createdAt)}${notification.dueAt ? ` • Due: ${formatDate(notification.dueAt)}` : ''}`}
                />
              </ListItem>
            ))}
            {!notifications.length ? (
              <Typography color="text.secondary">No notifications found.</Typography>
            ) : null}
          </List>
        </CardContent>
      </Card>
    </Stack>
  );
}

