import { Box, CircularProgress } from '@mui/material';
import AppShell from './layout/AppShell';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { api, isAuthenticated, isBootstrapping, login, logout, user } = useAuth();

  if (isBootstrapping) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm onLogin={login} isSubmitting={isBootstrapping} />;
  }

  return <AppShell user={user} api={api} onLogout={logout} />;
}

