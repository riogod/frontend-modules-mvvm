import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'primary',
    size: 'medium',
    disabled: false,
  },
};

export const Secondary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'secondary',
    size: 'medium',
  },
};

export const Small: Story = {
  args: {
    children: <DeleteIcon />,
    size: 'small',
  },
};

export const Large: Story = {
  args: {
    children: <DeleteIcon />,
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    children: <DeleteIcon />,
    disabled: true,
  },
};
