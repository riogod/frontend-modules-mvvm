import { makeAutoObservable, runInAction } from 'mobx';
import { inject, injectable } from 'inversify';
import { JokesRepository } from '../data/jokes.repository.ts';
import { Joke } from './jokes.interface.ts';
import { API_EXAMPLE_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class JokesModel {
  private _loading = false;
  private _joke: Joke | null = null;

  get loading() {
    return this._loading;
  }

  set loading(loading: boolean) {
    runInAction(() => {
      this._loading = loading;
    });
  }

  get joke() {
    return this._joke;
  }

  constructor(
    @inject(API_EXAMPLE_DI_TOKENS.REPOSITORY_JOKE)
    private jokesRepository: JokesRepository,
  ) {
    makeAutoObservable(this);
  }

  setJoke(joke: Joke) {
    runInAction(() => {
      this._joke = joke;
    });
  }

  dispose() {
    runInAction(() => {
      this.loading = false;
      this._joke = null;
    });
  }
}
