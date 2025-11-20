import { FC, memo } from 'react';
import { Box, MuiIconButton, DeleteForeverIcon } from '@todo/ui';
import { IActions } from './interface.ts';
import { useTranslation } from 'react-i18next';

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
      <MuiIconButton
        color="error"
        size="small"
        aria-label={t('item.delete')}
        title={t('item.delete')}
        onClick={removeItemHandler}
      >
        <DeleteForeverIcon fontSize="small" />
      </MuiIconButton>
    </Box>
  );
};

export default memo(TodoItemActions);
