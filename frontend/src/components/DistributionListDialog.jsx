import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';

export default function DistributionListDialog({ open, onClose, onCreate, memberOptions = [] }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const memberEmails = members.map((member) => member.email);
    if (!memberEmails.length) {
      setError('Add at least one registered member email address.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onCreate({ name, email, memberEmails });
      setName('');
      setEmail('');
      setMembers([]);
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Unable to create distribution list');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Distribution List</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} component="form" onSubmit={submit} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="DL name" value={name} onChange={(event) => setName(event.target.value)} required />
          <TextField label="DL email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="isms-reviewers@securesync.local" required />
          <Autocomplete
            multiple
            options={memberOptions}
            value={members}
            onChange={(_, value) => setMembers(value)}
            getOptionLabel={(option) => option.email}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            renderOption={(props, option) => (
              <li {...props} key={option.email}>
                {option.email} ({option.role})
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="DL members"
                placeholder="Select members"
                helperText="Select one or more registered users. Their email and role are shown."
                required={members.length === 0}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={saving}>{saving ? 'Creating...' : 'Create DL'}</Button>
      </DialogActions>
    </Dialog>
  );
}