import { type FC, type ReactNode } from 'react';
import { IconButton as MuiIconButton } from '@mui/material';

export interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?:
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  title?: string;
  'aria-label'?: string;
}

export const IconButton: FC<IconButtonProps> = ({
  children,
  onClick,
  disabled = false,
  size = 'medium',
  color = 'primary',
}) => {
  return (
    <MuiIconButton
      onClick={onClick}
      disabled={disabled}
      size={size}
      color={color}
    >
      {children}
    </MuiIconButton>
  );
};
