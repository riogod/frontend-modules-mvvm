import { type FC } from 'react';
import { type ICompleteActions } from './interface';
import {
  RadioButtonUncheckedIcon,
  CheckCircleIcon,
  MuiIconButton,
  type IconButtonProps,
} from '@platform/ui';
import { observer } from 'mobx-react-lite';

const TodoItemActionComplete: FC<ICompleteActions> = ({
  item,
  setComplete,
}) => {
  const iconButtonProps: IconButtonProps = {
    color: item.completed ? 'success' : 'error',
    onClick: setComplete,
  };

  const icon = item.completed ? (
    <CheckCircleIcon fontSize="medium" />
  ) : (
    <RadioButtonUncheckedIcon fontSize="medium" />
  );

  return (
    <MuiIconButton
      {...iconButtonProps}
      aria-label={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {icon}
    </MuiIconButton>
  );
};

export default observer(TodoItemActionComplete);
