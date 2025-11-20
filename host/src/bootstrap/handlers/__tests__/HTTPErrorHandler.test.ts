import { HTTPErrorHandler } from "../HTTPErrorHandler.ts";

describe("HTTPErrorHandler", () => {
  test("should call handle with the bootstrap argument", async () => {
    const bootstrap = {} as any;
    const handler = new HTTPErrorHandler({});

    const superHandleSpy = vi.spyOn(handler, "handle");

    const result = await handler.handle(bootstrap);

    expect(superHandleSpy).toHaveBeenCalledWith(bootstrap);
    expect(result).toBe(bootstrap);
  });
});
