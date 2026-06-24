const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { app } = require("../src/app");
const { prisma } = require("../src/lib/prisma");

async function cleanup() {
  await prisma.job.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}

async function createAuthToken() {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email: `test-${Date.now()}-${Math.random()}@example.com`,
      password: "secret123"
    })
    .expect(201);

  return response.body.data.token;
}

test.beforeEach(async () => {
  await cleanup();
});

test.after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

test("health endpoint returns ok", async () => {
  const response = await request(app).get("/health").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.service, "islik-cloud-api");
});

test("auth register, login and me work", async () => {
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Auth User",
      email: "auth@example.com",
      password: "secret123"
    })
    .expect(201);

  assert.ok(registerResponse.body.data.token);
  assert.equal(registerResponse.body.data.user.email, "auth@example.com");
  assert.equal(registerResponse.body.data.user.passwordHash, undefined);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: "auth@example.com",
      password: "secret123"
    })
    .expect(200);

  assert.ok(loginResponse.body.data.token);

  const meResponse = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${loginResponse.body.data.token}`)
    .expect(200);

  assert.equal(meResponse.body.data.user.email, "auth@example.com");
});

test("protected routes reject unauthenticated requests", async () => {
  await request(app).get("/api/customers").expect(401);
  await request(app).get("/api/jobs").expect(401);
});

test("customer CRUD flow works", async () => {
  const token = await createAuthToken();

  const createResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Ahmet Yılmaz",
      phone: "05551234567",
      address: "İstanbul",
      note: "Test customer"
    })
    .expect(201);

  const customer = createResponse.body.data;

  assert.equal(customer.name, "Ahmet Yılmaz");

  const listResponse = await request(app)
    .get("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(listResponse.body.data.length, 1);

  const getResponse = await request(app)
    .get(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(getResponse.body.data.id, customer.id);

  const updateResponse = await request(app)
    .put(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Mehmet Yılmaz",
      phone: "05550000000"
    })
    .expect(200);

  assert.equal(updateResponse.body.data.name, "Mehmet Yılmaz");

  await request(app)
    .delete(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  await request(app)
    .get(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(404);
});

test("job CRUD flow works", async () => {
  const token = await createAuthToken();

  const customerResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Job Customer"
    })
    .expect(201);

  const customerId = customerResponse.body.data.id;

  const createJobResponse = await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Klima bakımı",
      description: "Yıllık bakım",
      price: 1200,
      status: "pending",
      priority: "urgent",
      paymentStatus: "unpaid",
      appointmentAt: "2030-01-01T10:30:00.000Z"
    })
    .expect(201);

  const job = createJobResponse.body.data;

  assert.equal(job.title, "Klima bakımı");
  assert.equal(job.customerId, customerId);
  assert.equal(job.priority, "urgent");

  const listResponse = await request(app)
    .get("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(listResponse.body.data.length, 1);

  const getResponse = await request(app)
    .get(`/api/jobs/${job.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(getResponse.body.data.id, job.id);

  const updateResponse = await request(app)
    .put(`/api/jobs/${job.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      status: "completed",
      paymentStatus: "paid"
    })
    .expect(200);

  assert.equal(updateResponse.body.data.status, "completed");
  assert.equal(updateResponse.body.data.paymentStatus, "paid");

  await request(app)
    .delete(`/api/jobs/${job.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  await request(app)
    .get(`/api/jobs/${job.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(404);
});

test("job creation with missing customer returns 400", async () => {
  const token = await createAuthToken();

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId: "missing-customer-id",
      title: "Invalid job"
    })
    .expect(400);
});

test("job validation rejects invalid fields", async () => {
  const token = await createAuthToken();

  const customerResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Validation Customer"
    })
    .expect(201);

  const customerId = customerResponse.body.data.id;

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Invalid status",
      status: "wrong"
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Invalid priority",
      priority: "wrong"
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Invalid price",
      price: -100
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Invalid appointment",
      appointmentAt: "not-a-date"
    })
    .expect(400);
});
