import { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
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
const allowedExtensions = ['.pdf', '.docx', '.xls', '.xlsx'];

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
  const selectedReviewer = useMemo(
    () => reviewerOptions.find((option) => option.email.toLowerCase() === form.reviewerUsername.trim().toLowerCase()),
    [form.reviewerUsername, reviewerOptions]
  );

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    const extension = file?.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (file && !allowedExtensions.includes(extension)) {
      setSelectedFile(null);
      setError(`Unsupported file type. Please choose a PDF, DOCX, XLS, or XLSX file.`);
      event.target.value = '';
      return;
    }
    setError('');
    setSelectedFile(file);
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
          <Autocomplete
            freeSolo
            options={reviewerOptions}
            value={selectedReviewer || form.reviewerUsername}
            onChange={(_, value) => {
              const email = typeof value === 'string' ? value : value?.email || '';
              updateField('reviewerUsername', email);
            }}
            onInputChange={(_, value) => updateField('reviewerUsername', value)}
            getOptionLabel={(option) => typeof option === 'string' ? option : option.email}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            renderOption={(props, option) => (
              <li {...props} key={option.email}>
                {option.role === 'DISTRIBUTION_LIST'
                  ? `${option.name} - ${option.email} (${option.memberEmails.length} members)`
                  : `${option.email} (${option.role})`}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Reviewer email or Distribution List"
                helperText={selectedReviewer
                  ? selectedReviewer.role === 'DISTRIBUTION_LIST'
                    ? `Distribution List: ${selectedReviewer.name} (${selectedReviewer.memberEmails.length} members)`
                    : `Individual reviewer role: ${selectedReviewer.role}`
                  : 'Select an individual reviewer or DL, or enter a valid registered email.'}
              />
            )}
          />
          <FormControlLabel
            control={
              <Switch
                checked={useFileUpload}
                onChange={(event) => setUseFileUpload(event.target.checked)}
              />
            }
            label="Create document from uploaded document file"
          />
          {useFileUpload ? (
            <Stack spacing={1}>
              <Button variant="outlined" component="label">
                Select document file
                <input
                  hidden
                  type="file"
                  accept=".pdf,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected. PDF, DOCX, XLS, and XLSX files up to 1 MB are supported.'}
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

