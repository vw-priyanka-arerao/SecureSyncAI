import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import StatusChip from './StatusChip';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function canReview(role) {
  return ['SDM', 'PD_HEAD', 'ADMIN'].includes(role);
}

export default function DocumentDetailDrawer({ open, documentId, user, api, onClose, onChanged, showMessage, includeDeleted = false }) {
  const [document, setDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [submitForm, setSubmitForm] = useState({ reviewerUsername: '', remarks: '' });
  const [reviewForm, setReviewForm] = useState({ remarks: '' });
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [versionForm, setVersionForm] = useState({ content: '', changeSummary: '' });

  const isOwner = useMemo(() => document?.ownerUsername === user?.username, [document, user]);
  const isAdmin = user?.role === 'ADMIN';
  const reviewerRole = canReview(user?.role);

  useEffect(() => {
    if (!open || !documentId) {
      return;
    }

    async function load() {
      setLoading(true);
      setError('');
      try {
        const doc = await api.getDocument(documentId, includeDeleted);
        const ai = doc.deleted ? null : await api.analyzeDocument(documentId);
        setDocument(doc);
        setAnalysis(ai);
        setSubmitForm({ reviewerUsername: doc.assignedReviewer || 'sdm1', remarks: '' });
        setVersionForm({ content: doc.versions?.[0]?.content || '', changeSummary: '' });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load document details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [api, documentId, includeDeleted, open]);

  async function perform(action, successMessage) {
    try {
      const updated = await action();
      setDocument(updated);
      const refreshedAnalysis = updated.deleted ? null : await api.analyzeDocument(updated.id);
      setAnalysis(refreshedAnalysis);
      onChanged();
      showMessage(successMessage, 'success');
    } catch (actionError) {
      showMessage(actionError.message || 'Action failed', 'error');
    }
  }

  async function handleDeleteDocument() {
    if (!document || !isAdmin) {
      return;
    }
    const confirmed = window.confirm(`Archive document '${document.title}'? It will be hidden from active lists.`);
    if (!confirmed) {
      return;
    }
    try {
      await api.deleteDocument(document.id);
      showMessage('Document archived successfully', 'success');
      onChanged();
      onClose();
    } catch (actionError) {
      showMessage(actionError.message || 'Delete failed', 'error');
    }
  }

  async function handleRestoreDocument() {
    if (!document || !isAdmin) {
      return;
    }
    try {
      const updated = await api.restoreDocument(document.id);
      setDocument(updated);
      setAnalysis(updated.deleted ? null : await api.analyzeDocument(updated.id));
      showMessage('Document restored successfully', 'success');
      onChanged();
    } catch (actionError) {
      showMessage(actionError.message || 'Restore failed', 'error');
    }
  }

  const isDeleted = Boolean(document?.deleted);
  const canSubmit = !isDeleted && (isOwner || isAdmin) && ['DRAFT', 'REJECTED'].includes(document?.status);
  const canStartReview = !isDeleted && reviewerRole && document?.status === 'SUBMITTED';
  const canApproveReject = !isDeleted && reviewerRole && ['SUBMITTED', 'UNDER_REVIEW'].includes(document?.status);
  const canCreateVersion = !isDeleted && (isOwner || isAdmin);

  const latestVersion = document?.versions?.[0];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 720 } } }}>
      <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{document?.title || 'Document details'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <StatusChip status={document?.status} />
                {document?.category ? <Chip label={document.category} variant="outlined" /> : null}
                {document?.currentVersion ? <Chip label={`v${document.currentVersion}`} variant="outlined" /> : null}
                {isDeleted ? <Chip color="warning" label="DELETED" variant="filled" /> : null}
              </Stack>
            </Box>
            <Button onClick={onClose}>Close</Button>
          </Stack>

          {loading ? <CircularProgress /> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {document ? (
            <>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3 }}>
                <Stack spacing={1}>
                  <Typography><strong>Owner:</strong> {document.ownerUsername}</Typography>
                  <Typography><strong>Reviewer:</strong> {document.assignedReviewer || 'Unassigned'}</Typography>
                  <Typography><strong>Next review:</strong> {formatDate(document.nextReviewAt)}</Typography>
                  <Typography><strong>Review cycle:</strong> {document.reviewCycleDays || '—'} day(s)</Typography>
                  <Typography><strong>Created:</strong> {formatDate(document.createdAt)}</Typography>
                  <Typography><strong>Updated:</strong> {formatDate(document.updatedAt)}</Typography>
                  <Typography><strong>Key:</strong> <span className="monospace">{document.documentKey}</span></Typography>
                </Stack>
              </Box>

              {analysis ? (
                <Alert severity={analysis.validationScore >= 75 ? 'success' : 'warning'}>
                  <strong>AI validation score:</strong> {analysis.validationScore.toFixed(1)} / 100<br />
                  <strong>Confidence:</strong> {(analysis.confidenceScore || 0).toFixed(1)}% ({analysis.model || 'heuristic'})<br />
                  <strong>Summary:</strong> {analysis.generatedSummary}
                  {analysis.detectedKeywords?.length ? (
                    <><br /><strong>Detected keywords:</strong> {analysis.detectedKeywords.join(', ')}</>
                  ) : null}
                  {analysis.missingKeywords?.length ? (
                    <><br /><strong>Missing keywords:</strong> {analysis.missingKeywords.join(', ')}</>
                  ) : null}
                  {analysis.complianceCoverage ? (
                    <><br /><strong>Compliance coverage:</strong> {Object.entries(analysis.complianceCoverage).map(([name, score]) => `${name}: ${score}%`).join(' | ')}</>
                  ) : null}
                  {analysis.recommendations?.length ? (
                    <><br /><strong>Recommendations:</strong> {analysis.recommendations.join(' ; ')}</>
                  ) : null}
                </Alert>
              ) : null}

              {isDeleted ? (
                <Alert severity="warning">
                  This document is soft deleted.
                  {document.deletedAt ? ` Deleted at ${formatDate(document.deletedAt)}.` : ''}
                  {document.deletedBy ? ` Deleted by ${document.deletedBy}.` : ''}
                </Alert>
              ) : null}

              <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable">
                <Tab label="Workflow" />
                <Tab label="Versions" />
                <Tab label="Approvals" />
              </Tabs>

              {activeTab === 0 ? (
                <Stack spacing={3}>
                  {latestVersion ? (
                    <Box>
                      <Typography variant="h6" gutterBottom>Latest content</Typography>
                      <Box sx={{ p: 2, bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 3 }}>
                        <pre>{latestVersion.content}</pre>
                      </Box>
                    </Box>
                  ) : null}

                  {canSubmit ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6">Submit for review</Typography>
                      <TextField
                        label="Reviewer username"
                        value={submitForm.reviewerUsername}
                        onChange={(event) => setSubmitForm((current) => ({ ...current, reviewerUsername: event.target.value }))}
                      />
                      <TextField
                        label="Remarks"
                        value={submitForm.remarks}
                        onChange={(event) => setSubmitForm((current) => ({ ...current, remarks: event.target.value }))}
                        multiline
                        minRows={2}
                      />
                      <Button
                        variant="contained"
                        onClick={() => perform(
                          () => api.submitDocument(document.id, submitForm),
                          'Document submitted for review'
                        )}
                      >
                        Submit document
                      </Button>
                    </Stack>
                  ) : null}

                  {canStartReview ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6">Start review</Typography>
                      <TextField
                        label="Review remarks"
                        value={reviewForm.remarks}
                        onChange={(event) => setReviewForm({ remarks: event.target.value })}
                        multiline
                        minRows={2}
                      />
                      <Button
                        variant="outlined"
                        onClick={() => perform(
                          () => api.startReview(document.id, reviewForm),
                          'Review started'
                        )}
                      >
                        Mark under review
                      </Button>
                    </Stack>
                  ) : null}

                  {canApproveReject ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6">Decision</Typography>
                      <TextField
                        label="Decision remarks"
                        value={decisionRemarks}
                        onChange={(event) => setDecisionRemarks(event.target.value)}
                        multiline
                        minRows={2}
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => perform(
                            () => api.reviewDocument(document.id, { approved: true, remarks: decisionRemarks }),
                            'Document approved'
                          )}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => perform(
                            () => api.reviewDocument(document.id, { approved: false, remarks: decisionRemarks }),
                            'Document rejected'
                          )}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}

                  {canCreateVersion ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6">Create new version</Typography>
                      <TextField
                        label="Updated content"
                        value={versionForm.content}
                        onChange={(event) => setVersionForm((current) => ({ ...current, content: event.target.value }))}
                        multiline
                        minRows={8}
                      />
                      <TextField
                        label="Change summary"
                        value={versionForm.changeSummary}
                        onChange={(event) => setVersionForm((current) => ({ ...current, changeSummary: event.target.value }))}
                      />
                      <Button
                        variant="contained"
                        onClick={() => perform(
                          () => api.createVersion(document.id, versionForm),
                          'New version created'
                        )}
                      >
                        Save new version
                      </Button>
                    </Stack>
                  ) : null}

                  {isAdmin && !isDeleted ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6" color="error">Admin archive</Typography>
                      <Alert severity="warning">Archive hides the document from active views and preserves history for later restore.</Alert>
                      <Button color="error" variant="contained" onClick={handleDeleteDocument}>
                        Archive document
                      </Button>
                    </Stack>
                  ) : null}

                  {isAdmin && isDeleted ? (
                    <Stack spacing={2}>
                      <Divider />
                      <Typography variant="h6" color="success.main">Admin restore</Typography>
                      <Button color="success" variant="contained" onClick={handleRestoreDocument}>
                        Restore document
                      </Button>
                    </Stack>
                  ) : null}
                </Stack>
              ) : null}

              {activeTab === 1 ? (
                <List>
                  {document.versions.map((version) => (
                    <ListItem key={version.id} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={`Version ${version.versionNumber} · ${version.changeSummary || 'No summary'}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2">By {version.createdBy} on {formatDate(version.createdAt)}</Typography>
                            <br />
                            <span className="monospace">{version.checksum}</span>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : null}

              {activeTab === 2 ? (
                <List>
                  {document.approvals.map((approval) => (
                    <ListItem key={approval.id} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemText
                        primary={`${approval.action} by ${approval.actorUsername}`}
                        secondary={`${approval.remarks || 'No remarks'} · ${formatDate(approval.createdAt)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Box>
    </Drawer>
  );
}

