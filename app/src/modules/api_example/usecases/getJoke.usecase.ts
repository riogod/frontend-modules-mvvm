import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { JokesModel } from "../models/jokes.model";
import { JokesRepository } from "../data/jokes.repository";
import { AppModel } from "../../_init_modules/core/models/app.model";

@injectable()
export class GetJokeUsecase {

  constructor(
    @inject(JokesRepository)
    private jokesRepository: JokesRepository,
    @inject(JokesModel)
    private jokesModel: JokesModel,
    @inject(AppModel)
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
