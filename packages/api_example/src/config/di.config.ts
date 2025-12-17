import type { Container } from 'inversify';
import { API_EXAMPLE_DI_TOKENS } from './di.tokens';

// Re-export for backward compatibility
export { API_EXAMPLE_DI_TOKENS };

import { JokesRepository } from '../data/jokes.repository';
import { JokesModel } from '../models/jokes.model';
import { GetJokeUsecase } from '../usecases/getJoke.usecase';
import { JokeViewModel } from '../viewmodels/joke.vm';
import SharedJokeMessage from '../view/components/SharedJokeMessage';

export const DI_CONFIG = (container: Container) => {
  container.bind(API_EXAMPLE_DI_TOKENS.REPOSITORY_JOKE).to(JokesRepository);
  container.bind(API_EXAMPLE_DI_TOKENS.VIEW_MODEL_JOKE).to(JokeViewModel);
  container.bind(API_EXAMPLE_DI_TOKENS.USECASE_GET_JOKE).to(GetJokeUsecase);
  container.bind(API_EXAMPLE_DI_TOKENS.MODEL_JOKE).to(JokesModel);
  container
    .bind(API_EXAMPLE_DI_TOKENS.COMPONENT_API_CALL_EXAMPLE)
    .toConstantValue(SharedJokeMessage);
  return container;
};
