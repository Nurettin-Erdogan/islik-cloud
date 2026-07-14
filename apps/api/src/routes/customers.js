const express = require("express");
const { prisma } = require("../lib/prisma");

const router = express.Router();
const MAX_CUSTOMER_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 15;
const MAX_ADDRESS_LENGTH = 250;
const MAX_NOTE_LENGTH = 1000;

function hasDigit(value) {
  return /\d/.test(value);
}

function normalizeOptionalString(value, fieldName, maxLength) {
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

  if (trimmed.length > MAX_CUSTOMER_NAME_LENGTH) {
    return {
      error: "Customer name must be at most 80 characters."
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

  if (trimmed.length < 10 || trimmed.length > MAX_PHONE_LENGTH) {
    return {
      error: "Phone must contain between 10 and 15 digits."
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
    const customerAddress = normalizeOptionalString(address, "Address", MAX_ADDRESS_LENGTH);
    const customerNote = normalizeOptionalString(note, "Note", MAX_NOTE_LENGTH);

    const error = customerName.error || customerPhone.error || customerAddress.error || customerNote.error;

    if (error) {
      return validationError(res, error);
    }

    const customer = await prisma.customer.create({
      data: {
        userId: req.user.id,
        name: customerName.value,
        phone: customerPhone.value,
        address: customerAddress.value,
        note: customerNote.value
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
    const customerAddress = normalizeOptionalString(address, "Address", MAX_ADDRESS_LENGTH);
    const customerNote = normalizeOptionalString(note, "Note", MAX_NOTE_LENGTH);

    if (customerAddress.error || customerNote.error) {
      return validationError(res, customerAddress.error || customerNote.error);
    }

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
        ...(address !== undefined ? { address: customerAddress.value } : {}),
        ...(note !== undefined ? { note: customerNote.value } : {})
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
