const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const demoEmail = process.env.DEMO_EMAIL || "demo@islik.dev";

function requireDemoPassword() {
  const demoPassword = String(process.env.DEMO_PASSWORD || "");

  if (demoPassword.length < 12) {
    throw new Error("DEMO_PASSWORD must contain at least 12 characters.");
  }

  return demoPassword;
}

async function upsertDemoUser() {
  const passwordHash = await bcrypt.hash(requireDemoPassword(), 12);

  return prisma.user.upsert({
    where: {
      email: demoEmail
    },
    update: {
      name: "Demo Usta",
      passwordHash
    },
    create: {
      email: demoEmail,
      name: "Demo Usta",
      passwordHash
    }
  });
}

async function upsertCustomer(userId, data) {
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      userId,
      phone: data.phone
    }
  });

  if (!existingCustomer) {
    return prisma.customer.create({
      data: {
        userId,
        ...data
      }
    });
  }

  return prisma.customer.update({
    where: {
      id: existingCustomer.id
    },
    data
  });
}

async function upsertJob(data) {
  return prisma.job.upsert({
    where: {
      requestCode: data.requestCode
    },
    create: data,
    update: data
  });
}

async function main() {
  const user = await upsertDemoUser();

  const firstCustomer = await upsertCustomer(user.id, {
    name: "Ahmet Yılmaz",
    phone: "05551234567",
    address: "Kadıköy / İstanbul",
    note: "Kombi ve klima bakım müşterisi"
  });

  const secondCustomer = await upsertCustomer(user.id, {
    name: "Mavi Köşe Cafe",
    phone: "02165551234",
    address: "Üsküdar / İstanbul",
    note: "Yoğun dönemlerde hızlı servis istiyor"
  });

  const thirdCustomer = await upsertCustomer(user.id, {
    name: "Güneş Apartmanı",
    phone: "05324448811",
    address: "Ataşehir / İstanbul",
    note: "Aylık bakım anlaşması potansiyeli"
  });

  await upsertJob({
    customerId: firstCustomer.id,
    requestCode: "SD-100101",
    source: "technician",
    productCategory: "heating",
    productBrand: "Demirdöküm",
    productModel: "Nitromix",
    title: "Kombi yıllık bakım",
    description: "Filtre temizliği, basınç kontrolü ve genel bakım",
    status: "completed",
    priority: "normal",
    price: 1250,
    paidAmount: 1250,
    paymentStatus: "paid"
  });

  await upsertJob({
    customerId: firstCustomer.id,
    requestCode: "SD-100102",
    source: "customer",
    productCategory: "cooling",
    productBrand: "Vestel",
    productModel: "Inverter",
    title: "Klima soğutmuyor",
    description: "Soğutma performansı düşük, gaz ve kaçak kontrolü yapılacak",
    status: "in_progress",
    priority: "high",
    price: 1800,
    paidAmount: 700,
    paymentStatus: "partial"
  });

  await upsertJob({
    customerId: secondCustomer.id,
    requestCode: "SD-100103",
    source: "customer",
    productCategory: "white_goods",
    productBrand: "Uğur",
    productModel: "Endüstriyel",
    title: "Buzdolabı arızası",
    description: "Dolap yeterince soğutmuyor, acil kontrol gerekli",
    status: "pending",
    priority: "urgent",
    price: 3200,
    paidAmount: 0,
    paymentStatus: "unpaid"
  });

  await upsertJob({
    customerId: thirdCustomer.id,
    requestCode: "SD-100104",
    source: "technician",
    productCategory: "other",
    productBrand: "Apartman",
    productModel: "Hidrofor",
    title: "Hidrofor bakım kontrolü",
    description: "Apartman hidrofor sistemi rutin kontrolü",
    status: "pending",
    priority: "normal",
    price: 2400,
    paidAmount: 0,
    paymentStatus: "unpaid"
  });

  console.log("Demo data hazır: " + demoEmail);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
