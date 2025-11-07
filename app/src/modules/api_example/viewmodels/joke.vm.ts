import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { JokesModel } from "../models/jokes.model.ts";
import { GetJokeUsecase } from "../usecases/getJoke.usecase.ts";

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
    @inject(GetJokeUsecase)
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
