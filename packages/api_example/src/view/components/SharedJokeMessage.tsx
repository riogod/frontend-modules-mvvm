import { lazy } from 'react';

// Реализуем lazy обертку для шаринга компонента между MFE модулями
const SharedJokeMessage = lazy(() => import('./JokeMessage'));

export default SharedJokeMessage;
