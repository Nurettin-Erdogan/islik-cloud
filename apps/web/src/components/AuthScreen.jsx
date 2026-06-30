import { useEffect, useState } from "react";
import { login, register, warmUpApi } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: ""
};

const WARMUP_HINT_DELAY_MS = 1_600;
const SLOW_SUBMIT_DELAY_MS = 2_400;

function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
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

    const slowSubmitTimerId = setTimeout(() => {
      setSlowSubmit(true);
    }, SLOW_SUBMIT_DELAY_MS);

    try {
      setSubmitting(true);
      setSlowSubmit(false);

      const response =
        mode === "register"
          ? await register(form)
          : await login({
              email: form.email,
              password: form.password
            });

      setMessage("");
      onAuthSuccess(response.data.user);
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
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
      <section className="auth-card">
        <p className="eyebrow">Dükkan Defteri</p>
        <h1>{mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}</h1>
        <p className="hero-text">
          Müşteri ve iş takip paneline devam etmek için hesabınla giriş yap.
        </p>

        {message ? <p className="message">{message}</p> : null}
        {helperMessage ? <p className="auth-hint">{helperMessage}</p> : null}

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
              required
            />
          </label>

          <label>
            Şifre
            <input
              name="password"
              type="password"
              minLength="6"
              value={form.password}
              onChange={updateForm}
              placeholder="En az 6 karakter"
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
                ? "Giriş Yap"
                : "Kayıt Ol"}
          </button>
        </form>

        <button type="button" className="secondary-button auth-switch" onClick={switchMode}>
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Hesabın var mı? Giriş yap"}
        </button>
      </section>
    </main>
  );
}

export default AuthScreen;
