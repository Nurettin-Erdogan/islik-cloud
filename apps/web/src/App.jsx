import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createCustomer, createJob, getCustomers, getJobs } from "./services/api";

const initialCustomerForm = {
  name: "",
  phone: "",
  address: "",
  note: ""
};

const initialJobForm = {
  customerId: "",
  title: "",
  description: "",
  price: "",
  status: "pending",
  paymentStatus: "unpaid"
};

function App() {
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const totalRevenue = useMemo(() => {
    return jobs
      .filter((job) => job.paymentStatus === "paid")
      .reduce((total, job) => total + Number(job.price || 0), 0);
  }, [jobs]);

  const pendingJobs = useMemo(() => {
    return jobs.filter((job) => job.status !== "completed").length;
  }, [jobs]);

  async function loadData() {
    try {
      setLoading(true);

      const [customersResponse, jobsResponse] = await Promise.all([
        getCustomers(),
        getJobs()
      ]);

      setCustomers(customersResponse.data || []);
      setJobs(jobsResponse.data || []);
      setMessage("");
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateCustomerForm(event) {
    const { name, value } = event.target;
    setCustomerForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateJobForm(event) {
    const { name, value } = event.target;
    setJobForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();

    try {
      await createCustomer(customerForm);
      setCustomerForm(initialCustomerForm);
      setMessage("Müşteri eklendi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleJobSubmit(event) {
    event.preventDefault();

    try {
      await createJob({
        ...jobForm,
        price: Number(jobForm.price || 0)
      });

      setJobForm(initialJobForm);
      setMessage("İş kaydı eklendi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">İşlik Cloud</p>
        <h1>Küçük servis işletmeleri için iş takip paneli</h1>
        <p className="hero-text">
          Müşteri, servis işi ve ödeme durumlarını PostgreSQL destekli API üzerinden
          yöneten full-stack uygulama.
        </p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Müşteri</span>
          <strong>{customers.length}</strong>
        </article>

        <article className="stat-card">
          <span>İş Kaydı</span>
          <strong>{jobs.length}</strong>
        </article>

        <article className="stat-card">
          <span>Bekleyen İş</span>
          <strong>{pendingJobs}</strong>
        </article>

        <article className="stat-card">
          <span>Ödenmiş Gelir</span>
          <strong>{totalRevenue.toLocaleString("tr-TR")} TL</strong>
        </article>
      </section>

      {message ? <p className="message">{message}</p> : null}
      {loading ? <p className="message">Veriler yükleniyor...</p> : null}

      <section className="workspace-grid">
        <form className="panel" onSubmit={handleCustomerSubmit}>
          <h2>Müşteri Ekle</h2>

          <label>
            Ad Soyad
            <input
              name="name"
              value={customerForm.name}
              onChange={updateCustomerForm}
              placeholder="Ahmet Yılmaz"
              required
            />
          </label>

          <label>
            Telefon
            <input
              name="phone"
              value={customerForm.phone}
              onChange={updateCustomerForm}
              placeholder="05551234567"
            />
          </label>

          <label>
            Adres
            <input
              name="address"
              value={customerForm.address}
              onChange={updateCustomerForm}
              placeholder="İstanbul"
            />
          </label>

          <label>
            Not
            <textarea
              name="note"
              value={customerForm.note}
              onChange={updateCustomerForm}
              placeholder="Müşteri notu"
            />
          </label>

          <button type="submit">Müşteri Kaydet</button>
        </form>

        <form className="panel" onSubmit={handleJobSubmit}>
          <h2>İş Kaydı Ekle</h2>

          <label>
            Müşteri
            <select
              name="customerId"
              value={jobForm.customerId}
              onChange={updateJobForm}
              required
            >
              <option value="">Müşteri seç</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            İş Başlığı
            <input
              name="title"
              value={jobForm.title}
              onChange={updateJobForm}
              placeholder="Klima bakımı"
              required
            />
          </label>

          <label>
            Açıklama
            <textarea
              name="description"
              value={jobForm.description}
              onChange={updateJobForm}
              placeholder="Yıllık servis kontrolü"
            />
          </label>

          <label>
            Fiyat
            <input
              name="price"
              type="number"
              min="0"
              value={jobForm.price}
              onChange={updateJobForm}
              placeholder="1200"
            />
          </label>

          <label>
            Durum
            <select name="status" value={jobForm.status} onChange={updateJobForm}>
              <option value="pending">Bekliyor</option>
              <option value="in_progress">Devam ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal edildi</option>
            </select>
          </label>

          <label>
            Ödeme
            <select
              name="paymentStatus"
              value={jobForm.paymentStatus}
              onChange={updateJobForm}
            >
              <option value="unpaid">Ödenmedi</option>
              <option value="partial">Kısmi ödendi</option>
              <option value="paid">Ödendi</option>
            </select>
          </label>

          <button type="submit" disabled={customers.length === 0}>
            İş Kaydet
          </button>

          {customers.length === 0 ? (
            <small>İş eklemek için önce müşteri oluştur.</small>
          ) : null}
        </form>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>Müşteriler</h2>

          <div className="list">
            {customers.length === 0 ? (
              <p>Henüz müşteri yok.</p>
            ) : (
              customers.map((customer) => (
                <div className="list-item" key={customer.id}>
                  <strong>{customer.name}</strong>
                  <span>{customer.phone || "Telefon yok"}</span>
                  <small>{customer.address || "Adres yok"}</small>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <h2>İşler</h2>

          <div className="list">
            {jobs.length === 0 ? (
              <p>Henüz iş kaydı yok.</p>
            ) : (
              jobs.map((job) => (
                <div className="list-item" key={job.id}>
                  <strong>{job.title}</strong>
                  <span>{job.customer?.name || "Müşteri yok"}</span>
                  <small>
                    {job.status} · {job.paymentStatus} ·{" "}
                    {Number(job.price || 0).toLocaleString("tr-TR")} TL
                  </small>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
