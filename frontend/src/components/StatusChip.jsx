import { Chip } from '@mui/material';

const statusColorMap = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
};

export default function StatusChip({ status }) {
  return <Chip size="small" color={statusColorMap[status] || 'default'} label={status || 'UNKNOWN'} />;
}

