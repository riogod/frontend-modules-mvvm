import "reflect-metadata";
import { beforeEach } from "vitest";
import "vitest-canvas-mock";

beforeEach(() => {
  process.env.NODE_ENV = "test";
});

