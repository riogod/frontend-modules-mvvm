import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { JokesModel } from "../models/jokes.model.ts";

@injectable()
export class JokeViewModel {
  get loading() {
    return this.jokesModel.loading;
  }

  get joke() {
    return this.jokesModel.joke;
  }
  constructor(
    @inject(JokesModel)
    private jokesModel: JokesModel,
  ) {
    makeAutoObservable(this);
  }

  async getJoke() {
    await this.jokesModel.getJoke();
  }

  dispose() {
    this.jokesModel.dispose();
  }
}
