import { createContext } from "react";
import { type Container } from "inversify";

const DIContext = createContext<Container | null>(null);

if (process.env.NODE_ENV !== "production") {
  DIContext.displayName = "DIContext";
}

export { DIContext };
