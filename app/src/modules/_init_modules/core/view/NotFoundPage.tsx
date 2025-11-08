import { FC } from "react";
import Container from "@mui/material/Container";
import NotFoundImage from "../assets/NotFound.svg?react";

const NotFoundPage: FC = () => {
  return (
    <Container
      sx={{
        height: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <NotFoundImage
        style={{
          width: "inherit",
          maxWidth: 500,
        }}
      />
    </Container>
  );
};

export default NotFoundPage;
