const { randomInt } = require("crypto");
const express = require("express");
const { prisma } = require("../lib/prisma");
const router = express.Router();
const allowedStatuses = ["pending", "in_progress", "completed", "cancelled"];
const allowedPriorities = ["low", "normal", "high", "urgent"];
const allowedPaymentStatuses = ["unpaid", "partial", "paid"];
const allowedProductCategories = [
  "heating",
  "cooling",
  "white_goods",
  "electronics",
  "computer",
  "phone",
  "other"
];
const jobInclude = {
  customer: true,
  statusEvents: {
    orderBy: {
      createdAt: "asc"
    }
  }
};
function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

const MAX_JOB_PHOTOS = 3;
const MAX_PHOTO_DATA_URL_LENGTH = 950000;
const PHOTO_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp);base64,/i;

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
          ? item.id.trim()
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

function normalizeOptionalString(value, fieldName) {
  if (value === undefined) {
    return {
      value: undefined
    };
  }
  if (value === null) {
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
  return {
    value: trimmed.length > 0 ? trimmed : null
  };
}
function normalizeRequiredString(value, fieldName, minLength = 1) {
  if (typeof value !== "string" || value.trim().length < minLength) {
    return {
      error: fieldName + " is required."
    };
  }
  return {
    value: value.trim()
  };
}
function normalizeEnum(value, allowedValues, fieldName, fallback) {
  if (value === undefined) {
    return {
      value: fallback
    };
  }
  if (typeof value !== "string" || !allowedValues.includes(value)) {
    return {
      error: fieldName + " must be one of: " + allowedValues.join(", ") + "."
    };
  }
  return {
    value
  };
}
function normalizeNonNegativeNumber(value, fieldName, fallback) {
  if (value === undefined) {
    return {
      value: fallback
    };
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return {
      error: fieldName + " must be a non-negative number."
    };
  }
  return {
    value: numberValue
  };
}
function normalizeDate(value) {
  if (value === undefined) {
    return {
      value: undefined
    };
  }
  if (value === null || value === "") {
    return {
      value: null
    };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      error: "appointmentAt must be a valid date."
    };
  }
  const currentMinute = new Date();
  currentMinute.setSeconds(0, 0);
  if (date < currentMinute) {
    return {
      error: "appointmentAt cannot be in the past."
    };
  }
  return {
    value: date
  };
}
function normalizePaymentSnapshot({ price, paymentStatus, paidAmount }) {
  const safePrice = Number(price || 0);
  const safePaidAmount = Number(paidAmount || 0);
  if (paymentStatus === "unpaid") {
    return {
      paymentStatus,
      paidAmount: 0
    };
  }
  if (paymentStatus === "paid") {
    return {
      paymentStatus,
      paidAmount: safePrice
    };
  }
  if (safePrice <= 0) {
    return {
      error: "partial payments require a price greater than 0."
    };
  }
  if (safePaidAmount <= 0) {
    return {
      error: "paidAmount must be greater than 0 for partial payments."
    };
  }
  if (safePaidAmount >= safePrice) {
    return {
      error: "paidAmount must be less than price for partial payments."
    };
  }
  return {
    paymentStatus,
    paidAmount: safePaidAmount
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
async function findOwnedCustomer(customerId, userId) {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      userId
    }
  });
}
async function findOwnedJob(jobId, userId) {
  return prisma.job.findFirst({
    where: {
      id: jobId,
      customer: {
        userId
      }
    },
    include: jobInclude
  });
}
async function createJobWithRequestCode({ data, include }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.job.create({
        data: {
          ...data,
          requestCode: data.requestCode || generateRequestCode(),
          statusEvents: {
            create: {
              status: data.status || "pending",
              actor: data.source === "customer" ? "customer" : "technician",
              note: "Talep oluşturuldu."
            }
          }
        },
        include
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
router.get("/", async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        customer: {
          userId: req.user.id
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      include: jobInclude
    });
    res.json({
      data: jobs
    });
  } catch (error) {
    next(error);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const customerId = normalizeRequiredString(req.body.customerId, "customerId");
    const title = normalizeRequiredString(req.body.title, "title", 2);
    const description = normalizeOptionalString(req.body.description, "description");
    const productCategory = normalizeEnum(
      req.body.productCategory,
      allowedProductCategories,
      "productCategory",
      "other"
    );
    const productBrand = normalizeOptionalString(req.body.productBrand, "productBrand");
    const productModel = normalizeOptionalString(req.body.productModel, "productModel");
    const photos = normalizePhotos(req.body.photos);
    const status = normalizeEnum(req.body.status, allowedStatuses, "status", "pending");
    const priority = normalizeEnum(req.body.priority, allowedPriorities, "priority", "normal");
    const price = normalizeNonNegativeNumber(req.body.price, "price", 0);
    const paidAmount = normalizeNonNegativeNumber(req.body.paidAmount, "paidAmount", 0);
    const paymentStatus = normalizeEnum(
      req.body.paymentStatus,
      allowedPaymentStatuses,
      "paymentStatus",
      "unpaid"
    );
    const appointmentAt = normalizeDate(req.body.appointmentAt);
    const payment = normalizePaymentSnapshot({
      price: price.value,
      paymentStatus: paymentStatus.value,
      paidAmount: paidAmount.value
    });
    const error =
      customerId.error ||
      title.error ||
      description.error ||
      productCategory.error ||
      productBrand.error ||
      productModel.error ||
      photos.error ||
      status.error ||
      priority.error ||
      price.error ||
      paidAmount.error ||
      paymentStatus.error ||
      appointmentAt.error ||
      payment.error;
    if (error) {
      return validationError(res, error);
    }
    const ownedCustomer = await findOwnedCustomer(customerId.value, req.user.id);
    if (!ownedCustomer) {
      return validationError(res, "Related customer was not found.");
    }
    const job = await createJobWithRequestCode({
      data: {
        customerId: customerId.value,
        source: "technician",
        productCategory: productCategory.value,
        productBrand: productBrand.value,
        productModel: productModel.value,
        photos: photos.value,
        title: title.value,
        description: description.value,
        status: status.value,
        priority: priority.value,
        price: price.value,
        paidAmount: payment.paidAmount,
        paymentStatus: payment.paymentStatus,
        appointmentAt: appointmentAt.value ?? null
      },
      include: jobInclude
    });
    res.status(201).json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const job = await findOwnedJob(req.params.id, req.user.id);
    if (!job) {
      return res.status(404).json({
        error: {
          message: "Job not found."
        }
      });
    }
    res.json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    const existingJob = await findOwnedJob(req.params.id, req.user.id);
    if (!existingJob) {
      return res.status(404).json({
        error: {
          message: "Job not found."
        }
      });
    }
    const data = {};
    if (hasOwn(req.body, "customerId")) {
      const customerId = normalizeRequiredString(req.body.customerId, "customerId");
      if (customerId.error) {
        return validationError(res, customerId.error);
      }
      const ownedCustomer = await findOwnedCustomer(customerId.value, req.user.id);
      if (!ownedCustomer) {
        return validationError(res, "Related customer was not found.");
      }
      data.customerId = customerId.value;
    }
    if (hasOwn(req.body, "title")) {
      const title = normalizeRequiredString(req.body.title, "title", 2);
      if (title.error) {
        return validationError(res, title.error);
      }
      data.title = title.value;
    }
    if (hasOwn(req.body, "description")) {
      const description = normalizeOptionalString(req.body.description, "description");
      if (description.error) {
        return validationError(res, description.error);
      }
      data.description = description.value;
    }
    if (hasOwn(req.body, "productCategory")) {
      const productCategory = normalizeEnum(
        req.body.productCategory,
        allowedProductCategories,
        "productCategory"
      );
      if (productCategory.error) {
        return validationError(res, productCategory.error);
      }
      data.productCategory = productCategory.value;
    }
    if (hasOwn(req.body, "productBrand")) {
      const productBrand = normalizeOptionalString(req.body.productBrand, "productBrand");
      if (productBrand.error) {
        return validationError(res, productBrand.error);
      }
      data.productBrand = productBrand.value;
    }
    if (hasOwn(req.body, "productModel")) {
      const productModel = normalizeOptionalString(req.body.productModel, "productModel");
      if (productModel.error) {
        return validationError(res, productModel.error);
      }
      data.productModel = productModel.value;
    }
    if (hasOwn(req.body, "photos")) {
      const photos = normalizePhotos(req.body.photos);
      if (photos.error) {
        return validationError(res, photos.error);
      }
      data.photos = photos.value;
    }
    if (hasOwn(req.body, "status")) {
      const status = normalizeEnum(req.body.status, allowedStatuses, "status");
      if (status.error) {
        return validationError(res, status.error);
      }
      data.status = status.value;
    }
    if (hasOwn(req.body, "priority")) {
      const priority = normalizeEnum(req.body.priority, allowedPriorities, "priority");
      if (priority.error) {
        return validationError(res, priority.error);
      }
      data.priority = priority.value;
    }
    if (hasOwn(req.body, "price")) {
      const price = normalizeNonNegativeNumber(req.body.price, "price");
      if (price.error) {
        return validationError(res, price.error);
      }
      data.price = price.value;
    }
    if (hasOwn(req.body, "paymentStatus")) {
      const paymentStatus = normalizeEnum(
        req.body.paymentStatus,
        allowedPaymentStatuses,
        "paymentStatus"
      );
      if (paymentStatus.error) {
        return validationError(res, paymentStatus.error);
      }
      data.paymentStatus = paymentStatus.value;
    }
    if (hasOwn(req.body, "paidAmount")) {
      const paidAmount = normalizeNonNegativeNumber(req.body.paidAmount, "paidAmount");
      if (paidAmount.error) {
        return validationError(res, paidAmount.error);
      }
      data.paidAmount = paidAmount.value;
    }
    if (hasOwn(req.body, "appointmentAt")) {
      const appointmentAt = normalizeDate(req.body.appointmentAt);
      if (appointmentAt.error) {
        return validationError(res, appointmentAt.error);
      }
      data.appointmentAt = appointmentAt.value;
    }
    if (
      hasOwn(req.body, "price") ||
      hasOwn(req.body, "paidAmount") ||
      hasOwn(req.body, "paymentStatus")
    ) {
      const payment = normalizePaymentSnapshot({
        price: hasOwn(data, "price") ? data.price : existingJob.price,
        paymentStatus: hasOwn(data, "paymentStatus")
          ? data.paymentStatus
          : existingJob.paymentStatus,
        paidAmount: hasOwn(data, "paidAmount")
          ? data.paidAmount
          : existingJob.paidAmount ?? 0
      });
      if (payment.error) {
        return validationError(res, payment.error);
      }
      data.paymentStatus = payment.paymentStatus;
      data.paidAmount = payment.paidAmount;
    }
    if (hasOwn(data, "status") && data.status !== existingJob.status) {
      data.statusEvents = {
        create: {
          status: data.status,
          actor: "technician",
          note: "Durum güncellendi."
        }
      };
    }

    const job = await prisma.job.update({
      where: {
        id: req.params.id
      },
      data,
      include: jobInclude
    });
    res.json({
      data: job
    });
  } catch (error) {
    next(error);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const existingJob = await findOwnedJob(req.params.id, req.user.id);
    if (!existingJob) {
      return res.status(404).json({
        error: {
          message: "Job not found."
        }
      });
    }
    await prisma.job.delete({
      where: {
        id: req.params.id
      }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
module.exports = router;
