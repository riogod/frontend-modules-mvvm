import { vi, describe, expect, test } from "vitest";
import { Bootstrap } from "../../index.ts";
import { ModulesHandler } from "../ModulesHandler.ts";

describe("ModulesHandler", () => {
  const bootstrapMock: Bootstrap = {
    initModules: vi.fn(),
  } as any;

  test("should call initModules bootstrap method", async () => {
    const handler = new ModulesHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initModules).toBeCalled();
  });
});
