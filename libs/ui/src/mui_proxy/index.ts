/**
 * Прокси-экспорты MUI компонентов для tree shaking
 *
 * Все компоненты экспортируются напрямую из @mui/material,
 * что позволяет bundler'у правильно выполнять tree shaking.
 *
 * MUI использует default exports, поэтому мы импортируем их
 * и реэкспортируем как named exports для удобства использования.
 *
 * Использование:
 * import { Button, TextField } from '@platform/ui';
 */

// Layout components
export { default as Box } from '@mui/material/Box';
export { default as Container } from '@mui/material/Container';
export { default as Grid } from '@mui/material/Grid';
export { default as Stack } from '@mui/material/Stack';
export { default as Paper } from '@mui/material/Paper';

// Input components
export { default as TextField } from '@mui/material/TextField';
export { default as Button } from '@mui/material/Button';
export { default as MuiIconButton } from '@mui/material/IconButton';
export { default as Autocomplete } from '@mui/material/Autocomplete';
export { default as Checkbox } from '@mui/material/Checkbox';
export { default as Radio } from '@mui/material/Radio';
export { default as Switch } from '@mui/material/Switch';
export { default as Slider } from '@mui/material/Slider';
export { default as Select } from '@mui/material/Select';
export { default as FormControl } from '@mui/material/FormControl';
export { default as FormControlLabel } from '@mui/material/FormControlLabel';
export { default as InputLabel } from '@mui/material/InputLabel';
export { default as Input } from '@mui/material/Input';
export { default as InputBase } from '@mui/material/InputBase';
export { default as OutlinedInput } from '@mui/material/OutlinedInput';
export { default as FilledInput } from '@mui/material/FilledInput';
export { default as Fab } from '@mui/material/Fab';

// Navigation components
export { default as AppBar } from '@mui/material/AppBar';
export { default as Toolbar } from '@mui/material/Toolbar';
export { default as Drawer } from '@mui/material/Drawer';
export { default as MuiMenu } from '@mui/material/Menu';
export { default as MenuItem } from '@mui/material/MenuItem';
export { default as Breadcrumbs } from '@mui/material/Breadcrumbs';
export { default as Link } from '@mui/material/Link';
export { default as Tabs } from '@mui/material/Tabs';
export { default as Tab } from '@mui/material/Tab';
export { default as BottomNavigation } from '@mui/material/BottomNavigation';
export { default as BottomNavigationAction } from '@mui/material/BottomNavigationAction';

// Feedback components
export { default as Alert } from '@mui/material/Alert';
export { default as AlertTitle } from '@mui/material/AlertTitle';
export { default as Snackbar } from '@mui/material/Snackbar';
export { default as Dialog } from '@mui/material/Dialog';
export { default as DialogTitle } from '@mui/material/DialogTitle';
export { default as DialogContent } from '@mui/material/DialogContent';
export { default as DialogActions } from '@mui/material/DialogActions';
export { default as Backdrop } from '@mui/material/Backdrop';
export { default as CircularProgress } from '@mui/material/CircularProgress';
export { default as LinearProgress } from '@mui/material/LinearProgress';
export { default as Skeleton } from '@mui/material/Skeleton';

// Data display components
export { default as Typography } from '@mui/material/Typography';
export { default as Card } from '@mui/material/Card';
export { default as CardContent } from '@mui/material/CardContent';
export { default as CardActions } from '@mui/material/CardActions';
export { default as CardHeader } from '@mui/material/CardHeader';
export { default as CardMedia } from '@mui/material/CardMedia';
export { default as Avatar } from '@mui/material/Avatar';
export { default as Chip } from '@mui/material/Chip';
export { default as Badge } from '@mui/material/Badge';
export { default as Divider } from '@mui/material/Divider';
export { default as List } from '@mui/material/List';
export { default as ListItem } from '@mui/material/ListItem';
export { default as ListItemButton } from '@mui/material/ListItemButton';
export { default as ListItemIcon } from '@mui/material/ListItemIcon';
export { default as ListItemText } from '@mui/material/ListItemText';
export { default as Table } from '@mui/material/Table';
export { default as TableBody } from '@mui/material/TableBody';
export { default as TableCell } from '@mui/material/TableCell';
export { default as TableContainer } from '@mui/material/TableContainer';
export { default as TableFooter } from '@mui/material/TableFooter';
export { default as TableHead } from '@mui/material/TableHead';
export { default as TablePagination } from '@mui/material/TablePagination';
export { default as TableRow } from '@mui/material/TableRow';
export { default as TableSortLabel } from '@mui/material/TableSortLabel';
export { default as Tooltip } from '@mui/material/Tooltip';

// Surfaces
export { default as Accordion } from '@mui/material/Accordion';
export { default as AccordionSummary } from '@mui/material/AccordionSummary';
export { default as AccordionDetails } from '@mui/material/AccordionDetails';

// Utils
export { default as CssBaseline } from '@mui/material/CssBaseline';
export { default as ScopedCssBaseline } from '@mui/material/ScopedCssBaseline';

// Transitions
export { default as Collapse } from '@mui/material/Collapse';
export { default as Fade } from '@mui/material/Fade';
export { default as Grow } from '@mui/material/Grow';
export { default as Slide } from '@mui/material/Slide';
export { default as Zoom } from '@mui/material/Zoom';

// Theme (these use named exports)
export { ThemeProvider } from '@mui/material/styles';
export type { Theme } from '@mui/material/styles';
// ThemeOptions экспортируется из interfaces.ts с расширенными типами
export type { ThemeOptions } from '../theme/interfaces';
export { createTheme } from '@mui/material/styles';
export { useTheme } from '@mui/material/styles';
export { styled } from '@mui/material/styles';

export { default as ToggleButtonGroup } from '@mui/material/ToggleButtonGroup';
export { default as ToggleButton } from '@mui/material/ToggleButton';

export type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

export type { IconButtonProps } from '@mui/material/IconButton';
