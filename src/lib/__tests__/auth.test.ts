// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
}));

// Import after mocks are set up
const { createSession, getSession, deleteSession, verifySession } =
  await import("../auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");
const COOKIE_NAME = "auth-token";

async function makeValidToken(overrides: Record<string, unknown> = {}) {
  return new SignJWT({
    userId: "user-1",
    email: "test@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets an httpOnly cookie with a JWT", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, _token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe(COOKIE_NAME);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
  });

  test("cookie expires in ~7 days", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const expiresMs = options.expires.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("token is a valid JWT containing userId and email", async () => {
    const { jwtVerify } = await import("jose");
    await createSession("user-42", "hello@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@example.com");
  });

  test("JWT is signed with HS256", async () => {
    const { decodeProtectedHeader } = await import("jose");
    await createSession("user-1", "test@example.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    const header = decodeProtectedHeader(token);

    expect(header.alg).toBe("HS256");
  });

  test("JWT expiration matches the cookie expiration (~7 days)", async () => {
    const { jwtVerify } = await import("jose");
    await createSession("user-1", "test@example.com");

    const [, token, options] = mockCookieStore.set.mock.calls[0];
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // JWT exp (seconds) and cookie expires (ms) should agree within 1 second
    const jwtExpiresMs = (payload.exp as number) * 1000;
    const cookieExpiresMs = options.expires.getTime();
    expect(Math.abs(jwtExpiresMs - cookieExpiresMs)).toBeLessThan(1000);
  });

  test("cookie is not secure in development (NODE_ENV=test)", async () => {
    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieStore.set.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  test("cookie is secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await createSession("user-1", "test@example.com");

    const [, , options] = mockCookieStore.set.mock.calls[0];
    expect(options.secure).toBe(true);

    vi.unstubAllEnvs();
  });

  test("only sets the cookie once per call", async () => {
    await createSession("user-1", "test@example.com");
    expect(mockCookieStore.set).toHaveBeenCalledOnce();
  });

  test("different users produce different tokens", async () => {
    await createSession("user-1", "alice@example.com");
    await createSession("user-2", "bob@example.com");

    const token1 = mockCookieStore.set.mock.calls[0][1];
    const token2 = mockCookieStore.set.mock.calls[1][1];
    expect(token1).not.toBe(token2);
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null when cookie contains an invalid token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-valid-jwt" });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const token = await makeValidToken();
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-1");
    expect(session?.email).toBe("test@example.com");
  });

  test("returned payload contains expiresAt", async () => {
    const token = await makeValidToken();
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();

    expect(session?.expiresAt).toBeDefined();
  });

  test("returned payload reflects the token's userId and email exactly", async () => {
    const token = await makeValidToken({ userId: "user-99", email: "unique@example.com" });
    mockCookieStore.get.mockReturnValue({ value: token });

    const session = await getSession();

    expect(session?.userId).toBe("user-99");
    expect(session?.email).toBe("unique@example.com");
  });

  test("returns null for a token signed with a different secret", async () => {
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const token = await new SignJWT({ userId: "u1", email: "a@b.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(wrongSecret);

    mockCookieStore.get.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for a token signed with a different algorithm", async () => {
    // A JWT with a tampered header (HS512 instead of HS256) should fail verification
    const { generateSecret } = await import("jose");
    const hs512Key = await generateSecret("HS512");
    const token = await new SignJWT({ userId: "u1", email: "a@b.com" })
      .setProtectedHeader({ alg: "HS512" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(hs512Key);

    mockCookieStore.get.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("returns null for an expired token", async () => {
    const token = await new SignJWT({ userId: "u1", email: "a@b.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("0s")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 10)
      .sign(JWT_SECRET);

    mockCookieStore.get.mockReturnValue({ value: token });
    const session = await getSession();
    expect(session).toBeNull();
  });

  test("reads the cookie by the correct name", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await getSession();
    expect(mockCookieStore.get).toHaveBeenCalledWith(COOKIE_NAME);
  });

  test("returns null for an empty string token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "" });
    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe("deleteSession", () => {
  test("deletes the auth cookie", async () => {
    await deleteSession();
    expect(mockCookieStore.delete).toHaveBeenCalledWith(COOKIE_NAME);
  });
});

describe("verifySession", () => {
  function makeRequest(token?: string) {
    const headers = new Headers();
    if (token) headers.set("cookie", `${COOKIE_NAME}=${token}`);
    return new NextRequest("http://localhost/", { headers });
  }

  test("returns null when no cookie is present", async () => {
    const req = makeRequest();
    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  test("returns null when cookie contains an invalid token", async () => {
    const req = makeRequest("garbage");
    const session = await verifySession(req);
    expect(session).toBeNull();
  });

  test("returns session payload for a valid token", async () => {
    const token = await makeValidToken({ userId: "user-99", email: "req@test.com" });
    const req = makeRequest(token);

    const session = await verifySession(req);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-99");
    expect(session?.email).toBe("req@test.com");
  });

  test("returns null for an expired token", async () => {
    const token = await new SignJWT({ userId: "u1", email: "a@b.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("0s")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 10)
      .sign(JWT_SECRET);

    const req = makeRequest(token);
    const session = await verifySession(req);
    expect(session).toBeNull();
  });
});
