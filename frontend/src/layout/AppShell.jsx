import { useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Alert,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import DashboardPage from '../pages/DashboardPage';
import DocumentsPage from '../pages/DocumentsPage';
import NotificationsPage from '../pages/NotificationsPage';
import AuditPage from '../pages/AuditPage';

const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { key: 'documents', label: 'Documents', icon: DescriptionOutlinedIcon },
  { key: 'notifications', label: 'Notifications', icon: NotificationsOutlinedIcon },
  { key: 'audit', label: 'Audit Trail', icon: FactCheckOutlinedIcon }
];

const drawerWidth = 260;

export default function AppShell({ user, api, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showMessage = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const activeComponent = useMemo(() => {
    switch (activePage) {
      case 'documents':
        return <DocumentsPage api={api} user={user} showMessage={showMessage} />;
      case 'notifications':
        return <NotificationsPage api={api} showMessage={showMessage} />;
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
            <Avatar sx={{ bgcolor: 'secondary.main' }}>{user.displayName?.[0] || user.username?.[0] || 'U'}</Avatar>
            <Box>
              <Typography fontWeight={600}>{user.displayName}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>{user.role}</Typography>
            </Box>
            <Button color="inherit" onClick={onLogout}>Logout</Button>
          </Stack>
        </Toolbar>
      </AppBar>

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

