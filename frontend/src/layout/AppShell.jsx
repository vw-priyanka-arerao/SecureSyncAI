import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  AppBar,
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
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
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
        <Toolbar sx={{ minHeight: '68px !important', px: { xs: 2, md: 3 }, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 4, height: 28, bgcolor: '#00b140', borderRadius: 1 }} />
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', lineHeight: 1.1 }}>
                SecureSync AI
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.2 }}>
                ISMS SmartFlow
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              color="inherit"
              aria-label="Notifications"
              onClick={() => setActivePage('notifications')}
              sx={{ width: 40, height: 40 }}
            >
              <Badge badgeContent={unreadNotifications} color="error" max={99}>
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
            <Box
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                pl: 1.5,
                borderLeft: '1px solid rgba(255, 255, 255, 0.22)',
                cursor: 'pointer'
              }}
              role="button"
              tabIndex={0}
            >
              <AccountCircleOutlinedIcon sx={{ fontSize: 34, color: '#ffffff', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                <Typography noWrap sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.25 }}>
                  {user.displayName}
                </Typography>
                <Typography noWrap variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.2 }}>
                  {user.role.replace('_', ' ')}
                </Typography>
              </Box>
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

