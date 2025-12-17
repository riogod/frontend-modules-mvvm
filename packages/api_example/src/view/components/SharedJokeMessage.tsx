import { type ComponentType, lazy } from 'react';
import { type SharedJokeMessageProps } from './JokeMessage';

// Реализуем lazy обертку для шаринга компонента между MFE модулями
const SharedJokeMessage = lazy<ComponentType<SharedJokeMessageProps>>(
  () => import('./JokeMessage'),
);

export default SharedJokeMessage;
