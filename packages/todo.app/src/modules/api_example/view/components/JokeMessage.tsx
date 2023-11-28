import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useVM } from "../../../../ui/hooks/useVM.ts";
import { JokeViewModel } from "../../viewmodels/joke.vm.ts";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";

const JokeMessage: FC = () => {
  const jokeMessage = useVM<JokeViewModel>(JokeViewModel);

  const getJoke = async () => {
    await jokeMessage.getJoke();
  };

  if (jokeMessage.loading) {
    return (
      <Skeleton
        animation="wave"
        variant="rounded"
        height={300}
        sx={{ width: 1 }}
      />
    );
  }

  const jokeContent = jokeMessage.joke ? (
    <>
      {jokeMessage.joke?.setup}
      <br />
      <br />
      {jokeMessage.joke?.punchline}
    </>
  ) : (
    "Ups... Joke not found"
  );

  return (
    <Card
      sx={{
        width: 1,
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CardContent>
        <Typography variant="body2">{jokeContent}</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={getJoke}>
          Get Joke Again
        </Button>
      </CardActions>
    </Card>
  );
};

export default observer(JokeMessage);
