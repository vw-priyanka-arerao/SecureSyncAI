import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function MetricCard({ label, value, accent }) {
  return (
    <Card sx={{ borderTop: `4px solid ${accent || '#0f62fe'}` }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
