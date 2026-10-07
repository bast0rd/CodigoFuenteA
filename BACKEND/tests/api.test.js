jest.mock("../src/db", () => ({ pool: { query: jest.fn() } }));

const request = require("supertest");
const { pool } = require("../src/db");
const app = require("../src/app");

jest.setTimeout(20000);

beforeEach(() => pool.query.mockReset());

describe("Smoke test", () => {
  test("GET / responde estado ok", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Atlas", status: "ok" });
  });

  test("GET /openapi.json entrega la documentación", async () => {
    const res = await request(app).get("/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("paths");
  });
});

describe("POST /autenticacion/login", () => {
  test("usuario inexistente devuelve 401", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "nadie", password: "x" });
    expect(res.status).toBe(401);
  });

  test("contraseña incorrecta devuelve 401", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, nombre_usuario: "admin", contrasena_hash: "admin" }],
    });
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "mala" });
    expect(res.status).toBe(401);
  });

  test("credenciales válidas devuelven token", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, nombre_usuario: "admin", contrasena_hash: "admin" }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 1, empresa_id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("error de base de datos devuelve 500", async () => {
    pool.query.mockRejectedValueOnce(new Error("db caida"));
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ nombre_usuario: "admin", password: "admin" });
    expect(res.status).toBe(500);
  });
});
