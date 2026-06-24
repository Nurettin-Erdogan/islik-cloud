const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { app } = require("../src/app");
const { prisma } = require("../src/lib/prisma");

async function cleanDatabase() {
  await prisma.job.deleteMany();
  await prisma.customer.deleteMany();
}

test.beforeEach(async () => {
  await cleanDatabase();
});

test.after(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

test("GET /health returns API status", async () => {
  const response = await request(app).get("/health").expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.app, "islik-cloud-api");
});

test("customer CRUD flow works", async () => {
  const createResponse = await request(app)
    .post("/api/customers")
    .send({
      name: "Ahmet Yilmaz",
      phone: "05551234567",
      address: "Istanbul",
      note: "Test musterisi"
    })
    .expect(201);

  const customerId = createResponse.body.data.id;
  assert.ok(customerId);
  assert.equal(createResponse.body.data.name, "Ahmet Yilmaz");

  const listResponse = await request(app).get("/api/customers").expect(200);
  assert.equal(listResponse.body.data.length, 1);

  const detailResponse = await request(app).get(`/api/customers/${customerId}`).expect(200);
  assert.equal(detailResponse.body.data.id, customerId);

  const updateResponse = await request(app)
    .put(`/api/customers/${customerId}`)
    .send({
      name: "Ahmet Yilmaz Updated"
    })
    .expect(200);

  assert.equal(updateResponse.body.data.name, "Ahmet Yilmaz Updated");

  await request(app).delete(`/api/customers/${customerId}`).expect(204);
  await request(app).get(`/api/customers/${customerId}`).expect(404);
});

test("job CRUD flow works", async () => {
  const customerResponse = await request(app)
    .post("/api/customers")
    .send({
      name: "Mehmet Kaya"
    })
    .expect(201);

  const customerId = customerResponse.body.data.id;

  const createJobResponse = await request(app)
    .post("/api/jobs")
    .send({
      customerId,
      title: "Klima bakimi",
      description: "Yillik servis kontrolu",
      price: 1200,
      status: "pending",
      paymentStatus: "unpaid"
    })
    .expect(201);

  const jobId = createJobResponse.body.data.id;
  assert.ok(jobId);
  assert.equal(createJobResponse.body.data.customerId, customerId);
  assert.equal(createJobResponse.body.data.title, "Klima bakimi");

  const jobsResponse = await request(app).get("/api/jobs").expect(200);
  assert.equal(jobsResponse.body.data.length, 1);

  const detailResponse = await request(app).get(`/api/jobs/${jobId}`).expect(200);
  assert.equal(detailResponse.body.data.id, jobId);
  assert.equal(detailResponse.body.data.customer.id, customerId);

  const updateResponse = await request(app)
    .put(`/api/jobs/${jobId}`)
    .send({
      status: "completed",
      paymentStatus: "paid"
    })
    .expect(200);

  assert.equal(updateResponse.body.data.status, "completed");
  assert.equal(updateResponse.body.data.paymentStatus, "paid");

  await request(app).delete(`/api/jobs/${jobId}`).expect(204);
  await request(app).get(`/api/jobs/${jobId}`).expect(404);
});

test("creating a job with missing customer returns 400", async () => {
  const response = await request(app)
    .post("/api/jobs")
    .send({
      customerId: "missing-customer-id",
      title: "Gecersiz is"
    })
    .expect(400);

  assert.equal(response.body.error.message, "Related record does not exist.");
});
