import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function AuditPage({ api, showMessage }) {
  const [documentId, setDocumentId] = useState('');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setLogs(await api.listAuditLogs(documentId || undefined));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load audit logs');
      showMessage(loadError.message || 'Unable to load audit logs', 'error');
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>Audit trail</Typography>
        <Typography color="text.secondary">Trace document actions, reviewers, timestamps, and lifecycle history.</Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Document ID (optional)"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
            />
            <Button variant="contained" onClick={load}>Load audit logs</Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>{log.entityType} #{log.entityId}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.actorUsername}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
              {!logs.length ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ py: 3, textAlign: 'center' }} color="text.secondary">
                      Load audit logs to review evidence history.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}

