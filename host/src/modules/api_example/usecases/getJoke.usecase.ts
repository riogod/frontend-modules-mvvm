import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { JokesModel } from '../models/jokes.model';
import { JokesRepository } from '../data/jokes.repository';
import { AppModel } from '../../core/models/app.model';
import { API_EXAMPLE_DI_TOKENS } from '../config/di.tokens';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class GetJokeUsecase {
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
    this.jokesModel.loading = true;

    try {
      const joke = await this.jokesRepository.getJoke();
      if (joke && joke.length > 0) {
        this.jokesModel.setJoke(joke[0]);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.appModel.notification = error.message;
      }
      throw error;
    } finally {
      this.jokesModel.loading = false;
    }
  }
}
