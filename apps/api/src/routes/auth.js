const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeName(name) {
  if (typeof name !== "string") {
    return {
      error: "Name is required."
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      error: "Name must be at least 2 characters."
    };
  }

  if (/\d/.test(trimmed)) {
    return {
      error: "Name cannot contain numbers."
    };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return {
      error: "Name must be at most 80 characters."
    };
  }

  return {
    value: trimmed
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const name = normalizeName(req.body.name);
    const password = req.body.password;

    if (name.error) {
      return res.status(400).json({
        error: {
          message: name.error
        }
      });
    }

    if (
      !email ||
      email.length > MAX_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        error: {
          message: "Valid email is required."
        }
      });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: {
          message: "Password must be at least 8 characters."
        }
      });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: {
          message: "Password must be at most 128 characters."
        }
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: {
          message: "Email is already registered."
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.value,
        email,
        passwordHash
      }
    });

    res.status(201).json({
      data: {
        user: publicUser(user),
        token: signToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (
      !email ||
      email.length > MAX_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password."
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password."
        }
      });
    }

    const passwordMatches = await bcrypt.compare(password || "", user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          message: "Invalid email or password."
        }
      });
    }

    res.json({
      data: {
        user: publicUser(user),
        token: signToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          message: "User not found."
        }
      });
    }

    res.json({
      data: {
        user: publicUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
