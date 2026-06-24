const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

const allowedStatuses = ["pending", "in_progress", "completed", "cancelled"];
const allowedPriorities = ["low", "normal", "high"];
const allowedPaymentStatuses = ["unpaid", "partial", "paid"];

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : fallback;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

router.get("/", async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
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
    const {
      customerId,
      title,
      description,
      status,
      priority,
      price,
      paymentStatus,
      appointmentAt
    } = req.body;

    if (typeof customerId !== "string" || customerId.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: "customerId is required."
        }
      });
    }

    if (typeof title !== "string" || title.trim().length < 2) {
      return res.status(400).json({
        error: {
          message: "Job title must be at least 2 characters."
        }
      });
    }

    const job = await prisma.job.create({
      data: {
        customerId: customerId.trim(),
        title: title.trim(),
        description: normalizeOptionalString(description),
        status: allowedStatuses.includes(status) ? status : "pending",
        priority: allowedPriorities.includes(priority) ? priority : "normal",
        price: normalizeNumber(price),
        paymentStatus: allowedPaymentStatuses.includes(paymentStatus) ? paymentStatus : "unpaid",
        appointmentAt: normalizeDate(appointmentAt)
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
    const job = await prisma.job.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        customer: true
      }
    });

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
    const {
      title,
      description,
      status,
      priority,
      price,
      paymentStatus,
      appointmentAt
    } = req.body;

    if (title !== undefined && (typeof title !== "string" || title.trim().length < 2)) {
      return res.status(400).json({
        error: {
          message: "Job title must be at least 2 characters."
        }
      });
    }

    const job = await prisma.job.update({
      where: {
        id: req.params.id
      },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: normalizeOptionalString(description) } : {}),
        ...(status !== undefined && allowedStatuses.includes(status) ? { status } : {}),
        ...(priority !== undefined && allowedPriorities.includes(priority) ? { priority } : {}),
        ...(price !== undefined ? { price: normalizeNumber(price) } : {}),
        ...(paymentStatus !== undefined && allowedPaymentStatuses.includes(paymentStatus)
          ? { paymentStatus }
          : {}),
        ...(appointmentAt !== undefined ? { appointmentAt: normalizeDate(appointmentAt) } : {})
      },
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
