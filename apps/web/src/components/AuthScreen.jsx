import { useState } from "react";
import { login, register } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: ""
};

function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
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
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setMessage("");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">İşlik Cloud</p>
        <h1>{mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}</h1>
        <p className="hero-text">
          Müşteri ve iş takip paneline devam etmek için hesabınla giriş yap.
        </p>

        {message ? <p className="message">{message}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              Ad Soyad
              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="Ahmet Yılmaz"
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
              required
            />
          </label>

          <button type="submit">
            {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
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
