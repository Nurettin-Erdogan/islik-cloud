import { useEffect, useState } from "react";
import CustomerPortal from "./CustomerPortal";
import InstallAppButton from "./InstallAppButton";
import { login, register, warmUpApi } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: ""
};

const WARMUP_HINT_DELAY_MS = 1_600;
const SLOW_SUBMIT_DELAY_MS = 2_400;

function getAuthErrorMessage(error, mode) {
  const message = error?.message || "Beklenmeyen bir hata oluştu.";

  if (message === "Email is already registered.") {
    return mode === "register"
      ? "Bu e-posta zaten kayıtlı. Giriş moduna aldım, şifrenle giriş yapabilirsin."
      : "Bu e-posta zaten kayıtlı.";
  }

  if (message === "Invalid email or password.") {
    return "E-posta veya şifre hatalı.";
  }

  if (message === "Valid email is required.") {
    return "Geçerli bir e-posta gir.";
  }

  if (message === "Password must be at least 8 characters.") {
    return "Şifre en az 8 karakter olmalı.";
  }

  if (message === "Password must be at most 128 characters.") {
    return "Şifre en fazla 128 karakter olabilir.";
  }

  if (message === "Name cannot contain numbers.") {
    return "Ad soyad alanında rakam kullanma.";
  }

  if (message === "Name is required." || message === "Name must be at least 2 characters.") {
    return "Ad soyad en az 2 karakter olmalı.";
  }

  return message;
}

function getAuthValidationError(form, mode) {
  const email = form.email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Geçerli bir e-posta gir.";
  }

  if (email.length > 254) {
    return "E-posta en fazla 254 karakter olabilir.";
  }

  if (mode === "register" && form.name.trim().length < 2) {
    return "Ad soyad en az 2 karakter olmalı.";
  }

  if (mode === "register" && form.password.length < 8) {
    return "Şifre en az 8 karakter olmalı.";
  }

  if (form.password.length > 128) {
    return "Şifre en fazla 128 karakter olabilir.";
  }

  if (!form.password) {
    return "Şifreni gir.";
  }

  return "";
}

function getInitialEntryMode() {
  if (typeof window === "undefined") {
    return "customer";
  }

  const entry = new URLSearchParams(window.location.search).get("entry");
  return entry === "technician" ? "technician" : "customer";
}

function AuthScreen({ onAuthSuccess, initialMessage = "" }) {
  const [entryMode, setEntryMode] = useState(getInitialEntryMode);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);
  const [warmupTakingLong, setWarmupTakingLong] = useState(false);
  const [slowSubmit, setSlowSubmit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const warmupTimerId = setTimeout(() => {
      if (isMounted) {
        setWarmupTakingLong(true);
      }
    }, WARMUP_HINT_DELAY_MS);

    warmUpApi().finally(() => {
      clearTimeout(warmupTimerId);

      if (isMounted) {
        setWarmupTakingLong(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(warmupTimerId);
    };
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    const nextValue = name === "name" ? value.replace(/\d/g, "") : value;

    setForm((current) => ({
      ...current,
      [name]: nextValue
    }));
  }

  function submitOnEnter(event) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    if (event.target.tagName === "TEXTAREA") {
      return;
    }

    event.preventDefault();
    event.currentTarget.requestSubmit();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationError = getAuthValidationError(form, mode);

    if (validationError) {
      setMessage("Hata: " + validationError);
      return;
    }

    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase()
    };

    const slowSubmitTimerId = setTimeout(() => {
      setSlowSubmit(true);
    }, SLOW_SUBMIT_DELAY_MS);

    try {
      setSubmitting(true);
      setSlowSubmit(false);

      const response =
        mode === "register"
          ? await register(normalizedForm)
          : await login({
              email: normalizedForm.email,
              password: normalizedForm.password
            });

      setMessage("");
      onAuthSuccess(response.data.user);
    } catch (error) {
      if (mode === "register" && error.message === "Email is already registered.") {
        setMode("login");
      }

      setMessage("Hata: " + getAuthErrorMessage(error, mode));
    } finally {
      clearTimeout(slowSubmitTimerId);
      setSubmitting(false);
      setSlowSubmit(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
    setSlowSubmit(false);
  }

  const helperMessage = slowSubmit
    ? "Sunucu hazırlanıyor olabilir, birazdan devam edeceğiz."
    : warmupTakingLong && !submitting
      ? "Bağlantı hazırlanıyor, bilgilerini girmeye devam edebilirsin."
      : "";

  return (
    <main className="auth-shell">
      <section className="auth-entry">
        <div className="auth-entry-switch" aria-label="Giriş türü">
          <button
            type="button"
            className={`auth-entry-button ${entryMode === "customer" ? "is-active" : ""}`}
            onClick={() => setEntryMode("customer")}
          >
            Müşteri
          </button>
          <button
            type="button"
            className={`auth-entry-button ${entryMode === "technician" ? "is-active" : ""}`}
            onClick={() => setEntryMode("technician")}
          >
            Usta
          </button>
        </div>

        {entryMode === "customer" ? <CustomerPortal /> : null}

        {entryMode === "technician" ? (
        <section className="auth-card technician-card">
          <p className="eyebrow">Usta Paneli</p>
          <h1>{mode === "login" ? "Servis Girişi" : "Usta Hesabı Oluştur"}</h1>
          <p className="hero-text">
            Gelen müşteri taleplerini, randevuları ve ödemeleri yönetmek için giriş yap.
          </p>

          {message ? (
            <p className="message" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
          {helperMessage ? (
            <p className="auth-hint" role="status" aria-live="polite">
              {helperMessage}
            </p>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} onKeyDown={submitOnEnter}>
            {mode === "register" ? (
              <label>
                Ad Soyad
                <input
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="Ahmet Yılmaz"
                  autoComplete="name"
                  pattern="[^0-9]*"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            ) : null}

            <label>
              E-posta
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="ornek@mail.com"
                autoComplete="email"
                autoFocus
                maxLength={254}
                required
              />
            </label>

            <label>
              Şifre
              <input
                name="password"
                type="password"
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                value={form.password}
                onChange={updateForm}
                placeholder={mode === "register" ? "En az 8 karakter" : "Şifren"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting
                ? slowSubmit
                  ? "Sunucu hazırlanıyor..."
                  : "Kontrol ediliyor..."
                : mode === "login"
                  ? "Usta Girişi Yap"
                  : "Kayıt Ol"}
            </button>
          </form>

          <div className="auth-actions">
            <button type="button" className="secondary-button auth-switch" onClick={switchMode}>
              {mode === "login"
                ? "Usta hesabın yok mu? Kayıt ol"
                : "Hesabın var mı? Giriş yap"}
            </button>
            <InstallAppButton className="auth-install" />
          </div>
        </section>
        ) : null}
      </section>
    </main>
  );
}

export default AuthScreen;
