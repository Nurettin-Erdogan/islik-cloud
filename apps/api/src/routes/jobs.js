const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

const allowedStatuses = ["pending", "in_progress", "completed", "cancelled"];
const allowedPriorities = ["low", "normal", "high", "urgent"];
const allowedPaymentStatuses = ["unpaid", "partial", "paid"];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
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

function normalizePrice(value, fallback) {
  if (value === undefined) {
    return {
      value: fallback
    };
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return {
      error: "price must be a positive number."
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

  return {
    value: date
  };
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
    include: {
      customer: true
    }
  });
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
      include: {
        customer: true
      }
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
    const status = normalizeEnum(req.body.status, allowedStatuses, "status", "pending");
    const priority = normalizeEnum(req.body.priority, allowedPriorities, "priority", "normal");
    const price = normalizePrice(req.body.price, 0);
    const paymentStatus = normalizeEnum(
      req.body.paymentStatus,
      allowedPaymentStatuses,
      "paymentStatus",
      "unpaid"
    );
    const appointmentAt = normalizeDate(req.body.appointmentAt);

    const error =
      customerId.error ||
      title.error ||
      description.error ||
      status.error ||
      priority.error ||
      price.error ||
      paymentStatus.error ||
      appointmentAt.error;

    if (error) {
      return validationError(res, error);
    }

    const ownedCustomer = await findOwnedCustomer(customerId.value, req.user.id);

    if (!ownedCustomer) {
      return validationError(res, "Related customer was not found.");
    }

    const job = await prisma.job.create({
      data: {
        customerId: customerId.value,
        title: title.value,
        description: description.value,
        status: status.value,
        priority: priority.value,
        price: price.value,
        paymentStatus: paymentStatus.value,
        appointmentAt: appointmentAt.value ?? null
      },
      include: {
        customer: true
      }
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
      const price = normalizePrice(req.body.price);

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

    if (hasOwn(req.body, "appointmentAt")) {
      const appointmentAt = normalizeDate(req.body.appointmentAt);

      if (appointmentAt.error) {
        return validationError(res, appointmentAt.error);
      }

      data.appointmentAt = appointmentAt.value;
    }

    const job = await prisma.job.update({
      where: {
        id: req.params.id
      },
      data,
      include: {
        customer: true
      }
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
