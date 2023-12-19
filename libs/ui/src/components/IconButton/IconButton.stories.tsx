import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './index';
import SettingsIcon from '@mui/icons-material/Settings';

const meta: Meta<typeof IconButton> = {
  component: IconButton,
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Primary: Story = {
  args: {},
  render: () => (
    <IconButton
      icon={<SettingsIcon fontSize="small" />}
      color="primary"
      size="small"
      variant="outlined"
    />
  ),
};
