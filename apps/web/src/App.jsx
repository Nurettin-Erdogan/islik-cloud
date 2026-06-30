import { useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthScreen from "./components/AuthScreen";
import CustomerForm from "./components/CustomerForm";
import CustomerList from "./components/CustomerList";
import DashboardHeader from "./components/DashboardHeader";
import FiltersPanel from "./components/FiltersPanel";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import StatsGrid from "./components/StatsGrid";
import {
  createCustomer,
  createJob,
  deleteCustomer,
  deleteJob,
  getCustomers,
  getJobs,
  getMe,
  getToken,
  logout,
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
  paidAmount: "",
  status: "pending",
  priority: "normal",
  paymentStatus: "unpaid",
  appointmentAt: ""
};

function toDatetimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getMinAppointmentValue() {
  return toDatetimeLocalValue(new Date());
}

function getCurrentMinute() {
  const currentMinute = new Date();
  currentMinute.setSeconds(0, 0);
  return currentMinute;
}

function isPastAppointment(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date < getCurrentMinute();
}

function toApiAppointment(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

function includesSearch(value, query) {
  return normalizeSearchValue(value).includes(query);
}

function startsWithSearch(value, query) {
  return normalizeSearchValue(value).startsWith(query);
}

function getPaidAmountForJob(job) {
  const price = Number(job.price || 0);

  if (job.paymentStatus === "paid") {
    return price;
  }

  if (job.paymentStatus === "partial") {
    return Math.min(Number(job.paidAmount || 0), price);
  }

  return 0;
}

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
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [message, setMessage] = useState("");
  const [minAppointmentAt, setMinAppointmentAt] = useState(getMinAppointmentValue);

  const totalRevenue = useMemo(() => {
    return jobs.reduce((total, job) => total + getPaidAmountForJob(job), 0);
  }, [jobs]);

  const pendingJobs = useMemo(() => {
    return jobs.filter((job) => job.status !== "completed").length;
  }, [jobs]);

  const filteredCustomers = useMemo(() => {
    const query = normalizeSearchValue(customerSearch.trim());

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return [customer.name, customer.phone, customer.address, customer.note]
        .filter(Boolean)
        .some((value) => includesSearch(value, query));
    });
  }, [customers, customerSearch]);

  const filteredJobs = useMemo(() => {
    const jobQuery = normalizeSearchValue(jobSearch.trim());
    const customerQuery = normalizeSearchValue(customerSearch.trim());

    return jobs.filter((job) => {
      const matchesJobSearch = jobQuery
        ? [job.title, job.description, job.customer?.name]
            .filter(Boolean)
            .some((value) => includesSearch(value, jobQuery))
        : true;

      const matchesCustomerSearch = customerQuery
        ? startsWithSearch(job.customer?.name, customerQuery) ||
          [job.customer?.phone, job.customer?.address, job.customer?.note]
            .filter(Boolean)
            .some((value) => includesSearch(value, customerQuery))
        : true;

      const matchesStatus =
        jobStatusFilter === "all" ? true : job.status === jobStatusFilter;

      const matchesPayment =
        paymentStatusFilter === "all"
          ? true
          : job.paymentStatus === paymentStatusFilter;

      return matchesJobSearch && matchesCustomerSearch && matchesStatus && matchesPayment;
    });
  }, [jobs, jobSearch, customerSearch, jobStatusFilter, paymentStatusFilter]);

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
    async function loadSession() {
      if (!getToken()) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await getMe();
        setAuthUser(response.data.user);
      } catch {
        logout();
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMinAppointmentAt(getMinAppointmentValue());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (authUser) {
      loadData();
    }
  }, [authUser]);

  function updateCustomerForm(event) {
    const { name, value } = event.target;
    setCustomerForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateJobForm(event) {
    const { name, value } = event.target;

    setJobForm((current) => {
      const nextForm = {
        ...current,
        [name]: value
      };

      if (name === "paymentStatus") {
        if (value === "unpaid") {
          nextForm.paidAmount = "0";
        }

        if (value === "paid") {
          nextForm.paidAmount = nextForm.price || "0";
        }
      }

      if (name === "price" && current.paymentStatus === "paid") {
        nextForm.paidAmount = value || "0";
      }

      return nextForm;
    });
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
      paidAmount: String(job.paidAmount ?? (job.paymentStatus === "paid" ? job.price || 0 : "")),
      status: job.status || "pending",
      priority: job.priority || "normal",
      paymentStatus: job.paymentStatus || "unpaid",
      appointmentAt: toDatetimeLocalValue(job.appointmentAt)
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

    if (isPastAppointment(jobForm.appointmentAt)) {
      setMessage("Hata: Geçmiş tarihli randevu eklenemez.");
      return;
    }

    const price = Number(jobForm.price || 0);
    let paidAmount = Number(jobForm.paidAmount || 0);

    if (jobForm.paymentStatus === "unpaid") {
      paidAmount = 0;
    }

    if (jobForm.paymentStatus === "paid") {
      paidAmount = price;
    }

    if (jobForm.paymentStatus === "partial") {
      if (price <= 0) {
        setMessage("Hata: Kısmi ödeme için önce fiyat gir.");
        return;
      }

      if (paidAmount <= 0) {
        setMessage("Hata: Kısmi ödemede ödenen tutarı gir.");
        return;
      }

      if (paidAmount >= price) {
        setMessage("Hata: Kısmi ödeme toplam fiyattan küçük olmalı.");
        return;
      }
    }

    try {
      const payload = {
        ...jobForm,
        price,
        paidAmount,
        appointmentAt: toApiAppointment(jobForm.appointmentAt)
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
        paidAmount: Number(job.price || 0),
        paymentStatus: "paid"
      });

      setMessage("Ödeme ödendi olarak işaretlendi.");
      await loadData();
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }

  function handleLogout() {
    logout();
    setAuthUser(null);
    setCustomers([]);
    setJobs([]);
    setMessage("");
  }

  if (authLoading) {
    return (
      <main className="app-shell">
        <p className="message">Oturum kontrol ediliyor...</p>
      </main>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuthSuccess={setAuthUser} />;
  }

  return (
    <main className="app-shell">
      <DashboardHeader userEmail={authUser.email} onLogout={handleLogout} />

      <StatsGrid
        customerCount={customers.length}
        jobCount={jobs.length}
        pendingJobs={pendingJobs}
        totalRevenue={totalRevenue}
      />

      <FiltersPanel
        customerSearch={customerSearch}
        jobSearch={jobSearch}
        jobStatusFilter={jobStatusFilter}
        paymentStatusFilter={paymentStatusFilter}
        filteredCustomerCount={filteredCustomers.length}
        filteredJobCount={filteredJobs.length}
        onCustomerSearchChange={setCustomerSearch}
        onJobSearchChange={setJobSearch}
        onJobStatusFilterChange={setJobStatusFilter}
        onPaymentStatusFilterChange={setPaymentStatusFilter}
        onResetFilters={resetFilters}
      />

      {message ? <p className="message">{message}</p> : null}
      {loading ? <p className="message">Veriler yükleniyor...</p> : null}

      <section className="workspace-grid">
        <CustomerForm
          form={customerForm}
          editingCustomerId={editingCustomerId}
          onChange={updateCustomerForm}
          onSubmit={handleCustomerSubmit}
          onReset={resetCustomerForm}
        />

        <JobForm
          form={jobForm}
          customers={customers}
          editingJobId={editingJobId}
          minAppointmentAt={minAppointmentAt}
          onChange={updateJobForm}
          onSubmit={handleJobSubmit}
          onReset={resetJobForm}
        />
      </section>

      <section className="workspace-grid">
        <CustomerList
          customers={filteredCustomers}
          onEdit={startEditCustomer}
          onDelete={handleDeleteCustomer}
        />

        <JobList
          jobs={filteredJobs}
          onEdit={startEditJob}
          onMarkCompleted={handleMarkJobCompleted}
          onMarkPaid={handleMarkJobPaid}
          onDelete={handleDeleteJob}
        />
      </section>
    </main>
  );
}

export default App;
