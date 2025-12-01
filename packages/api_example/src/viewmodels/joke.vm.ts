import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { JokesModel } from '../models/jokes.model';
import { GetJokeUsecase } from '../usecases/getJoke.usecase';
import { API_EXAMPLE_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class JokeViewModel {
  get loading() {
    return this.jokesModel.loading;
  }

  get joke() {
    return this.jokesModel.joke;
  }
  constructor(
    @inject(API_EXAMPLE_DI_TOKENS.MODEL_JOKE)
    private jokesModel: JokesModel,
    @inject(API_EXAMPLE_DI_TOKENS.USECASE_GET_JOKE)
    private getJokeUsecase: GetJokeUsecase,
  ) {
    makeAutoObservable(this);
  }

  async getJoke() {
    await this.getJokeUsecase.execute();
  }

  dispose() {
    this.jokesModel.dispose();
  }
}
