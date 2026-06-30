const express = require("express");
const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeName(name) {
  if (name === undefined || name === null) {
    return {
      value: null
    };
  }

  if (typeof name !== "string") {
    return {
      error: "Name must be a string."
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      value: null
    };
  }

  if (/\d/.test(trimmed)) {
    return {
      error: "Name cannot contain numbers."
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

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        error: {
          message: "Valid email is required."
        }
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        error: {
          message: "Password must be at least 6 characters."
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
