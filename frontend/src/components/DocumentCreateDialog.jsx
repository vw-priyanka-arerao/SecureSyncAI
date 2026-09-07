import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const categoryOptions = ['Policy', 'Procedure', 'Risk', 'Access', 'Audit', 'Asset'];

const initialState = {
  title: '',
  category: 'Policy',
  reviewerUsername: '',
  content: '',
  changeSummary: '',
  ownerUsername: '',
  reviewCycleDays: 365,
  nextReviewAt: ''
};

export default function DocumentCreateDialog({ open, onClose, onCreate, user, reviewerOptions = [], ownerOptions = [] }) {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const canAssignOwner = useMemo(() => user?.role === 'ADMIN', [user]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onCreate({ ...form, file: selectedFile, useFileUpload });
      setForm(initialState);
      setSelectedFile(null);
      setUseFileUpload(false);
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Unable to create document');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Create ISMS Document</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Title"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
          />
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {categoryOptions.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
          {canAssignOwner ? (
            <TextField
              select
              label="Owner username (optional)"
              value={form.ownerUsername || ''}
              onChange={(event) => updateField('ownerUsername', event.target.value)}
            >
              <MenuItem value="">Current user</MenuItem>
              {ownerOptions.map((option) => (
                <MenuItem key={option.username} value={option.username}>
                  {option.displayName} ({option.role})
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField
            select
            label="Reviewer username"
            value={form.reviewerUsername}
            onChange={(event) => updateField('reviewerUsername', event.target.value)}
            helperText="Select a workflow approver"
          >
            <MenuItem value="">Auto-assign</MenuItem>
            {reviewerOptions.map((option) => (
              <MenuItem key={option.username} value={option.username}>
                {option.displayName} ({option.role})
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={useFileUpload}
                onChange={(event) => setUseFileUpload(event.target.checked)}
              />
            }
            label="Create document from uploaded text file"
          />
          {useFileUpload ? (
            <Stack spacing={1}>
              <Button variant="outlined" component="label">
                Select text file
                <input
                  hidden
                  type="file"
                  accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.log"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected. UTF-8 text files up to 1 MB are supported in this MVP.'}
              </Typography>
            </Stack>
          ) : (
            <TextField
              label="Draft content"
              value={form.content}
              onChange={(event) => updateField('content', event.target.value)}
              required={!useFileUpload}
              multiline
              minRows={8}
            />
          )}
          <TextField
            label="Change summary"
            value={form.changeSummary}
            onChange={(event) => updateField('changeSummary', event.target.value)}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              type="number"
              label="Review cycle (days)"
              value={form.reviewCycleDays}
              onChange={(event) => updateField('reviewCycleDays', event.target.value)}
              inputProps={{ min: 1 }}
              helperText="Used by reminders and expiry-aware chatbot queries"
            />
            <TextField
              type="datetime-local"
              label="Next review date (optional)"
              value={form.nextReviewAt}
              onChange={(event) => updateField('nextReviewAt', event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
          {useFileUpload ? (
            <Box>
              <Alert severity="info">Uploaded file content will be stored as version 1 and analyzed by the compliance-assist service.</Alert>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

