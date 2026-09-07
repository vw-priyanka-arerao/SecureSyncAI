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
          background: 'rgba(124, 58, 237, 0.16)'
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
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Total" value={dashboard.totalDocuments} accent="#0f62fe" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Draft" value={dashboard.draftDocuments} accent="#64748b" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Submitted" value={dashboard.submittedDocuments} accent="#0284c7" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Under review" value={dashboard.underReviewDocuments} accent="#d97706" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Approved" value={dashboard.approvedDocuments} accent="#16a34a" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Unread alerts" value={dashboard.unreadNotifications} accent="#7c3aed" /></Grid>
            <Grid item xs={12} sm={6} lg={2}><MetricCard label="Overdue reminders" value={dashboard.overdueNotifications || 0} accent="#dc2626" /></Grid>
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
              '@keyframes aiPulse': {
                '0%': {
                  transform: 'scale(1)',
                  boxShadow: '0 18px 40px rgba(124, 58, 237, 0.35)'
                },
                '50%': {
                  transform: 'scale(1.03)',
                  boxShadow: '0 22px 48px rgba(37, 99, 235, 0.32)'
                },
                '100%': {
                  transform: 'scale(1)',
                  boxShadow: '0 18px 40px rgba(124, 58, 237, 0.35)'
                  }
                },
                '@keyframes aiBlink': {
                  '0%, 100%': {
                    opacity: 1,
                    textShadow: '0 0 0 rgba(255,255,255,0)'
                  },
                  '50%': {
                    opacity: 0.72,
                    textShadow: '0 0 10px rgba(255,255,255,0.55)'
                  }
                },
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
                  borderRadius: 4,
                  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.82) 100%)',
                  backdropFilter: 'blur(18px)',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.10) 0%, rgba(37,99,235,0.06) 55%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none'
                  }
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
                          color: '#fff',
                          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                          boxShadow: '0 10px 24px rgba(124, 58, 237, 0.24)'
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
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                          color: '#fff',
                          boxShadow: '0 10px 26px rgba(37, 99, 235, 0.18)'
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
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.72)',
                          border: '1px solid rgba(148, 163, 184, 0.18)',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
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
                              color: '#fff',
                              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
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
                            borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
                            borderRadius: 3,
                            transition: 'background-color 160ms ease, transform 160ms ease',
                            animation: 'resultFadeIn 220ms ease',
                            animationDelay: `${Math.min(index * 60, 240)}ms`,
                            animationFillMode: 'both',
                            '&:hover': {
                              backgroundColor: 'rgba(124, 58, 237, 0.06)',
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
                            borderRadius: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.58)',
                            border: '1px dashed rgba(148, 163, 184, 0.35)'
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
                              color: '#fff',
                              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
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
                      borderTop: '1px solid rgba(148, 163, 184, 0.18)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 24%, rgba(255,255,255,0.66) 100%)'
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
                            borderColor: 'rgba(124, 58, 237, 0.22)',
                            backgroundColor: 'rgba(255, 255, 255, 0.58)',
                            '&:hover': {
                              backgroundColor: 'rgba(124, 58, 237, 0.08)'
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
                        sx={{ px: 2.5, minWidth: { sm: 132 }, borderRadius: 999 }}
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
                height: 56,
                borderRadius: 999,
                color: '#fff',
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                boxShadow: '0 18px 40px rgba(124, 58, 237, 0.35)',
                animation: chatbotOpen ? 'none' : 'aiPulse 3.2s ease-in-out infinite',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6d28d9 0%, #1d4ed8 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 22px 48px rgba(124, 58, 237, 0.42)'
                }
              }}
            >
              <AskAiLabel
                iconSx={askAiRobotIconSx.fab}
                spacing={0.9}
                textSx={{
                  letterSpacing: 0.2,
                  animation: chatbotOpen ? 'none' : 'aiBlink 1.9s ease-in-out infinite'
                }}
              />
            </Fab>
          </Box>
        </>
      ) : null}
    </Stack>
  );
}

