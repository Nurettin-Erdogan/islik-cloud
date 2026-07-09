import { useEffect, useMemo, useState } from "react";
import "./App.css";
import AuthScreen from "./components/AuthScreen";
import CustomerForm from "./components/CustomerForm";
import CustomerList from "./components/CustomerList";
import DashboardHeader from "./components/DashboardHeader";
import FiltersPanel from "./components/FiltersPanel";
import JobForm from "./components/JobForm";
import InstallAppButton from "./components/InstallAppButton";
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
  getStoredUser,
  getToken,
  logout,
  setStoredUser,
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
  productCategory: "other",
  productBrand: "",
  productModel: "",
  price: "",
  paidAmount: "",
  status: "pending",
  priority: "normal",
  paymentStatus: "unpaid",
  appointmentAt: ""
};
const activeViewIds = new Set(["today", "overview", "customers", "jobs", "search"]);
function getInitialActiveView() {
  if (typeof window === "undefined") {
    return "today";
  }
  const hashView = window.location.hash.replace("#", "");
  return activeViewIds.has(hashView) ? hashView : "today";
}
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
function getSearchTokens(value) {
  return normalizeSearchValue(value).split(/\s+/).filter(Boolean);
}
function getDigitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}
function includesSearch(value, query) {
  return normalizeSearchValue(value).includes(query);
}
function fieldMatchesSearch(value, query) {
  if (includesSearch(value, query)) {
    return true;
  }
  const queryDigits = getDigitsOnly(query);
  return Boolean(queryDigits && getDigitsOnly(value).includes(queryDigits));
}
function startsWithSearch(value, query) {
  return normalizeSearchValue(value).startsWith(query);
}
function digitsIncludeSearch(value, query) {
  const queryDigits = getDigitsOnly(query);
  return Boolean(queryDigits && getDigitsOnly(value).includes(queryDigits));
}
function matchesTextSearch(fields, searchText) {
  const tokens = getSearchTokens(searchText);
  if (tokens.length === 0) {
    return true;
  }
  const searchableFields = fields.filter(Boolean);
  return tokens.every((token) =>
    searchableFields.some((value) => fieldMatchesSearch(value, token))
  );
}
function matchesCustomerSearch(customer, searchText) {
  const query = normalizeSearchValue(searchText.trim());
  if (!query) {
    return true;
  }
  if (!customer) {
    return false;
  }
  if (query.length === 1) {
    return startsWithSearch(customer.name, query) || digitsIncludeSearch(customer.phone, searchText);
  }
  return matchesTextSearch(
    [customer.name, customer.phone, customer.address, customer.note],
    searchText
  );
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
function getAppointmentTime(job) {
  const date = new Date(job.appointmentAt || "");
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
}
function isSameLocalDate(value, compareDate = new Date()) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}
function isOverdueJob(job) {
  if (!job.appointmentAt || job.status === "completed" || job.status === "cancelled") {
    return false;
  }
  return new Date(job.appointmentAt) < getCurrentMinute();
}
function sortJobsByAppointment(jobs) {
  return [...jobs].sort((first, second) => {
    const firstTime = getAppointmentTime(first);
    const secondTime = getAppointmentTime(second);
    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }
    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });
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
  const [jobBoardFilter, setJobBoardFilter] = useState("today");
  const [activeView, setActiveView] = useState(getInitialActiveView);
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken() && !getStoredUser()));
  const [message, setMessage] = useState("");
  const [minAppointmentAt, setMinAppointmentAt] = useState(getMinAppointmentValue);
  const totalRevenue = useMemo(() => {
    return jobs.reduce((total, job) => total + getPaidAmountForJob(job), 0);
  }, [jobs]);
  const pendingJobs = useMemo(() => {
    return jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled").length;
  }, [jobs]);
  const openJobs = useMemo(
    () => jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled"),
    [jobs]
  );
  const todayJobs = useMemo(
    () => sortJobsByAppointment(openJobs.filter((job) => isSameLocalDate(job.appointmentAt))),
    [openJobs]
  );
  const overdueJobs = useMemo(
    () => sortJobsByAppointment(openJobs.filter((job) => isOverdueJob(job))),
    [openJobs]
  );
  const urgentJobs = useMemo(
    () => sortJobsByAppointment(openJobs.filter((job) => job.priority === "urgent" || job.priority === "high")),
    [openJobs]
  );
  const paymentDueJobs = useMemo(
    () => sortJobsByAppointment(jobs.filter((job) => job.paymentStatus !== "paid" && Number(job.price || 0) > 0)),
    [jobs]
  );
  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed").slice(0, 12),
    [jobs]
  );
  const recentCustomers = useMemo(() => customers.slice(0, 4), [customers]);
  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim();
    return customers.filter((customer) => matchesCustomerSearch(customer, query));
  }, [customers, customerSearch]);
  const filteredJobs = useMemo(() => {
    const customerQuery = customerSearch.trim();
    return jobs.filter((job) => {
      const matchesJobSearch = matchesTextSearch(
        [
          job.title,
          job.description,
          job.requestCode,
          job.productCategory,
          job.productBrand,
          job.productModel,
          job.customer?.name,
          job.customer?.phone,
          job.customer?.address,
          job.customer?.note
        ],
        jobSearch
      );
      const matchesCustomer = matchesCustomerSearch(job.customer, customerQuery);
      const matchesStatus =
        jobStatusFilter === "all" ? true : job.status === jobStatusFilter;
      const matchesPayment =
        paymentStatusFilter === "all"
          ? true
          : job.paymentStatus === paymentStatusFilter;
      return matchesJobSearch && matchesCustomer && matchesStatus && matchesPayment;
    });
  }, [jobs, jobSearch, customerSearch, jobStatusFilter, paymentStatusFilter]);
  const pageMeta = {
    today: {
      eyebrow: "Plan",
      title: "Bugünün İşleri"
    },
    overview: {
      eyebrow: "Servis Defteri",
      title: "Özet"
    },
    customers: {
      eyebrow: "Müşteri",
      title: editingCustomerId ? "Müşteri Düzenle" : "Müşteriler"
    },
    jobs: {
      eyebrow: "Talep",
      title: editingJobId ? "Talep Düzenle" : "Talep Oluştur"
    },
    search: {
      eyebrow: "Arama",
      title: "Talep Ara"
    }
  };
  const currentPage = pageMeta[activeView] || pageMeta.overview;
  const navigationItems = [
    {
      id: "today",
      label: "Bugün",
      meta: "Randevu ve acil işler"
    },
    {
      id: "overview",
      label: "Özet",
      meta: "Genel durum"
    },
    {
      id: "customers",
      label: "Müşteri",
      meta: "Kayıt ve düzenleme"
    },
    {
      id: "jobs",
      label: "Talep",
      meta: "Ürün, randevu ve ödeme"
    },
    {
      id: "search",
      label: "Ara",
      meta: "Kod, müşteri ve durum"
    }
  ];
  function openView(viewId) {
    if (!activeViewIds.has(viewId)) {
      return;
    }
    setActiveView(viewId);
    if (typeof window !== "undefined" && window.location.hash !== `#${viewId}`) {
      window.history.pushState(null, "", `#${viewId}`);
    }
  }
  useEffect(() => {
    function syncViewFromRoute() {
      setActiveView(getInitialActiveView());
    }
    window.addEventListener("hashchange", syncViewFromRoute);
    window.addEventListener("popstate", syncViewFromRoute);
    return () => {
      window.removeEventListener("hashchange", syncViewFromRoute);
      window.removeEventListener("popstate", syncViewFromRoute);
    };
  }, []);
  useEffect(() => {
    async function loadSession() {
      if (!getToken()) {
        setAuthLoading(false);
        return;
      }
      const cachedUser = getStoredUser();
      if (cachedUser) {
        setAuthUser(cachedUser);
        setAuthLoading(false);
      }
      try {
        const response = await getMe();
        const user = response.data.user;
        setStoredUser(user);
        setAuthUser((current) => {
          if (current?.id === user.id && current?.email === user.email) {
            return current;
          }
          return user;
        });
      } catch {
        logout();
        setAuthUser(null);
        setCustomers([]);
        setJobs([]);
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
    if (!authUser?.id) {
      return;
    }

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

    loadData();
  }, [authUser?.id]);
  function upsertCustomerInState(customer) {
    setCustomers((current) => {
      const customerExists = current.some((item) => item.id === customer.id);
      if (customerExists) {
        return current.map((item) => (item.id === customer.id ? customer : item));
      }
      return [customer, ...current];
    });
    setJobs((current) =>
      current.map((job) =>
        job.customerId === customer.id ? { ...job, customer } : job
      )
    );
  }
  function removeCustomerFromState(customerId) {
    setCustomers((current) => current.filter((customer) => customer.id !== customerId));
    setJobs((current) => current.filter((job) => job.customerId !== customerId));
  }
  function getJobWithCustomer(job) {
    if (job.customer) {
      return job;
    }
    const customer = customers.find((item) => item.id === job.customerId);
    return customer ? { ...job, customer } : job;
  }
  function upsertJobInState(job) {
    const nextJob = getJobWithCustomer(job);
    setJobs((current) => {
      const jobExists = current.some((item) => item.id === nextJob.id);
      if (jobExists) {
        return current.map((item) => (item.id === nextJob.id ? nextJob : item));
      }
      return [nextJob, ...current];
    });
  }
  function removeJobFromState(jobId) {
    setJobs((current) => current.filter((job) => job.id !== jobId));
  }
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
  function openCustomerEntry() {
    resetCustomerForm();
    openView("customers");
  }
  function openJobEntry() {
    resetJobForm();
    openView("jobs");
  }
  function openJobForCustomer(customer) {
    resetJobForm();
    setJobForm({
      ...initialJobForm,
      customerId: customer.id
    });
    openView("jobs");
    setMessage(customer.name + " için yeni talep açılıyor.");
  }
  function startEditCustomer(customer) {
    openView("customers");
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
    openView("jobs");
    setEditingJobId(job.id);
    setJobForm({
      customerId: job.customerId || "",
      title: job.title || "",
      description: job.description || "",
      productCategory: job.productCategory || "other",
      productBrand: job.productBrand || "",
      productModel: job.productModel || "",
      price: String(job.price || ""),
      paidAmount: String(job.paidAmount ?? (job.paymentStatus === "paid" ? job.price || 0 : "")),
      status: job.status || "pending",
      priority: job.priority || "normal",
      paymentStatus: job.paymentStatus || "unpaid",
      appointmentAt: toDatetimeLocalValue(job.appointmentAt)
    });
    setMessage(`${job.title} talebi düzenleme moduna alındı.`);
  }
  async function handleCustomerSubmit(event) {
    event.preventDefault();
    try {
      if (editingCustomerId) {
        const response = await updateCustomer(editingCustomerId, customerForm);
        upsertCustomerInState(response.data);
        setMessage("Müşteri güncellendi.");
      } else {
        const response = await createCustomer(customerForm);
        upsertCustomerInState(response.data);
        setMessage("Müşteri eklendi.");
      }
      resetCustomerForm();
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
        const response = await updateJob(editingJobId, payload);
        upsertJobInState(response.data);
        setMessage("Talep güncellendi.");
      } else {
        const response = await createJob(payload);
        upsertJobInState(response.data);
        setMessage("Talep eklendi.");
      }
      resetJobForm();
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
      if (jobForm.customerId === customer.id) {
        resetJobForm();
      }
      removeCustomerFromState(customer.id);
      setMessage("Müşteri silindi.");
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }
  async function handleDeleteJob(job) {
    const confirmed = window.confirm(`${job.title} talebini silmek istiyor musun?`);
    if (!confirmed) {
      return;
    }
    try {
      await deleteJob(job.id);
      if (editingJobId === job.id) {
        resetJobForm();
      }
      removeJobFromState(job.id);
      setMessage("Talep silindi.");
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }
  async function handleMarkJobCompleted(job) {
    try {
      const response = await updateJob(job.id, {
        status: "completed"
      });
      upsertJobInState(response.data);
      setMessage("Talep tamamlandı olarak işaretlendi.");
    } catch (error) {
      setMessage(`Hata: ${error.message}`);
    }
  }
  async function handleMarkJobPaid(job) {
    try {
      const response = await updateJob(job.id, {
        paidAmount: Number(job.price || 0),
        paymentStatus: "paid"
      });
      upsertJobInState(response.data);
      setMessage("Ödeme ödendi olarak işaretlendi.");
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
  function renderOverviewPage() {
    return (
      <section className="page-stack">
        <StatsGrid
          customerCount={customers.length}
          jobCount={jobs.length}
          pendingJobs={pendingJobs}
          totalRevenue={totalRevenue}
        />
        <section className="action-strip" aria-label="Hızlı işlemler">
          <button type="button" onClick={() => openView("today")}>
            Bugünü Aç
          </button>
          <button type="button" onClick={openCustomerEntry}>
            Müşteri Ekle
          </button>
          <button type="button" onClick={openJobEntry}>
            Talep Aç
          </button>
          <button type="button" onClick={() => openView("search")}>
            Talep Ara
          </button>
        </section>
        <section className="workspace-grid">
          <JobList
            title="Son Talepler"
            emptyMessage="Henüz talep yok."
            jobs={recentJobs}
            onEdit={startEditJob}
            onMarkCompleted={handleMarkJobCompleted}
            onMarkPaid={handleMarkJobPaid}
            onDelete={handleDeleteJob}
          />
          <CustomerList
            customers={recentCustomers}
            onEdit={startEditCustomer}
            onCreateJob={openJobForCustomer}
            onDelete={handleDeleteCustomer}
          />
        </section>
      </section>
    );
  }
  function getJobBoardJobs() {
    if (jobBoardFilter === "open") {
      return sortJobsByAppointment(openJobs);
    }
    if (jobBoardFilter === "urgent") {
      return urgentJobs;
    }
    if (jobBoardFilter === "payment") {
      return paymentDueJobs;
    }
    if (jobBoardFilter === "completed") {
      return completedJobs;
    }
    return todayJobs;
  }
  function renderTodayPage() {
    const boardItems = [
      { id: "today", label: "Bugün", count: todayJobs.length },
      { id: "open", label: "Açık", count: openJobs.length },
      { id: "urgent", label: "Acil", count: urgentJobs.length },
      { id: "payment", label: "Ödeme", count: paymentDueJobs.length },
      { id: "completed", label: "Biten", count: completedJobs.length }
    ];
    const selectedBoard = boardItems.find((item) => item.id === jobBoardFilter) || boardItems[0];
    const boardJobs = getJobBoardJobs();
    return (
      <section className="page-stack">
        <section className="panel job-board">
          <div className="panel-heading">
            <h2>İş Panosu</h2>
            <span>{overdueJobs.length} geciken</span>
          </div>
          <div className="job-board-tabs" role="tablist" aria-label="İş panosu filtreleri">
            {boardItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`board-tab ${jobBoardFilter === item.id ? "is-active" : ""}`}
                onClick={() => setJobBoardFilter(item.id)}
              >
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>
        </section>
        <JobList
          title={selectedBoard.label + " Talepleri"}
          emptyMessage="Bu bölümde takip edilecek talep yok."
          jobs={boardJobs}
          onEdit={startEditJob}
          onMarkCompleted={handleMarkJobCompleted}
          onMarkPaid={handleMarkJobPaid}
          onDelete={handleDeleteJob}
        />
      </section>
    );
  }
  function renderCustomersPage() {
    return (
      <section className="page-stack">
        <section className="panel compact-filter">
          <div className="panel-heading">
            <h2>Müşteri Ara</h2>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setCustomerSearch("")}
            >
              Temizle
            </button>
          </div>
          <label>
            Arama
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Ad, telefon, adres veya not ara"
            />
          </label>
          <div className="filter-summary">
            <span>{filteredCustomers.length} müşteri</span>
          </div>
        </section>
        <section className="workspace-grid">
          <CustomerForm
            form={customerForm}
            editingCustomerId={editingCustomerId}
            onChange={updateCustomerForm}
            onSubmit={handleCustomerSubmit}
            onReset={resetCustomerForm}
          />
          <CustomerList
            customers={filteredCustomers}
            onEdit={startEditCustomer}
            onCreateJob={openJobForCustomer}
            onDelete={handleDeleteCustomer}
          />
        </section>
      </section>
    );
  }
  function renderJobsPage() {
    return (
      <section className="page-stack">
        <section className="workspace-grid">
          <JobForm
            form={jobForm}
            customers={customers}
            editingJobId={editingJobId}
            minAppointmentAt={minAppointmentAt}
            onChange={updateJobForm}
            onSubmit={handleJobSubmit}
            onReset={resetJobForm}
          />
          <JobList
            title="Tüm Talepler"
            jobs={jobs}
            onEdit={startEditJob}
            onMarkCompleted={handleMarkJobCompleted}
            onMarkPaid={handleMarkJobPaid}
            onDelete={handleDeleteJob}
          />
        </section>
      </section>
    );
  }
  function renderSearchPage() {
    return (
      <section className="page-stack">
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
        <section className="workspace-grid">
          <JobList
            jobs={filteredJobs}
            onEdit={startEditJob}
            onMarkCompleted={handleMarkJobCompleted}
            onMarkPaid={handleMarkJobPaid}
            onDelete={handleDeleteJob}
          />
          <CustomerList
            customers={filteredCustomers}
            onEdit={startEditCustomer}
            onCreateJob={openJobForCustomer}
            onDelete={handleDeleteCustomer}
          />
        </section>
      </section>
    );
  }
  function renderActiveView() {
    if (activeView === "today") {
      return renderTodayPage();
    }
    if (activeView === "customers") {
      return renderCustomersPage();
    }
    if (activeView === "jobs") {
      return renderJobsPage();
    }
    if (activeView === "search") {
      return renderSearchPage();
    }
    return renderOverviewPage();
  }
  if (authLoading) {
    return (
      <main className="loading-shell">
        <p className="message">Oturum kontrol ediliyor...</p>
      </main>
    );
  }
  if (!authUser) {
    return <AuthScreen onAuthSuccess={setAuthUser} />;
  }
  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>Servis Defteri</strong>
            <small>Talep takibi</small>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Ana menü">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-link ${activeView === item.id ? "is-active" : ""}`}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => openView(item.id)}
            >
              <span className="sidebar-link-main">{item.label}</span>
              <small>{item.meta}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-account">
          <InstallAppButton />
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </aside>
      <section className="app-content">
        <header className="mobile-app-header">
          <div>
            <span className="mobile-app-kicker">{currentPage.eyebrow}</span>
            <strong>{currentPage.title}</strong>
          </div>
          <InstallAppButton className="mobile-install-button" />
        </header>
        <DashboardHeader eyebrow={currentPage.eyebrow} title={currentPage.title} />
        {message ? <p className="message">{message}</p> : null}
        {loading ? <p className="message">Veriler yükleniyor...</p> : null}
        {renderActiveView()}
      </section>
    </main>
  );
}
export default App;
