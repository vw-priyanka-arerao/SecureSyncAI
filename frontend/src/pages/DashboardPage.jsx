import { useEffect, useRef, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Card,
  CardContent,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Zoom
} from '@mui/material';
import AskAiLabel from '../components/AskAiLabel';
import DocumentDetailDrawer from '../components/DocumentDetailDrawer';
import MetricCard from '../components/MetricCard';
import StatusChip from '../components/StatusChip';
import { askAiRobotIconSx } from '../styles/askAiIconStyles';

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getHighlightTerms(query) {
  return Array.from(new Set((query.match(/[A-Za-z0-9]{3,}/g) || []).map((term) => term.toLowerCase()))).slice(0, 8);
}

function renderHighlightedText(text, query) {
  if (!text) {
    return '—';
  }

  const terms = getHighlightTerms(query);
  if (!terms.length) {
    return text;
  }

  const expression = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const lookup = new Set(terms);

  return text.split(expression).filter(Boolean).map((part, index) => (
    lookup.has(part.toLowerCase()) ? (
      <Box
        key={`${part}-${index}`}
        component="mark"
        sx={{
          px: 0.45,
          py: 0.05,
          borderRadius: 0.75,
          color: 'inherit',
          background: 'rgba(0, 64, 197, 0.12)'
        }}
      >
        {part}
      </Box>
    ) : part
  ));
}

const askAiSuggestions = [
  'Show me the latest Password Policy',
  'Which ISMS documents expire this month?',
  'Show documents pending review',
  'Find approved audit documents'
];


export default function DashboardPage({ api, user, showMessage }) {
  const [dashboard, setDashboard] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatbot, setChatbot] = useState({ answer: '', matches: [], totalMatches: 0 });
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [error, setError] = useState('');
  const chatInputRef = useRef(null);

  async function loadDashboard() {
    setError('');
    try {
      setDashboard(await api.getDashboard());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load dashboard');
      showMessage(loadError.message || 'Unable to load dashboard', 'error');
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [api, showMessage]);

  useEffect(() => {
    if (!chatbotOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      chatInputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [chatbotOpen]);

  useEffect(() => {
    if (!chatbotOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setChatbotOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatbotOpen]);

  async function runChatSearch(queryOverride) {
    const effectiveQuery = (queryOverride ?? chatQuery).trim();

    if (!effectiveQuery) {
      showMessage('Enter a query to search documents', 'warning');
      return;
    }

    if (queryOverride !== undefined) {
      setChatQuery(queryOverride);
    }

    setChatbotOpen(true);
    setChatbotLoading(true);
    try {
      const result = await api.chatbotQuery(effectiveQuery, 5);
      setChatbot(result);
    } catch (searchError) {
      showMessage(searchError.message || 'Unable to query chatbot', 'error');
    } finally {
      setChatbotLoading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
        <Typography color="text.secondary">Real-time status across ISMS drafting, approvals, and audit-readiness.</Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {dashboard ? (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Total" value={dashboard.totalDocuments} accent="#001e50" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Draft" value={dashboard.draftDocuments} accent="#8b8b8b" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Submitted" value={dashboard.submittedDocuments} accent="#0040c5" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Under review" value={dashboard.underReviewDocuments} accent="#b7791f" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Approved" value={dashboard.approvedDocuments} accent="#00b140" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Unread alerts" value={dashboard.unreadNotifications} accent="#002733" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Overdue reminders" value={dashboard.overdueNotifications || 0} accent="#b00020" /></Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Documents by category</Typography>
                  <List dense>
                    {Object.entries(dashboard.documentsByCategory || {}).map(([category, count]) => (
                      <ListItem key={category} sx={{ px: 0 }} secondaryAction={<Typography fontWeight={700}>{count}</Typography>}>
                        <ListItemText primary={category} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent documents</Typography>
                  <List>
                    {dashboard.recentDocuments?.map((document) => (
                      <ListItem key={document.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={document.title}
                          secondary={`Owner: ${document.ownerUsername} • Updated: ${formatDate(document.updatedAt)}`}
                        />
                        <StatusChip status={document.status} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent approval activity</Typography>
              <List>
                {dashboard.recentApprovals?.map((approval) => (
                  <ListItem key={approval.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={`${approval.action} by ${approval.actorUsername}`}
                      secondary={`${approval.remarks || 'No remarks'} • ${formatDate(approval.createdAt)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <DocumentDetailDrawer
            open={Boolean(selectedDocumentId)}
            documentId={selectedDocumentId}
            user={user}
            api={api}
            onClose={() => setSelectedDocumentId(null)}
            onChanged={loadDashboard}
            showMessage={showMessage}
          />

          <Box
            sx={{
              position: 'fixed',
              right: { xs: 16, md: 24 },
              bottom: { xs: 16, md: 24 },
              zIndex: 1200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              '@keyframes resultFadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(8px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)'
                }
              }
            }}
          >
            <Zoom in={chatbotOpen} unmountOnExit>
              <Card
                sx={{
                  width: { xs: 'calc(100vw - 32px)', sm: 420 },
                  maxWidth: '100%',
                  mb: 1.5,
                  display: 'flex',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                  border: '1px solid #dddddd',
                  backgroundColor: 'background.paper',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <CardContent sx={{ p: 2, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#ffffff',
                          backgroundColor: '#002733'
                        }}
                      >
                        <SmartToyOutlinedIcon sx={askAiRobotIconSx.avatar} />
                      </Box>
                      <Box>
                        <AskAiLabel iconSx={askAiRobotIconSx.heading} variant="h6" />
                        <Typography variant="body2" color="text.secondary">Your smart document assistant</Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small" onClick={() => setChatbotOpen(false)}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    Ask in plain language. AI answers stay filtered to your role permissions.
                  </Typography>

                  <Box sx={{ flex: 1, minHeight: 0, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                    {chatQuery.trim() ? (
                      <Box
                        sx={{
                          mb: 1.25,
                          ml: 'auto',
                          maxWidth: '88%',
                          px: 1.5,
                          py: 1.1,
                          borderRadius: 1.5,
                          backgroundColor: '#001e50',
                          color: '#ffffff'
                        }}
                      >
                        <Typography variant="caption" sx={{ opacity: 0.88, display: 'block', mb: 0.4 }}>
                          You asked
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                          {chatQuery}
                        </Typography>
                      </Box>
                    ) : null}

                    {chatbot.answer ? (
                      <Box
                        sx={{
                          mb: 2,
                          maxWidth: '92%',
                          px: 1.6,
                          py: 1.3,
                          borderRadius: 1.5,
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #dddddd'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#ffffff',
                              backgroundColor: '#002733'
                            }}
                          >
                            <SmartToyOutlinedIcon sx={askAiRobotIconSx.responseAvatar} />
                          </Box>
                          <AskAiLabel
                            iconSx={askAiRobotIconSx.responseLabel}
                            variant="caption"
                            color="text.secondary"
                            spacing={0.5}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {chatbot.answer}
                        </Typography>
                      </Box>
                    ) : null}

                    {chatbotLoading ? <Alert severity="info" sx={{ mb: 2 }}>Ask AI is thinking through your document search…</Alert> : null}

                    {!chatbotLoading && chatbot.answer ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mb: 1.25, px: 0.5 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {chatbot.totalMatches > 0
                            ? `Matched ${chatbot.totalMatches} document${chatbot.totalMatches === 1 ? '' : 's'}`
                            : 'No document matches yet'}
                        </Typography>
                        {chatbot.totalMatches > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            Tap a result to open details
                          </Typography>
                        ) : null}
                      </Stack>
                    ) : null}

                    <List sx={{ py: 0 }}>
                      {(chatbot.matches || []).map((match, index) => (
                        <ListItem
                          key={match.id}
                          sx={{
                            px: 1.25,
                            py: 1.25,
                            cursor: 'pointer',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            borderBottom: '1px solid #e5e5e5',
                            borderRadius: 1.5,
                            transition: 'background-color 160ms ease, transform 160ms ease',
                            animation: 'resultFadeIn 220ms ease',
                            animationDelay: `${Math.min(index * 60, 240)}ms`,
                            animationFillMode: 'both',
                            '&:hover': {
                              backgroundColor: '#f0f6ff',
                              transform: 'translateY(-1px)'
                            }
                          }}
                          onClick={() => setSelectedDocumentId(match.id)}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ListItemText
                              primary={(
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    whiteSpace: 'normal',
                                    overflowWrap: 'anywhere'
                                  }}
                                >
                                  {renderHighlightedText(match.title, chatQuery)}
                                </Typography>
                              )}
                              secondary={(
                                <Box sx={{ mt: 0.75 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      lineHeight: 1.6,
                                      whiteSpace: 'normal',
                                      overflowWrap: 'anywhere'
                                    }}
                                  >
                                    {`Owner: ${match.ownerUsername} • Score: ${match.relevanceScore} • Updated: ${formatDate(match.updatedAt)} • Next review: ${formatDate(match.nextReviewAt)}`}
                                  </Typography>
                                  {match.snippet ? (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        mt: 0.75,
                                        lineHeight: 1.55,
                                        whiteSpace: 'normal',
                                        overflowWrap: 'anywhere',
                                        wordBreak: 'break-word'
                                      }}
                                    >
                                      {renderHighlightedText(match.snippet, chatQuery)}
                                    </Typography>
                                  ) : null}
                                </Box>
                              )}
                              secondaryTypographyProps={{
                                component: 'div',
                                sx: {
                                  mt: 0.5,
                                  lineHeight: 1.5,
                                  whiteSpace: 'normal',
                                  overflowWrap: 'anywhere',
                                  wordBreak: 'break-word'
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ flexShrink: 0, pt: 0.5 }}>
                            <StatusChip status={match.status} />
                          </Box>
                        </ListItem>
                      ))}
                      {chatbot.totalMatches === 0 && chatbot.answer ? (
                        <Box
                          sx={{
                            py: 3,
                            px: 2,
                            textAlign: 'center',
                            borderRadius: 1.5,
                            backgroundColor: '#f5f5f5',
                            border: '1px dashed #cccccc'
                          }}
                        >
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              mx: 'auto',
                              mb: 1.25,
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#ffffff',
                              backgroundColor: '#002733'
                            }}
                          >
                            <SmartToyOutlinedIcon sx={askAiRobotIconSx.emptyStateAvatar} />
                          </Box>
                          <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                            No matching documents found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Try a shorter prompt, a document title keyword, or a review-related phrase within your accessible scope.
                          </Typography>
                        </Box>
                      ) : null}
                    </List>
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      pt: 1.75,
                      borderTop: '1px solid #dddddd'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25, px: 0.25 }}>
                      Results are filtered by your access permissions.
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                      {askAiSuggestions.map((suggestion) => (
                        <Chip
                          key={suggestion}
                          size="small"
                          label={suggestion}
                          clickable
                          variant="outlined"
                          onClick={() => runChatSearch(suggestion)}
                          sx={{
                            borderColor: '#cccccc',
                            backgroundColor: '#ffffff',
                            '&:hover': {
                              backgroundColor: '#f5f5f5'
                            }
                          }}
                        />
                      ))}
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Ask AI"
                        placeholder="Show pending policies or expiring documents"
                        autoFocus
                        inputRef={chatInputRef}
                        value={chatQuery}
                        onChange={(event) => setChatQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            runChatSearch();
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SmartToyOutlinedIcon sx={askAiRobotIconSx.input} />
                            </InputAdornment>
                          )
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={runChatSearch}
                        disabled={chatbotLoading}
                        startIcon={<SmartToyOutlinedIcon sx={askAiRobotIconSx.buttonStart} />}
                        sx={{ px: 2.5, minWidth: { sm: 132 } }}
                      >
                        {chatbotLoading ? 'Thinking...' : 'Ask AI'}
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Zoom>

            <Fab
              color="secondary"
              variant="extended"
              onClick={() => setChatbotOpen((open) => !open)}
              sx={{
                px: 2.5,
                height: 52,
                borderRadius: 1,
                color: '#ffffff',
                backgroundColor: '#001e50',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
                transition: 'background-color 160ms ease',
                '&:hover': {
                  backgroundColor: '#0040c5'
                }
              }}
            >
              <AskAiLabel
                iconSx={askAiRobotIconSx.fab}
                spacing={0.9}
                textSx={{ letterSpacing: 0.2 }}
              />
            </Fab>
          </Box>
        </>
      ) : null}
    </Stack>
  );
}

