import { FC } from 'react';
import { IProps } from './interfaces';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

const IconButton: FC<IProps> = ({ icon, title, ...props }) => {
  return (
    <Tooltip title={title}>
      <Button {...props} sx={{ ml: 1, padding: '8px 8px', minWidth: 'unset' }}>
        {icon}
      </Button>
    </Tooltip>
  );
};

export default IconButton;
