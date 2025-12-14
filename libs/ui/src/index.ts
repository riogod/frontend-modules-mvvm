// UI Components
export * from './components';
export { DIContext, setGlobalDIContainer } from './contexts';
export { DIProvider } from './providers/DIProvider';
export { useVM } from './hooks/useVM';

// Theme
export { themeDark } from './theme/themeDark';
export { themeLight } from './theme/themeLight';
export { theme } from './theme/theme';
export { syncCssVariables } from './theme/syncCssVariables';
export { CssVariablesSync } from './theme/CssVariablesSync';

// Utils
export * as merge from './utils/merge';

// MUI Components (proxied for tree shaking)
// Note: IconButton is exported from ./components, not from MUI
export {
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  TextField,
  Button,
  Autocomplete,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Select,
  FormControl,
  FormControlLabel,
  InputLabel,
  Input,
  InputBase,
  OutlinedInput,
  FilledInput,
  AppBar,
  Toolbar,
  Drawer,
  MuiMenu,
  MenuItem,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  BottomNavigation,
  BottomNavigationAction,
  Alert,
  AlertTitle,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  CardMedia,
  Avatar,
  Chip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CssBaseline,
  ScopedCssBaseline,
  Collapse,
  Fade,
  Grow,
  Slide,
  Zoom,
  ThemeProvider,
  createTheme,
  useTheme,
  styled,
  MuiIconButton,
  ToggleButtonGroup,
  ToggleButton,
  Fab,
} from './mui_proxy';

// MUI Types
export type {
  Theme,
  ThemeOptions,
  MuiAppBarProps,
  IconButtonProps,
} from './mui_proxy';

// MUI Icons (proxied for tree shaking)
export * from './mui_proxy/icons';
