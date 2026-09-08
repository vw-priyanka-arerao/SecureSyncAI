import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DocumentCreateDialog from '../components/DocumentCreateDialog';
import DistributionListDialog from '../components/DistributionListDialog';
import DocumentDetailDrawer from '../components/DocumentDetailDrawer';
import StatusChip from '../components/StatusChip';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

export default function DocumentsPage({ api, user, showMessage }) {
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [distributionLists, setDistributionLists] = useState([]);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [openCreateDl, setOpenCreateDl] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const canManageDistributionLists = isAdmin || user?.role === 'SUB_ADMIN';

  const loadDocuments = useCallback(async () => {
    setError('');
    try {
      setDocuments(await api.listDocuments(isAdmin && showDeleted));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load documents');
      showMessage(loadError.message || 'Unable to load documents', 'error');
    }
  }, [api, isAdmin, showDeleted, showMessage]);

  const loadUsers = useCallback(async () => {
    try {
      const [allUsers, reviewerUsers, lists] = await Promise.all([
        api.listUsers(false),
        api.listUsers(true),
        api.listDistributionLists()
      ]);
      setUsers(allUsers);
      setDistributionLists(lists);
      setReviewers([
        ...reviewerUsers,
        ...lists.map((list) => ({ ...list, role: 'DISTRIBUTION_LIST', displayName: list.name }))
      ]);
    } catch (loadError) {
      showMessage(loadError.message || 'Unable to load users', 'error');
    }
  }, [api, showMessage]);

  useEffect(() => {
    loadDocuments();
    loadUsers();
  }, [loadDocuments, loadUsers]);

  async function handleCreate(payload) {
    const normalizedNextReviewAt = payload.nextReviewAt ? new Date(payload.nextReviewAt).toISOString() : undefined;
    const normalizedReviewCycleDays = payload.reviewCycleDays ? Number(payload.reviewCycleDays) : undefined;
    if (payload.useFileUpload && payload.file) {
      await api.uploadDocument({
        title: payload.title,
        category: payload.category,
        ownerUsername: payload.ownerUsername,
        reviewerUsername: payload.reviewerUsername,
        changeSummary: payload.changeSummary,
        reviewCycleDays: normalizedReviewCycleDays,
        nextReviewAt: normalizedNextReviewAt,
        file: payload.file
      });
    } else {
      await api.createDocument({
        title: payload.title,
        category: payload.category,
        ownerUsername: payload.ownerUsername,
        reviewerUsername: payload.reviewerUsername,
        content: payload.content,
        changeSummary: payload.changeSummary,
        reviewCycleDays: normalizedReviewCycleDays,
        nextReviewAt: normalizedNextReviewAt
      });
    }
    showMessage('Document created successfully', 'success');
    await loadDocuments();
  }

  async function handleCreateDistributionList(payload) {
    await api.createDistributionList(payload);
    showMessage('Distribution List created successfully', 'success');
    await loadUsers();
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Documents</Typography>
          <Typography color="text.secondary">Upload, review, version, and approve controlled ISMS artifacts.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          {isAdmin ? (
            <FormControlLabel
              control={<Switch checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />}
              label="Show deleted"
            />
          ) : null}
          {canManageDistributionLists ? (
            <Button variant="outlined" onClick={() => setOpenCreateDl(true)}>Create DL</Button>
          ) : null}
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenCreate(true)}>
            New document
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => (
                <TableRow
                  key={document.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDocumentId(document.id)}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{document.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{document.documentKey}</Typography>
                  </TableCell>
                  <TableCell>{document.category}</TableCell>
                  <TableCell>{document.ownerUsername}</TableCell>
                  <TableCell><StatusChip status={document.status} /></TableCell>
                  <TableCell>v{document.currentVersion}</TableCell>
                  <TableCell>
                    {reviewers.find((reviewer) => reviewer.username === document.assignedReviewer)
                      ? `${reviewers.find((reviewer) => reviewer.username === document.assignedReviewer).email} (${reviewers.find((reviewer) => reviewer.username === document.assignedReviewer).role})`
                      : document.assignedReviewer || '—'}
                  </TableCell>
                  <TableCell>{formatDate(document.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {!documents.length ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography sx={{ py: 3, textAlign: 'center' }} color="text.secondary">
                      No documents yet. Create the first ISMS document to begin the workflow.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreate={handleCreate}
        user={user}
        reviewerOptions={reviewers}
        ownerOptions={users}
      />

      <DistributionListDialog
        open={openCreateDl}
        onClose={() => setOpenCreateDl(false)}
        onCreate={handleCreateDistributionList}
        memberOptions={users}
      />

      <DocumentDetailDrawer
        open={Boolean(selectedDocumentId)}
        documentId={selectedDocumentId}
        user={user}
        api={api}
        onClose={() => setSelectedDocumentId(null)}
        onChanged={loadDocuments}
        showMessage={showMessage}
        includeDeleted={isAdmin && showDeleted}
        reviewerOptions={reviewers}
      />
    </Stack>
  );
}

