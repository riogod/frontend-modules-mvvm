import "reflect-metadata";
import { beforeEach } from "vitest";
import "vitest-canvas-mock";
import "@testing-library/jest-dom";

beforeEach(() => {
  process.env.NODE_ENV = "test";
});
