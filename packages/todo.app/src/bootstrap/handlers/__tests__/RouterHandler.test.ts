import { vi, describe, expect, test } from "vitest";
import { Bootstrap } from "../../index.ts";
import { RouterHandler } from "../RouterHandler.ts";

describe("RouterHandler", () => {
  const bootstrapMock: Bootstrap = {
    routerService: { initRouter: vi.fn() },
  } as any;

  test("should call initRouter with params", async () => {
    const testUrl = "test_url";
    const testPrefix = "test_prefix";
    const testRoutes = [{ path: "test_path", component: () => null }];

    const handler = new RouterHandler({
      apiUrl: testUrl,
      appPrefix: testPrefix,
      routes: testRoutes,
    });

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.routerService.initRouter).toBeCalledWith(
      testRoutes,
      testPrefix,
    );
  });
});
