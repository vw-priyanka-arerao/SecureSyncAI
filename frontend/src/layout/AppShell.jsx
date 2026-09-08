import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import DashboardPage from '../pages/DashboardPage';
import DocumentsPage from '../pages/DocumentsPage';
import NotificationsPage from '../pages/NotificationsPage';
import AuditPage from '../pages/AuditPage';
import DistributionListDialog from '../components/DistributionListDialog';

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { key: 'documents', label: 'Documents', icon: DescriptionOutlinedIcon },
  { key: 'audit', label: 'Audit Trail', icon: FactCheckOutlinedIcon }
];

const drawerWidth = 260;

export default function AppShell({ user, api, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createDlOpen, setCreateDlOpen] = useState(false);
  const [memberOptions, setMemberOptions] = useState([]);

  const canManageDistributionLists = user.role === 'ADMIN' || user.role === 'SUB_ADMIN';

  const refreshUnreadNotifications = useCallback(async () => {
    try {
      const notifications = await api.listNotifications();
      setUnreadNotifications(notifications.filter((notification) => !notification.readFlag).length);
    } catch {
      // Keep the current badge when notification refresh is unavailable.
    }
  }, [api]);

  useEffect(() => {
    refreshUnreadNotifications();
  }, [refreshUnreadNotifications]);

  useEffect(() => {
    if (canManageDistributionLists) {
      api.listUsers(false).then(setMemberOptions).catch(() => undefined);
    }
  }, [api, canManageDistributionLists]);

  async function createDistributionList(payload) {
    await api.createDistributionList(payload);
    showMessage('Distribution List created successfully', 'success');
  }

  const showMessage = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const activeComponent = useMemo(() => {
    switch (activePage) {
      case 'documents':
        return <DocumentsPage api={api} user={user} showMessage={showMessage} />;
      case 'notifications':
        return <NotificationsPage api={api} showMessage={showMessage} onChanged={refreshUnreadNotifications} />;
      case 'audit':
        return <AuditPage api={api} showMessage={showMessage} />;
      case 'dashboard':
      default:
        return <DashboardPage api={api} user={user} showMessage={showMessage} />;
    }
  }, [activePage, api, user]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ISMS SmartFlow Portal
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              color="inherit"
              aria-label="Notifications"
              onClick={() => setActivePage('notifications')}
            >
              <Badge badgeContent={unreadNotifications} color="error" max={99}>
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{user.displayName?.[0] || user.username?.[0] || 'U'}</Avatar>
            <Box
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              sx={{ cursor: 'pointer', minWidth: 110 }}
              role="button"
              tabIndex={0}
            >
              <Typography fontWeight={600}>{user.displayName}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>{user.role}</Typography>
            </Box>
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
            >
              <MenuItem onClick={() => { setSettingsOpen(true); setProfileAnchor(null); }}>
                <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Settings
              </MenuItem>
              <MenuItem onClick={onLogout}>
                <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1} sx={{ minWidth: 320 }}>
            <Typography><strong>Name:</strong> {user.displayName}</Typography>
            <Typography><strong>Username:</strong> {user.username}</Typography>
            <Typography><strong>Email:</strong> {user.email}</Typography>
            <Typography><strong>Role:</strong> {user.role}</Typography>
            {canManageDistributionLists ? (
              <Box sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => { setSettingsOpen(false); setCreateDlOpen(true); }}
                >
                  Create DL
                </Button>
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <MenuItem onClick={() => setSettingsOpen(false)}>Close</MenuItem>
        </DialogActions>
      </Dialog>

      <DistributionListDialog
        open={createDlOpen}
        onClose={() => setCreateDlOpen(false)}
        onCreate={createDistributionList}
        memberOptions={memberOptions}
      />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' }
        }}
      >
        <Toolbar>
          <Stack>
            <Typography variant="h6" fontWeight={700}>SecureSync AI</Typography>
            <Typography variant="body2" color="text.secondary">Hackathon control center</Typography>
          </Stack>
        </Toolbar>
        <List>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton key={item.key} selected={activePage === item.key} onClick={() => setActivePage(item.key)}>
                <Icon fontSize="small" style={{ marginRight: 12 }} />
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {activeComponent}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

