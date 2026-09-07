import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const demoUsers = [
  ['employee1', 'Employee'],
  ['sdm1', 'SDM'],
  ['pdhead1', 'PD Head'],
  ['admin1', 'Admin'],
  ['auditor1', 'Auditor']
];

export default function LoginForm({ onLogin, isSubmitting }) {
  const [mode, setMode] = useState('basic');
  const [username, setUsername] = useState('employee1');
  const [password, setPassword] = useState('Password1!');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const helperText = useMemo(
    () => 'Use the seeded demo users. All share the password Password1! for this hackathon MVP.',
    []
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'token') {
        await onLogin({ mode: 'token', token });
      } else {
        await onLogin({ mode: 'basic', username, password });
      }
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in');
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                SecureSync AI
              </Typography>
              <Typography color="text.secondary">
                Centralized ISMS SmartFlow portal for drafting, approvals, audit readiness, and compliance visibility.
              </Typography>
            </Box>

            <Alert severity="info">{helperText}</Alert>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  setMode(value);
                }
              }}
              size="small"
            >
              <ToggleButton value="basic">Basic (Demo)</ToggleButton>
              <ToggleButton value="token">Bearer Token</ToggleButton>
            </ToggleButtonGroup>

            {mode === 'basic' ? (
              <>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {demoUsers.map(([demoUsername, label]) => (
                    <Chip
                      key={demoUsername}
                      label={`${label}: ${demoUsername}`}
                      color={username === demoUsername ? 'primary' : 'default'}
                      onClick={() => setUsername(demoUsername)}
                      variant={username === demoUsername ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>

                <Divider />

                <TextField
                  label="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoFocus
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </>
            ) : (
              <>
                <Divider />
                <Alert severity="info">
                  Paste an access token issued by your Azure AD app registration. Enable backend profile `oauth2` before using this mode.
                </Alert>
                <TextField
                  label="Bearer access token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                  multiline
                  minRows={5}
                />
              </>
            )}

            <Button type="submit" size="large" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

