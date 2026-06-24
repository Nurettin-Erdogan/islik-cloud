import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createCustomer,
  createJob,
  deleteCustomer,
  deleteJob,
  getCustomers,
  getJobs,
  updateCustomer,
  updateJob
} from "./services/api";

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
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
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

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return [customer.name, customer.phone, customer.address, customer.note]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [customers, customerSearch]);

  const filteredJobs = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch = query
        ? [job.title, job.description, job.customer?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;

      const matchesStatus =
        jobStatusFilter === "all" ? true : job.status === jobStatusFilter;

      const matchesPayment =
        paymentStatusFilter === "all"
          ? true
          : job.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [jobs, jobSearch, jobStatusFilter, paymentStatusFilter]);

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

  function resetCustomerForm() {
    setCustomerForm(initialCustomerForm);
    setEditingCustomerId(null);
  }

  function resetJobForm() {
    setJobForm(initialJobForm);
    setEditingJobId(null);
  }

  function resetFilters() {
    setCustomerSearch("");
    setJobSearch("");
    setJobStatusFilter("all");
    setPaymentStatusFilter("all");
  }

  function startEditCustomer(customer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      note: customer.note || ""
    });
    setMessage(`${customer.name} düzenleme moduna alındı.`);
  }

  function startEditJob(job) {
    setEditingJobId(job.id);
    setJobForm({
      customerId: job.customerId || "",
      title: job.title || "",
      description: job.description || "",
      price: String(job.price || ""),
      status: job.status || "pending",
      paymentStatus: job.paymentStatus || "unpaid"
    });
    setMessage(`${job.title} düzenleme moduna alındı.`);
  }

  async function handleCustomerSubmit(event) {
    event.preventDefault();

    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, customerForm);
        setMessage("Müşteri güncellendi.");
      } else {
        await createCustomer(customerForm);
        setMessage("Müşteri eklendi.");
      }

      resetCustomerForm();
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleJobSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...jobForm,
        price: Number(jobForm.price || 0)
      };

      if (editingJobId) {
        await updateJob(editingJobId, payload);
        setMessage("İş kaydı güncellendi.");
      } else {
        await createJob(payload);
        setMessage("İş kaydı eklendi.");
      }

      resetJobForm();
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleDeleteCustomer(customer) {
    const confirmed = window.confirm(
      `${customer.name} müşterisini silmek istiyor musun? Bu müşteriye bağlı işler de silinir.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer.id);

      if (editingCustomerId === customer.id) {
        resetCustomerForm();
      }

      setMessage("Müşteri silindi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleDeleteJob(job) {
    const confirmed = window.confirm(`${job.title} iş kaydını silmek istiyor musun?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteJob(job.id);

      if (editingJobId === job.id) {
        resetJobForm();
      }

      setMessage("İş kaydı silindi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleMarkJobCompleted(job) {
    try {
      await updateJob(job.id, {
        status: "completed"
      });

      setMessage("İş tamamlandı olarak işaretlendi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  async function handleMarkJobPaid(job) {
    try {
      await updateJob(job.id, {
        paymentStatus: "paid"
      });

      setMessage("Ödeme ödendi olarak işaretlendi.");
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

      <section className="panel filter-panel">
        <div>
          <h2>Arama ve Filtreler</h2>
          <p>Müşteri ve iş kayıtlarını hızlıca bul.</p>
        </div>

        <div className="filter-grid">
          <label>
            Müşteri Ara
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Ad, telefon, adres veya not ara"
            />
          </label>

          <label>
            İş Ara
            <input
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder="İş başlığı, açıklama veya müşteri ara"
            />
          </label>

          <label>
            İş Durumu
            <select
              value={jobStatusFilter}
              onChange={(event) => setJobStatusFilter(event.target.value)}
            >
              <option value="all">Tüm durumlar</option>
              <option value="pending">Bekliyor</option>
              <option value="in_progress">Devam ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal edildi</option>
            </select>
          </label>

          <label>
            Ödeme Durumu
            <select
              value={paymentStatusFilter}
              onChange={(event) => setPaymentStatusFilter(event.target.value)}
            >
              <option value="all">Tüm ödemeler</option>
              <option value="unpaid">Ödenmedi</option>
              <option value="partial">Kısmi ödendi</option>
              <option value="paid">Ödendi</option>
            </select>
          </label>
        </div>

        <div className="filter-summary">
          <span>{filteredCustomers.length} müşteri gösteriliyor</span>
          <span>{filteredJobs.length} iş gösteriliyor</span>
          <button type="button" className="secondary-button" onClick={resetFilters}>
            Filtreleri Temizle
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}
      {loading ? <p className="message">Veriler yükleniyor...</p> : null}

      <section className="workspace-grid">
        <form className="panel" onSubmit={handleCustomerSubmit}>
          <h2>{editingCustomerId ? "Müşteri Düzenle" : "Müşteri Ekle"}</h2>

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

          <div className="form-actions">
            <button type="submit">
              {editingCustomerId ? "Müşteriyi Güncelle" : "Müşteri Kaydet"}
            </button>

            {editingCustomerId ? (
              <button type="button" className="secondary-button" onClick={resetCustomerForm}>
                Vazgeç
              </button>
            ) : null}
          </div>
        </form>

        <form className="panel" onSubmit={handleJobSubmit}>
          <h2>{editingJobId ? "İş Kaydı Düzenle" : "İş Kaydı Ekle"}</h2>

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

          <div className="form-actions">
            <button type="submit" disabled={customers.length === 0}>
              {editingJobId ? "İşi Güncelle" : "İş Kaydet"}
            </button>

            {editingJobId ? (
              <button type="button" className="secondary-button" onClick={resetJobForm}>
                Vazgeç
              </button>
            ) : null}
          </div>

          {customers.length === 0 ? (
            <small>İş eklemek için önce müşteri oluştur.</small>
          ) : null}
        </form>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>Müşteriler</h2>

          <div className="list">
            {filteredCustomers.length === 0 ? (
              <p>Filtreye uygun müşteri yok.</p>
            ) : (
              filteredCustomers.map((customer) => (
                <div className="list-item" key={customer.id}>
                  <div>
                    <strong>{customer.name}</strong>
                    <span>{customer.phone || "Telefon yok"}</span>
                    <small>{customer.address || "Adres yok"}</small>
                  </div>

                  <div className="list-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => startEditCustomer(customer)}
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDeleteCustomer(customer)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <h2>İşler</h2>

          <div className="list">
            {filteredJobs.length === 0 ? (
              <p>Filtreye uygun iş kaydı yok.</p>
            ) : (
              filteredJobs.map((job) => (
                <div className="list-item" key={job.id}>
                  <div>
                    <strong>{job.title}</strong>
                    <span>{job.customer?.name || "Müşteri yok"}</span>
                    <small>
                      {job.status} · {job.paymentStatus} ·{" "}
                      {Number(job.price || 0).toLocaleString("tr-TR")} TL
                    </small>
                  </div>

                  <div className="list-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => startEditJob(job)}
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="ghost-button"
                      disabled={job.status === "completed"}
                      onClick={() => handleMarkJobCompleted(job)}
                    >
                      Tamamlandı
                    </button>

                    <button
                      type="button"
                      className="ghost-button"
                      disabled={job.paymentStatus === "paid"}
                      onClick={() => handleMarkJobPaid(job)}
                    >
                      Ödendi
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDeleteJob(job)}
                    >
                      Sil
                    </button>
                  </div>
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
