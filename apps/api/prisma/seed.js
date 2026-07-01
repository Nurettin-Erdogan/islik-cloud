const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const demoEmail = process.env.DEMO_EMAIL || "demo@islik.dev";

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: demoEmail
    }
  });

  if (!user) {
    throw new Error("Demo user not found. Register this email first: " + demoEmail);
  }

  await prisma.customer.deleteMany({
    where: {
      userId: user.id
    }
  });

  const firstCustomer = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Ahmet Yilmaz",
      phone: "0555 123 45 67",
      address: "Kadikoy / Istanbul",
      note: "Kombi ve klima bakim musterisi"
    }
  });

  const secondCustomer = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Mavi Kose Cafe",
      phone: "0216 555 12 34",
      address: "Uskudar / Istanbul",
      note: "Yogun donemlerde hizli servis istiyor"
    }
  });

  const thirdCustomer = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Gunes Apartmani",
      phone: "0532 444 88 11",
      address: "Atasehir / Istanbul",
      note: "Aylik bakim anlasmasi potansiyeli"
    }
  });

  await prisma.job.createMany({
    data: [
      {
        customerId: firstCustomer.id,
        title: "Kombi yillik bakim",
        description: "Filtre temizligi, basinc kontrolu ve genel bakim",
        status: "completed",
        priority: "normal",
        price: 1250,
        paidAmount: 1250,
        paymentStatus: "paid"
      },
      {
        customerId: firstCustomer.id,
        title: "Klima gaz kontrolu",
        description: "Sogutma performansi dusuk, gaz ve kacak kontrolu yapilacak",
        status: "in_progress",
        priority: "high",
        price: 1800,
        paidAmount: 700,
        paymentStatus: "partial"
      },
      {
        customerId: secondCustomer.id,
        title: "Endustriyel buzdolabi arizasi",
        description: "Dolap yeterince sogutmuyor, acil kontrol gerekli",
        status: "pending",
        priority: "urgent",
        price: 3200,
        paidAmount: 0,
        paymentStatus: "unpaid"
      },
      {
        customerId: thirdCustomer.id,
        title: "Hidrofor bakim kontrolu",
        description: "Apartman hidrofor sistemi rutin kontrolu",
        status: "pending",
        priority: "normal",
        price: 2400,
        paidAmount: 0,
        paymentStatus: "unpaid"
      }
    ]
  });

  console.log("Demo data hazir: " + demoEmail);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
