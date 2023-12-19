import { FC, memo } from 'react';
import Box from '@mui/material/Box';
import { IActions } from './interface.ts';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@todo/ui';

const TodoItemActions: FC<IActions> = ({ removeItemHandler }) => {
  const { t } = useTranslation('todo');
  return (
    <Box
      className="actionIcon"
      sx={{
        height: 1,
        display: 'none',
        opacity: 0,
        transition: '0.1s ease-out',
      }}
    >
      <IconButton
        icon={<DeleteForeverIcon fontSize="small" />}
        color="error"
        size="small"
        variant="outlined"
        aria-label={t('item.delete')}
        title={t('item.delete')}
        onClick={removeItemHandler}
      />
    </Box>
  );
};

export default memo(TodoItemActions);
