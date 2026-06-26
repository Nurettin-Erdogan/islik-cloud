const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

router.get("/", async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        _count: {
          select: {
            jobs: true
          }
        }
      }
    });

    res.json({
      data: customers
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, phone, address, note } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        error: {
          message: "Customer name must be at least 2 characters."
        }
      });
    }

    const customer = await prisma.customer.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        phone: normalizeOptionalString(phone),
        address: normalizeOptionalString(address),
        note: normalizeOptionalString(note)
      }
    });

    res.status(201).json({
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: {
          message: "Customer not found."
        }
      });
    }

    res.json({
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, phone, address, note } = req.body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return res.status(400).json({
        error: {
          message: "Customer name must be at least 2 characters."
        }
      });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: {
          message: "Customer not found."
        }
      });
    }

    const customer = await prisma.customer.update({
      where: {
        id: req.params.id
      },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: normalizeOptionalString(phone) } : {}),
        ...(address !== undefined ? { address: normalizeOptionalString(address) } : {}),
        ...(note !== undefined ? { note: normalizeOptionalString(note) } : {})
      }
    });

    res.json({
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.customer.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        error: {
          message: "Customer not found."
        }
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
