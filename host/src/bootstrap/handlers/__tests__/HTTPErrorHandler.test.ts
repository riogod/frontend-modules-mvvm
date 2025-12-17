import { HTTPErrorHandler } from "../HTTPErrorHandler.ts";

describe("HTTPErrorHandler", () => {
  test("должен вызывать handle с аргументом bootstrap", async () => {
    const bootstrap = {} as any;
    const handler = new HTTPErrorHandler({});

    const superHandleSpy = vi.spyOn(handler, "handle");

    const result = await handler.handle(bootstrap);

    expect(superHandleSpy).toHaveBeenCalledWith(bootstrap);
    expect(result).toBe(bootstrap);
  });
});
