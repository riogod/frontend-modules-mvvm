import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { JokesModel } from '../models/jokes.model';
import { JokesRepository } from '../data/jokes.repository';
import { AppModel } from '@host/modules/core/models/app.model';
import { API_EXAMPLE_DI_TOKENS } from '../config/di.tokens';
import { IOC_CORE_TOKENS, executeWithAbortHandling } from '@platform/core';

@injectable()
export class GetJokeUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(API_EXAMPLE_DI_TOKENS.REPOSITORY_JOKE)
    private jokesRepository: JokesRepository,
    @inject(API_EXAMPLE_DI_TOKENS.MODEL_JOKE)
    private jokesModel: JokesModel,
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    await executeWithAbortHandling({
      requestFn: async () => {
        const joke = await this.jokesRepository.getJoke();
        return joke && joke.length > 0 ? joke[0] : null;
      },
      getPreviousData: () => this.jokesModel.joke,
      setData: (joke) => {
        if (joke) {
          this.jokesModel.setJoke(joke);
        }
      },
      setLoading: (loading) => {
        this.jokesModel.loading = loading;
      },
      onError: (error) => {
        if (error instanceof Error) {
          this.appModel.notification = error.message;
        }
      },
      requestIdTracker: this.requestIdTracker,
    });
  }
}
