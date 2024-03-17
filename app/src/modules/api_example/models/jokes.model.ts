import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { JokesRepository } from '../data/jokes.repository.ts';
import { Joke } from './jokes.interface.ts';

@injectable()
export class JokesModel {
  private _loading = false;
  private _joke: Joke | null = null;

  get loading() {
    return this._loading;
  }

  set loading(loading: boolean) {
    this._loading = loading;
  }

  get joke() {
    return this._joke;
  }

  constructor(
    @inject(JokesRepository)
    private jokesRepository: JokesRepository,
  ) {
    makeAutoObservable(this);
  }

  async getJoke() {
    this.loading = true;

    try {
      const joke = await this.jokesRepository.getJoke();
      if (joke && joke.length > 0) {
        this._joke = joke[0];
      }
    } catch (error) {
      this._joke = null;
    } finally {
      this.loading = false;
    }
  }

  dispose() {
    this.loading = false;
    this._joke = null;
  }
}
