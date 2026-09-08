import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { Stack, Typography } from '@mui/material';

export default function AskAiLabel({
  iconSx,
  textSx,
  variant = 'body1',
  textComponent = 'span',
  fontWeight = 700,
  spacing = 0.75,
  color,
  stackProps,
  text = 'Ask AI'
}) {
  return (
    <Stack direction="row" spacing={spacing} alignItems="center" {...stackProps}>
      <SmartToyOutlinedIcon sx={iconSx} />
      <Typography component={textComponent} variant={variant} fontWeight={fontWeight} color={color} sx={textSx}>
        {text}
      </Typography>
    </Stack>
  );
}

