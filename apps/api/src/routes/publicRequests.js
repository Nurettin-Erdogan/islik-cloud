const { randomInt } = require("crypto");
const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

const allowedProductCategories = [
  "heating",
  "cooling",
  "white_goods",
  "electronics",
  "computer",
  "phone",
  "other"
];

const categoryLabels = {
  heating: "Kombi / Isıtma",
  cooling: "Klima / Soğutma",
  white_goods: "Beyaz eşya",
  electronics: "Elektronik",
  computer: "Bilgisayar",
  phone: "Telefon",
  other: "Diğer"
};
const jobInclude = {
  customer: true,
  statusEvents: {
    orderBy: {
      createdAt: "asc"
    }
  }
};

const MAX_JOB_PHOTOS = 3;
const MAX_PHOTO_DATA_URL_LENGTH = 950000;
const PHOTO_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/i;
const MAX_CUSTOMER_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 15;
const MAX_ADDRESS_LENGTH = 250;
const MAX_PRODUCT_TEXT_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 2000;

function normalizePhotos(value) {
  if (value === undefined || value === null) {
    return {
      value: []
    };
  }

  if (!Array.isArray(value)) {
    return {
      error: "photos must be an array."
    };
  }

  if (value.length > MAX_JOB_PHOTOS) {
    return {
      error: "photos can contain at most 3 images."
    };
  }

  const photos = [];

  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return {
        error: "photos must contain image objects."
      };
    }

    const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl.trim() : "";

    if (!PHOTO_DATA_URL_PATTERN.test(dataUrl)) {
      return {
        error: "photos must be image data urls."
      };
    }

    if (dataUrl.length > MAX_PHOTO_DATA_URL_LENGTH) {
      return {
        error: "photo is too large."
      };
    }

    photos.push({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim().slice(0, 80)
          : "photo-" + Date.now() + "-" + index,
      name: typeof item.name === "string" && item.name.trim() ? item.name.trim().slice(0, 80) : "Fotoğraf",
      type: typeof item.type === "string" && item.type.trim() ? item.type.trim().slice(0, 50) : "image/jpeg",
      dataUrl
    });
  }

  return {
    value: photos
  };
}

function safePhotos(value) {
  return Array.isArray(value) ? value : [];
}


function normalizeRequiredString(value, fieldName, minLength = 1, maxLength = 2000) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    return {
      error: fieldName + " is required."
    };
  }

  if (value.trim().length > maxLength) {
    return {
      error: fieldName + " must be at most " + maxLength + " characters."
    };
  }

  return {
    value: value.trim()
  };
}

function normalizeOptionalString(value, fieldName, maxLength) {
  if (value === undefined || value === null) {
    return {
      value: null
    };
  }

  if (typeof value !== "string") {
    return {
      error: fieldName + " must be a string."
    };
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    return {
      error: fieldName + " must be at most " + maxLength + " characters."
    };
  }

  return {
    value: trimmed.length > 0 ? trimmed : null
  };
}

function normalizeCustomerName(value) {
  const name = normalizeRequiredString(value, "name", 2, MAX_CUSTOMER_NAME_LENGTH);

  if (name.error) {
    return name;
  }

  if (/\d/.test(name.value)) {
    return {
      error: "name cannot contain numbers."
    };
  }

  return name;
}

function normalizePhone(value) {
  if (typeof value !== "string") {
    return {
      error: "phone must contain digits only."
    };
  }

  const phone = value.trim();

  if (!/^\d+$/.test(phone)) {
    return {
      error: "phone must contain digits only."
    };
  }

  if (phone.length < 10) {
    return {
      error: "phone is required."
    };
  }

  if (phone.length > MAX_PHONE_LENGTH) {
    return {
      error: "phone must contain at most 15 digits."
    };
  }

  return {
    value: phone
  };
}

function normalizeProductCategory(value) {
  if (typeof value !== "string" || !allowedProductCategories.includes(value)) {
    return {
      error: "productCategory must be valid."
    };
  }

  return {
    value
  };
}

function generateRequestCode() {
  return "SD-" + randomInt(100000, 999999);
}

function validationError(res, message) {
  return res.status(400).json({
    error: {
      message
    }
  });
}

function publicJob(job) {
  return {
    id: job.id,
    requestCode: job.requestCode,
    productCategory: job.productCategory,
    productCategoryLabel: categoryLabels[job.productCategory] || categoryLabels.other,
    productBrand: job.productBrand,
    productModel: job.productModel,
    title: job.title,
    description: job.description,
    status: job.status,
    priority: job.priority,
    price: job.price,
    paidAmount: job.paidAmount,
    paymentStatus: job.paymentStatus,
    appointmentAt: job.appointmentAt,
    photos: safePhotos(job.photos),
    createdAt: job.createdAt,
    statusHistory: (job.statusEvents || []).map((event) => ({
      id: event.id,
      status: event.status,
      actor: event.actor,
      note: event.note,
      createdAt: event.createdAt
    })),
    customer: {
      name: job.customer.name
    }
  };
}

async function findServiceOwner() {
  const preferredEmail =
    process.env.PUBLIC_SERVICE_OWNER_EMAIL ||
    process.env.DEMO_EMAIL ||
    "demo@islik.dev";

  const preferredUser = await prisma.user.findUnique({
    where: {
      email: preferredEmail.toLowerCase()
    }
  });

  if (preferredUser) {
    return preferredUser;
  }

  return prisma.user.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });
}

async function findOrCreateCustomer({ ownerId, name, phone, address }) {
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      userId: ownerId,
      phone
    }
  });

  if (!existingCustomer) {
    return prisma.customer.create({
      data: {
        userId: ownerId,
        name,
        phone,
        address,
        note: "Müşteri portalından talep açtı."
      }
    });
  }

  return prisma.customer.update({
    where: {
      id: existingCustomer.id
    },
    data: {
      name,
      address,
      note: existingCustomer.note || "Müşteri portalından talep açtı."
    }
  });
}

async function createJobWithRequestCode(data) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.job.create({
        data: {
          ...data,
          requestCode: generateRequestCode(),
          statusEvents: {
            create: {
              status: data.status || "pending",
              actor: "customer",
              note: "Müşteri talebi oluşturdu."
            }
          }
        },
        include: jobInclude
      });
    } catch (error) {
      const isRequestCodeCollision =
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("requestCode");

      if (!isRequestCodeCollision) {
        throw error;
      }
    }
  }

  throw new Error("Could not generate a unique request code.");
}

router.post("/", async (req, res, next) => {
  try {
    const serviceOwner = await findServiceOwner();

    if (!serviceOwner) {
      return res.status(503).json({
        error: {
          message: "Service owner account is not ready."
        }
      });
    }

    const name = normalizeCustomerName(req.body.name);
    const phone = normalizePhone(req.body.phone);
    const address = normalizeOptionalString(req.body.address, "address", MAX_ADDRESS_LENGTH);
    const productCategory = normalizeProductCategory(req.body.productCategory);
    const productBrand = normalizeOptionalString(req.body.productBrand, "productBrand", MAX_PRODUCT_TEXT_LENGTH);
    const productModel = normalizeOptionalString(req.body.productModel, "productModel", MAX_PRODUCT_TEXT_LENGTH);
    const photos = normalizePhotos(req.body.photos);
    const description = normalizeRequiredString(req.body.description, "description", 10, MAX_DESCRIPTION_LENGTH);

    const error =
      name.error ||
      phone.error ||
      address.error ||
      productCategory.error ||
      productBrand.error ||
      productModel.error ||
      photos.error ||
      description.error;

    if (error) {
      return validationError(res, error);
    }

    const customer = await findOrCreateCustomer({
      ownerId: serviceOwner.id,
      name: name.value,
      phone: phone.value,
      address: address.value
    });

    const productLabel = categoryLabels[productCategory.value] || categoryLabels.other;
    const job = await createJobWithRequestCode({
      customerId: customer.id,
      source: "customer",
      productCategory: productCategory.value,
      productBrand: productBrand.value,
      productModel: productModel.value,
      photos: photos.value,
      title: productLabel + " arıza talebi",
      description: description.value,
      status: "pending",
      priority: "normal",
      price: 0,
      paidAmount: 0,
      paymentStatus: "unpaid",
      appointmentAt: null
    });

    res.status(201).json({
      data: publicJob(job)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:requestCode", async (req, res, next) => {
  try {
    const requestCode = String(req.params.requestCode || "").trim().toUpperCase();
    const phone = normalizePhone(String(req.query.phone || ""));

    if (!/^SD-\d{6}$/.test(requestCode)) {
      return validationError(res, "requestCode must be valid.");
    }

    if (phone.error) {
      return validationError(res, phone.error);
    }

    const job = await prisma.job.findFirst({
      where: {
        requestCode,
        customer: {
          phone: phone.value
        }
      },
      include: jobInclude
    });

    if (!job) {
      return res.status(404).json({
        error: {
          message: "Request was not found."
        }
      });
    }

    res.json({
      data: publicJob(job)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
