const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();

function hasDigit(value) {
  return /\d/.test(value);
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCustomerName(value) {
  if (typeof value !== "string" || value.trim().length < 2) {
    return {
      error: "Customer name must be at least 2 characters."
    };
  }

  const trimmed = value.trim();

  if (hasDigit(trimmed)) {
    return {
      error: "Customer name cannot contain numbers."
    };
  }

  return {
    value: trimmed
  };
}

function normalizePhone(value) {
  if (value === undefined) {
    return {
      value: undefined
    };
  }

  if (typeof value !== "string") {
    return {
      error: "Phone must contain digits only."
    };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return {
      value: null
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return {
      error: "Phone must contain digits only."
    };
  }

  return {
    value: trimmed
  };
}

function validationError(res, message) {
  return res.status(400).json({
    error: {
      message
    }
  });
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
    const customerName = normalizeCustomerName(name);
    const customerPhone = normalizePhone(phone);

    const error = customerName.error || customerPhone.error;

    if (error) {
      return validationError(res, error);
    }

    const customer = await prisma.customer.create({
      data: {
        userId: req.user.id,
        name: customerName.value,
        phone: customerPhone.value,
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
    const data = {};

    if (name !== undefined) {
      const customerName = normalizeCustomerName(name);

      if (customerName.error) {
        return validationError(res, customerName.error);
      }

      data.name = customerName.value;
    }

    if (phone !== undefined) {
      const customerPhone = normalizePhone(phone);

      if (customerPhone.error) {
        return validationError(res, customerPhone.error);
      }

      data.phone = customerPhone.value;
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
        ...data,
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
