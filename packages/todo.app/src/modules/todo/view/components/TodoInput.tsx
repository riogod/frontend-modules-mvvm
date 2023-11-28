import { FC, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useVM } from "../../../../ui/hooks/useVM.ts";
import { TodoListViewModel } from "../../viewmodels/todo_list.vm.ts";
import { useTranslation } from "react-i18next";
import AddIcon from "@mui/icons-material/Add";

const TodoInput: FC = () => {
  const listViewModel = useVM<TodoListViewModel>(TodoListViewModel);
  const { t } = useTranslation("todo");
  const [value, setValue] = useState("");

  const handleChange = (e: any) => {
    setValue(e.target.value);
  };
  const setComplete = () => {
    if (!value) return;
    listViewModel.setItem(value);
    setValue("");
  };

  const onSaveHandler = (e: any) => {
    if (e.keyCode == 13 && e.ctrlKey) {
      setComplete();
    }
  };

  return (
    <Paper
      elevation={10}
      square
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: 1,
        height: 96,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Container
        sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <TextField
          fullWidth
          autoFocus
          multiline
          maxRows={3}
          value={value}
          variant="standard"
          id="outlined-uncontrolled"
          onKeyDown={onSaveHandler}
          onChange={handleChange}
          label={t("actions.inputHelper")}
        />
        <Box sx={{ minWidth: 64, display: "flex", justifyContent: "end" }}>
          <Fab disabled={!value} color="primary" onClick={setComplete}>
            <AddIcon fontSize="medium" />
          </Fab>
        </Box>
      </Container>
    </Paper>
  );
};

export default TodoInput;
