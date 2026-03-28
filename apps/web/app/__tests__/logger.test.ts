import { logger } from "@/lib/logger";

describe("logger", () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  test("info logs with INFO level", () => {
    logger.info("test message");
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("INFO"));
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("test message"));
  });

  test("info includes context when provided", () => {
    logger.info("test message", "myContext");
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining("[myContext]"));
  });

  test("warn logs with WARN level", () => {
    logger.warn("warning message");
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining("WARN"));
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining("warning message"));
  });

  test("error logs with ERROR level", () => {
    logger.error("error message");
    expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining("ERROR"), undefined);
  });

  test("error includes error stack for Error instances", () => {
    const err = new Error("something broke");
    logger.error("error message", err, "auth");
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("[auth]"),
      expect.stringContaining("something broke"),
    );
  });

  test("error includes raw value for non-Error throws", () => {
    logger.error("error message", "raw string error");
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("error message"),
      "raw string error",
    );
  });

  test("log entries include ISO timestamp", () => {
    logger.info("timestamp test");
    const call = consoleSpy.log.mock.calls[0][0];
    expect(call).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
