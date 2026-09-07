const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const testPhoto = {
  id: "test-photo",
  name: "front.jpg",
  type: "image/jpeg",
  dataUrl: "data:image/jpeg;base64," + Buffer.from("fake-photo").toString("base64")
};

const { app } = require("../src/app");
const { prisma } = require("../src/lib/prisma");

async function assertSafeCleanupDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to clean a database outside the test environment.");
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const parsedDatabaseUrl = new URL(databaseUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (!localHosts.has(parsedDatabaseUrl.hostname)) {
    throw new Error("Refusing to clean a non-local database during tests.");
  }

  if (parsedDatabaseUrl.searchParams.get("schema") !== "islik_test") {
    throw new Error("Refusing to clean a database outside the islik_test schema.");
  }

  const rows = await prisma.$queryRaw`SELECT current_database() AS database_name, current_schema() AS schema_name`;
  const databaseName = String(rows?.[0]?.database_name || "");
  const schemaName = String(rows?.[0]?.schema_name || "");

  if (!databaseName.includes("islik") || schemaName !== "islik_test") {
    throw new Error("Refusing to clean an unexpected test database target.");
  }
}

async function cleanup() {
  await assertSafeCleanupDatabase();
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
  assert.equal(response.body.revision, process.env.APP_GIT_COMMIT);
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
});

test("readiness endpoint confirms the database connection", async () => {
  const response = await request(app).get("/ready").expect(200);

  assert.equal(response.body.status, "ready");
  assert.equal(response.body.service, "islik-cloud-api");
  assert.equal(response.body.revision, process.env.APP_GIT_COMMIT);
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


test("auth register rejects duplicate emails", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Duplicate User",
      email: "duplicate@example.com",
      password: "secret123"
    })
    .expect(201);

  const duplicateResponse = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Duplicate User",
      email: "duplicate@example.com",
      password: "secret123"
    })
    .expect(409);

  assert.equal(duplicateResponse.body.error.message, "Email is already registered.");
});

test("auth register rejects names with numbers", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Auth User 123",
      email: "invalid-name@example.com",
      password: "secret123"
    })
    .expect(400);
});

test("protected routes reject unauthenticated requests", async () => {
  await request(app).get("/api/customers").expect(401);
  await request(app).get("/api/jobs").expect(401);
});

test("public request flow creates, tracks and lists customer requests", async () => {
  const token = await createAuthToken();

  const createResponse = await request(app)
    .post("/api/public/requests")
    .send({
      name: "Ayse Demir",
      phone: "05551230000",
      address: "Uskudar",
      productCategory: "white_goods",
      productBrand: "Vestel",
      productModel: "NF450",
      photos: [testPhoto],
      description: "Buzdolabi sogutmuyor ve ekranda hata veriyor."
    })
    .expect(201);

  const createdRequest = createResponse.body.data;

  assert.match(createdRequest.requestCode, /^SD-\d{6}$/);
  assert.equal(createdRequest.productCategory, "white_goods");
  assert.equal(createdRequest.customer.name, "Ayse Demir");
  assert.equal(createdRequest.customer.phone, undefined);
  assert.equal(createdRequest.customer.address, undefined);
  assert.equal(createdRequest.photos.length, 1);
  assert.equal(createdRequest.photos[0].name, "front.jpg");
  assert.equal(createdRequest.statusHistory.length, 1);
  assert.equal(createdRequest.statusHistory[0].status, "pending");
  assert.equal(createdRequest.statusHistory[0].actor, "customer");

  const trackResponse = await request(app)
    .get("/api/public/requests/" + createdRequest.requestCode)
    .query({
      phone: "05551230000"
    })
    .expect(200);

  assert.equal(trackResponse.body.data.requestCode, createdRequest.requestCode);
  assert.equal(trackResponse.body.data.status, "pending");
  assert.equal(trackResponse.body.data.photos.length, 1);
  assert.equal(trackResponse.body.data.statusHistory.length, 1);
  assert.equal(trackResponse.body.data.statusHistory[0].status, "pending");

  await request(app)
    .get("/api/public/requests/not-a-valid-code")
    .query({
      phone: "05551230000"
    })
    .expect(400);

  const jobsResponse = await request(app)
    .get("/api/jobs")
    .set("Authorization", "Bearer " + token)
    .expect(200);

  assert.equal(jobsResponse.body.data.length, 1);
  assert.equal(jobsResponse.body.data[0].requestCode, createdRequest.requestCode);
  assert.equal(jobsResponse.body.data[0].source, "customer");
  assert.equal(jobsResponse.body.data[0].productBrand, "Vestel");

  await request(app)
    .post("/api/public/requests")
    .send({
      name: "Ayse Demir",
      phone: "0555ABC0000",
      productCategory: "white_goods",
      description: "Telefon alaninda harf olmamali."
    })
    .expect(400);
});

test("auth register enforces production-safe credential limits", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      email: "missing-name@example.com",
      password: "secret123"
    })
    .expect(400);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "A",
      email: "short-name@example.com",
      password: "secret123"
    })
    .expect(400);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Short Password",
      email: "short-password@example.com",
      password: "1234567"
    })
    .expect(400);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Invalid Email",
      email: "invalid-email",
      password: "secret123"
    })
    .expect(400);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "A".repeat(81),
      email: "long-name@example.com",
      password: "secret123"
    })
    .expect(400);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Long Password",
      email: "long-password@example.com",
      password: "x".repeat(129)
    })
    .expect(400);

  await request(app)
    .post("/api/auth/login")
    .send({
      email: "invalid-email",
      password: "x".repeat(129)
    })
    .expect(401);
});

test("public request accepts three compressed photos larger than the old body limit", async () => {
  await createAuthToken();

  const compressedPhotoData = Buffer.alloc(400000, 1).toString("base64");
  const photos = [1, 2, 3].map((number) => ({
    id: "large-photo-" + number,
    name: "photo-" + number + ".jpg",
    type: "image/jpeg",
    dataUrl: "data:image/jpeg;base64," + compressedPhotoData
  }));

  const response = await request(app)
    .post("/api/public/requests")
    .send({
      name: "Foto Test",
      phone: "05551230001",
      productCategory: "electronics",
      photos,
      description: "Uc fotografin birlikte yuklenmesini test eder."
    })
    .expect(201);

  assert.equal(response.body.data.photos.length, 3);
});

test("oversized JSON requests return a clear 413 response", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "large@example.com",
      password: "x".repeat(4 * 1024 * 1024 + 1000)
    })
    .expect(413);

  assert.equal(response.body.error.message, "Request is too large. Add at most 3 compressed photos.");
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
  assert.equal(customer.phone, "05551234567");

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
  assert.equal(updateResponse.body.data.phone, "05550000000");

  await request(app)
    .delete(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  await request(app)
    .get(`/api/customers/${customer.id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(404);
});

test("customer validation rejects numbers in names and letters in phone", async () => {
  const token = await createAuthToken();

  await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Ahmet 123",
      phone: "05551234567"
    })
    .expect(400);

  await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Ahmet Yılmaz",
      phone: "0555ABC4567"
    })
    .expect(400);

  const createResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Ayşe Demir",
      phone: "05551234567"
    })
    .expect(201);

  await request(app)
    .put(`/api/customers/${createResponse.body.data.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Ayşe 9"
    })
    .expect(400);

  await request(app)
    .put(`/api/customers/${createResponse.body.data.id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      phone: "phone-number"
    })
    .expect(400);

  await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Uzun Not",
      phone: "05551234567",
      note: "N".repeat(1001)
    })
    .expect(400);

  await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Hatalı Adres",
      address: 123
    })
    .expect(400);
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
  const appointmentAt = "2030-01-01T10:30:00.000Z";

  const createJobResponse = await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Klima bakımı",
      description: "Yıllık bakım",
      price: 1200,
      paidAmount: 400,
      status: "pending",
      priority: "urgent",
      paymentStatus: "partial",
      appointmentAt
    })
    .expect(201);

  const job = createJobResponse.body.data;

  assert.equal(job.title, "Klima bakımı");
  assert.equal(job.customerId, customerId);
  assert.equal(job.priority, "urgent");
  assert.equal(job.paymentStatus, "partial");
  assert.equal(job.paidAmount, 400);
  assert.equal(job.appointmentAt, appointmentAt);
  assert.equal(job.statusEvents.length, 1);
  assert.equal(job.statusEvents[0].status, "pending");
  assert.equal(job.statusEvents[0].actor, "technician");

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
      priority: "high",
      paymentStatus: "paid",
      appointmentAt: null
    })
    .expect(200);

  assert.equal(updateResponse.body.data.status, "completed");
  assert.equal(updateResponse.body.data.priority, "high");
  assert.equal(updateResponse.body.data.paymentStatus, "paid");
  assert.equal(updateResponse.body.data.paidAmount, 1200);
  assert.equal(updateResponse.body.data.appointmentAt, null);
  assert.deepEqual(updateResponse.body.data.statusEvents.map((event) => event.status), ["pending", "completed"]);
  assert.equal(updateResponse.body.data.statusEvents[1].actor, "technician");

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

test("editing a job keeps its unchanged historical appointment", async () => {
  const token = await createAuthToken();
  const customerResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Historical Customer"
    })
    .expect(201);

  const createResponse = await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId: customerResponse.body.data.id,
      title: "Historical Job",
      appointmentAt: "2030-01-01T10:00:00.000Z"
    })
    .expect(201);

  const historicalAppointment = new Date("2020-01-01T10:00:00.000Z");
  await prisma.job.update({
    where: {
      id: createResponse.body.data.id
    },
    data: {
      appointmentAt: historicalAppointment
    }
  });

  const updateResponse = await request(app)
    .put("/api/jobs/" + createResponse.body.data.id)
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Historical Job Updated",
      appointmentAt: historicalAppointment.toISOString()
    })
    .expect(200);

  assert.equal(updateResponse.body.data.title, "Historical Job Updated");
  assert.equal(updateResponse.body.data.appointmentAt, historicalAppointment.toISOString());

  await request(app)
    .put("/api/jobs/" + createResponse.body.data.id)
    .set("Authorization", `Bearer ${token}`)
    .send({
      appointmentAt: "2021-01-01T10:00:00.000Z"
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
      title: "Invalid partial payment",
      price: 1200,
      paymentStatus: "partial"
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Too much paid",
      price: 1200,
      paidAmount: 1200,
      paymentStatus: "partial"
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

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Photos limit",
      photos: [testPhoto, testPhoto, testPhoto, testPhoto]
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "T".repeat(121)
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Extreme price",
      price: 1000000001
    })
    .expect(400);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerId,
      title: "Past appointment",
      appointmentAt: "2020-01-01T10:30:00.000Z"
    })
    .expect(400);
});

test("users can only access their own customers and jobs", async () => {
  const firstToken = await createAuthToken();
  const secondToken = await createAuthToken();

  const firstCustomerResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", "Bearer " + firstToken)
    .send({
      name: "First User Customer"
    })
    .expect(201);

  const secondCustomerResponse = await request(app)
    .post("/api/customers")
    .set("Authorization", "Bearer " + secondToken)
    .send({
      name: "Second User Customer"
    })
    .expect(201);

  const firstCustomerId = firstCustomerResponse.body.data.id;
  const secondCustomerId = secondCustomerResponse.body.data.id;

  const firstJobResponse = await request(app)
    .post("/api/jobs")
    .set("Authorization", "Bearer " + firstToken)
    .send({
      customerId: firstCustomerId,
      title: "First User Job"
    })
    .expect(201);

  const firstJobId = firstJobResponse.body.data.id;

  const firstCustomerList = await request(app)
    .get("/api/customers")
    .set("Authorization", "Bearer " + firstToken)
    .expect(200);

  assert.equal(firstCustomerList.body.data.length, 1);
  assert.equal(firstCustomerList.body.data[0].id, firstCustomerId);

  const secondCustomerList = await request(app)
    .get("/api/customers")
    .set("Authorization", "Bearer " + secondToken)
    .expect(200);

  assert.equal(secondCustomerList.body.data.length, 1);
  assert.equal(secondCustomerList.body.data[0].id, secondCustomerId);

  const firstJobList = await request(app)
    .get("/api/jobs")
    .set("Authorization", "Bearer " + firstToken)
    .expect(200);

  assert.equal(firstJobList.body.data.length, 1);
  assert.equal(firstJobList.body.data[0].id, firstJobId);

  const secondJobList = await request(app)
    .get("/api/jobs")
    .set("Authorization", "Bearer " + secondToken)
    .expect(200);

  assert.equal(secondJobList.body.data.length, 0);

  await request(app)
    .get("/api/customers/" + firstCustomerId)
    .set("Authorization", "Bearer " + secondToken)
    .expect(404);

  await request(app)
    .put("/api/customers/" + firstCustomerId)
    .set("Authorization", "Bearer " + secondToken)
    .send({
      name: "Hacked Customer"
    })
    .expect(404);

  await request(app)
    .get("/api/jobs/" + firstJobId)
    .set("Authorization", "Bearer " + secondToken)
    .expect(404);

  await request(app)
    .put("/api/jobs/" + firstJobId)
    .set("Authorization", "Bearer " + secondToken)
    .send({
      title: "Hacked Job"
    })
    .expect(404);

  await request(app)
    .post("/api/jobs")
    .set("Authorization", "Bearer " + secondToken)
    .send({
      customerId: firstCustomerId,
      title: "Invalid cross-user job"
    })
    .expect(400);
});


test("security headers reject framing and leaking referrers", async () => {
  const response = await request(app).get("/health").expect(200);
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["referrer-policy"], "no-referrer");
  assert.equal(response.headers["permissions-policy"], "camera=(), microphone=(), geolocation=()");
});
