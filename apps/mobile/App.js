import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ClipboardList from "lucide-react-native/icons/clipboard-list";
import RefreshCw from "lucide-react-native/icons/refresh-cw";
import SearchIcon from "lucide-react-native/icons/search";
import SettingsIcon from "lucide-react-native/icons/settings";
import Users from "lucide-react-native/icons/users";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { api, CLOUD_API_URL, DEFAULT_API_URL, PREFER_LAN_API } from "./src/api/client";
import { CustomerPortal } from "./src/components/CustomerPortal";
import { JobStatusTrail } from "./src/components/JobStatusTrail";
import { PhotoPicker, PhotoPreviewModal, PhotoStrip, normalizePhotoList } from "./src/components/Photos";
import { Badge, Card, EmptyState, Input, Message, PrimaryButton, SearchInput, SegmentedControl, SmallButton } from "./src/components/ui";
import {
  paymentStatuses,
  paymentStatusLabels,
  priorities,
  priorityLabels,
  productCategories,
  productCategoryLabels,
  statuses,
  statusLabels
} from "./src/constants/options";
import {
  digitsOnly,
  formatCurrency,
  formatDateTime,
  formatPhone,
  isOpenJob,
  isOverdueJob,
  isSameLocalDay,
  normalizeSearch,
  parseAppointment,
  stripDigits
} from "./src/utils/format";

const TOKEN_KEY = "servis_defteri_mobile_token";
const USER_KEY = "servis_defteri_mobile_user";
const API_URL_KEY = "servis_defteri_mobile_api_url";
const CUSTOMERS_CACHE_KEY = "servis_defteri_mobile_customers";
const JOBS_CACHE_KEY = "servis_defteri_mobile_jobs";
const CLOUD_SWITCHING_MESSAGE = "Yerel bağlantı kurulamadı. Bulut sunucusuna geçiliyor...";
const CLOUD_READY_MESSAGE = "Bulut bağlantısı hazır. İşlemi yeniden deneyebilirsin.";

const initialRequestForm = {
  name: "",
  phone: "",
  address: "",
  productCategory: "heating",
  productBrand: "",
  productModel: "",
  description: "",
  photos: []
};

const initialTrackingForm = {
  requestCode: "",
  phone: ""
};

const initialAuthForm = {
  name: "",
  email: "",
  password: ""
};

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
  appointmentAt: "",
  photos: []
};

function parseStoredJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeJobsForCache(items) {
  return JSON.stringify(
    items.slice(0, 100).map((job) => ({
      ...job,
      photos: []
    }))
  );
}

function getPaidAmount(job) {
  const price = Number(job.price || 0);

  if (job.paymentStatus === "paid") {
    return price;
  }

  if (job.paymentStatus === "partial") {
    return Math.min(Number(job.paidAmount || 0), price);
  }

  return 0;
}

function sortByAppointment(items) {
  return [...items].sort((first, second) => {
    const firstTime = first.appointmentAt ? new Date(first.appointmentAt).getTime() : Number.MAX_SAFE_INTEGER;
    const secondTime = second.appointmentAt ? new Date(second.appointmentAt).getTime() : Number.MAX_SAFE_INTEGER;

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  });
}

function matchesSearch(fields, query) {
  const normalizedQuery = normalizeSearch(query).trim();

  if (!normalizedQuery) {
    return true;
  }

  return fields.some((field) => normalizeSearch(field).includes(normalizedQuery));
}

function getJobSearchFields(job) {
  return [
    job.title,
    job.description,
    job.requestCode,
    job.productCategory,
    productCategoryLabels[job.productCategory],
    job.productBrand,
    job.productModel,
    statusLabels[job.status],
    paymentStatusLabels[job.paymentStatus],
    priorityLabels[job.priority],
    job.customer?.name,
    job.customer?.phone,
    job.customer?.address,
    job.customer?.note
  ];
}

function normalizeApiUrlInput(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : "http://" + trimmed;
}

function isLocalApiUrl(value) {
  return /\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:|\/|$)/i.test(String(value || ""));
}

function isPrivateNetworkApiUrl(value) {
  return /\/\/(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2})(?::|\/|$)/i.test(
    String(value || "")
  );
}

function getHealthTimeout(apiUrl) {
  return isPrivateNetworkApiUrl(apiUrl) ? 8000 : 75000;
}

function isConnectionError(error) {
  const message = String(error?.message || "");
  return message === "REQUEST_TIMEOUT" || message.startsWith("NETWORK_ERROR") || message.includes("Network request failed");
}

function getExpoLanApiUrl() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL || "";
  const match = scriptUrl.match(/\/\/([^/:]+):/);
  const host = match?.[1];
  const candidate = host ? "http://" + host + ":4000" : "";

  return isPrivateNetworkApiUrl(candidate) ? candidate : "";
}

function getSuggestedMobileApiUrl() {
  const configuredUrl = normalizeApiUrlInput(DEFAULT_API_URL);
  const expoLanUrl = getExpoLanApiUrl();

  if (
    __DEV__ &&
    expoLanUrl &&
    (PREFER_LAN_API || isLocalApiUrl(configuredUrl) || isPrivateNetworkApiUrl(configuredUrl))
  ) {
    return expoLanUrl;
  }

  if (configuredUrl && !isLocalApiUrl(configuredUrl)) {
    return configuredUrl;
  }

  return expoLanUrl;
}

function getDefaultMobileApiUrl() {
  const configuredUrl = normalizeApiUrlInput(DEFAULT_API_URL);
  return getSuggestedMobileApiUrl() || configuredUrl || "http://localhost:4000";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function formatAppointmentInput(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join("-") + " " + [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(":");
}

function getRoundedFutureAppointment(minutesFromNow = 60) {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const remainder = date.getMinutes() % 30;

  if (remainder > 0) {
    date.setMinutes(date.getMinutes() + (30 - remainder));
  }

  date.setSeconds(0, 0);
  return formatAppointmentInput(date);
}

function getFixedFutureAppointment(daysFromToday, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, minute, 0, 0);

  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }

  return formatAppointmentInput(date);
}

function isPastAppointmentValue(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const currentMinute = new Date();
  currentMinute.setSeconds(0, 0);
  return date < currentMinute;
}

function getPortalRequestValidationError(form) {
  const name = stripDigits(form.name).trim();
  const phone = digitsOnly(form.phone);
  const description = String(form.description || "").trim();

  if (name.length < 2) {
    return "Hata: Ad soyad en az 2 harf olmalı.";
  }

  if (phone.length < 10) {
    return "Hata: Telefon en az 10 rakam olmalı.";
  }

  if (description.length < 5) {
    return "Hata: Arızayı birkaç kelimeyle anlat.";
  }

  return "";
}

function getTrackingValidationError(form) {
  const requestCode = String(form.requestCode || "").trim();
  const phone = digitsOnly(form.phone);

  if (!requestCode) {
    return "Hata: Takip kodu gerekli.";
  }

  if (phone.length < 10) {
    return "Hata: Telefon en az 10 rakam olmalı.";
  }

  return "";
}

function normalizeWhatsAppPhone(phone) {
  let digits = digitsOnly(phone);

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return "90" + digits.slice(1);
  }

  if (digits.length === 10) {
    return "90" + digits;
  }

  return digits;
}

async function openUrl(url, fallbackMessage) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Açılamadı", fallbackMessage);
  }
}

function callPhone(phone) {
  const digits = digitsOnly(phone);

  if (!digits) {
    Alert.alert("Telefon yok", "Bu müşteri için telefon numarası girilmemiş.");
    return;
  }

  openUrl("tel:" + digits, "Telefon uygulaması açılamadı.");
}

function openWhatsApp(phone) {
  const digits = normalizeWhatsAppPhone(phone);

  if (!digits) {
    Alert.alert("Telefon yok", "WhatsApp için telefon numarası girilmemiş.");
    return;
  }

  openUrl("https://wa.me/" + digits, "WhatsApp açılamadı.");
}

function openAddress(address) {
  const query = String(address || "").trim();

  if (!query) {
    Alert.alert("Adres yok", "Bu müşteri için adres girilmemiş.");
    return;
  }

  openUrl(
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query),
    "Harita açılamadı."
  );
}


async function shareRequestCode(item) {
  const requestCode = item?.requestCode;

  if (!requestCode) {
    Alert.alert("Takip kodu yok", "Bu talep için takip kodu oluşmamış.");
    return;
  }

  const status = statusLabels[item.status] || item.status || "Beklemede";
  const customerPhone = item.customer?.phone ? "\nTelefon: " + item.customer.phone : "";
  const message = "Servis Defteri takip kodu: " + requestCode + "\nDurum: " + status + customerPhone;

  try {
    await Share.share({ message });
  } catch {
    Alert.alert("Paylaşılamadı", "Takip kodu paylaşımı açılamadı.");
  }
}


function App() {
  const [apiUrl, setApiUrl] = useState(getDefaultMobileApiUrl);
  const [apiUrlDraft, setApiUrlDraft] = useState(getDefaultMobileApiUrl);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [entryMode, setEntryMode] = useState("customer");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [trackingForm, setTrackingForm] = useState(initialTrackingForm);
  const [portalResult, setPortalResult] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [customerView, setCustomerView] = useState("list");
  const [jobView, setJobView] = useState("list");
  const [boardFilter, setBoardFilter] = useState("today");
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
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [connectionState, setConnectionState] = useState("idle");
  const [connectionRetrying, setConnectionRetrying] = useState(false);

  function markConnectionOffline(error) {
    if (isConnectionError(error)) {
      setConnectionState("offline");
    }
  }

  async function switchToCloudFallback() {
    const fallbackUrl = normalizeApiUrlInput(CLOUD_API_URL);
    const currentIsLocal = isLocalApiUrl(apiUrl) || isPrivateNetworkApiUrl(apiUrl);

    if (!currentIsLocal || !fallbackUrl || apiUrl === fallbackUrl) {
      return false;
    }

    try {
      await AsyncStorage.setItem(API_URL_KEY, fallbackUrl);
      await clearCachedData();
    } catch {
      // Runtime state can still recover even if local cache storage is unavailable.
    }

    setApiUrl(fallbackUrl);
    setApiUrlDraft(fallbackUrl);
    setShowServerSettings(false);
    setConnectionState("checking");
    setMessage(CLOUD_SWITCHING_MESSAGE);
    return true;
  }

  useEffect(() => {
    async function boot() {
      try {
        const [storedApiUrl, storedToken, storedUser, storedCustomers, storedJobs] = await Promise.all([
          AsyncStorage.getItem(API_URL_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(CUSTOMERS_CACHE_KEY),
          AsyncStorage.getItem(JOBS_CACHE_KEY)
        ]);
        const detectedApiUrl = getDefaultMobileApiUrl();
        const normalizedStoredApiUrl = normalizeApiUrlInput(storedApiUrl);
        const storedIsDevelopmentAddress =
          isLocalApiUrl(normalizedStoredApiUrl) || isPrivateNetworkApiUrl(normalizedStoredApiUrl);
        const shouldRefreshConfiguredApi =
          detectedApiUrl &&
          normalizedStoredApiUrl !== detectedApiUrl &&
          (__DEV__ || storedIsDevelopmentAddress);
        const shouldUseDetected =
          !normalizedStoredApiUrl || isLocalApiUrl(normalizedStoredApiUrl) || shouldRefreshConfiguredApi;
        const nextApiUrl = shouldUseDetected ? detectedApiUrl : normalizedStoredApiUrl;
        const apiUrlChanged = Boolean(normalizedStoredApiUrl && normalizedStoredApiUrl !== nextApiUrl);
        setApiUrl(nextApiUrl);
        setApiUrlDraft(nextApiUrl);

        if (!normalizedStoredApiUrl || apiUrlChanged) {
          await AsyncStorage.setItem(API_URL_KEY, nextApiUrl);
        }

        if (apiUrlChanged) {
          await AsyncStorage.multiRemove([CUSTOMERS_CACHE_KEY, JOBS_CACHE_KEY]);
        }

        if (storedToken) {
          const cachedUser = parseStoredJson(storedUser, null);

          if (cachedUser) {
            const cachedCustomers = apiUrlChanged ? [] : parseStoredJson(storedCustomers, []);
            const cachedJobs = apiUrlChanged ? [] : parseStoredJson(storedJobs, []);
            setToken(storedToken);
            setUser(cachedUser);
            setCustomers(Array.isArray(cachedCustomers) ? cachedCustomers : []);
            setJobs(Array.isArray(cachedJobs) ? cachedJobs : []);
          } else {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, CUSTOMERS_CACHE_KEY, JOBS_CACHE_KEY]);
          }
        }
      } finally {
        setBooting(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    if (booting || token) {
      return undefined;
    }

    let cancelled = false;
    setConnectionState("checking");

    api.health(apiUrl, getHealthTimeout(apiUrl))
      .then(() => {
        if (!cancelled) {
          setConnectionState("ready");
          setMessage((current) =>
            current === CLOUD_SWITCHING_MESSAGE ? CLOUD_READY_MESSAGE : current
          );
        }
      })
      .catch(async () => {
        if (cancelled) {
          return;
        }

        const switchedToCloud = await switchToCloudFallback();
        if (!switchedToCloud && !cancelled) {
          setConnectionState("offline");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, booting, token]);

  useEffect(() => {
    if (!booting && token) {
      loadData();
    }
  }, [token, apiUrl, booting]);

  useEffect(() => {
    if (!booting && token) {
      AsyncStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(customers.slice(0, 250))).catch(() => {});
    }
  }, [booting, token, customers]);

  useEffect(() => {
    if (!booting && token) {
      AsyncStorage.setItem(JOBS_CACHE_KEY, serializeJobsForCache(jobs)).catch(() => {});
    }
  }, [booting, token, jobs]);

  const openJobs = useMemo(() => jobs.filter(isOpenJob), [jobs]);
  const todayJobs = useMemo(
    () => sortByAppointment(openJobs.filter((job) => isSameLocalDay(job.appointmentAt))),
    [openJobs]
  );
  const overdueJobs = useMemo(
    () => sortByAppointment(openJobs.filter(isOverdueJob)),
    [openJobs]
  );
  const urgentJobs = useMemo(
    () => sortByAppointment(openJobs.filter((job) => job.priority === "urgent" || job.priority === "high")),
    [openJobs]
  );
  const paymentJobs = useMemo(
    () => sortByAppointment(jobs.filter((job) => job.paymentStatus !== "paid" && Number(job.price || 0) > 0)),
    [jobs]
  );
  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed").slice(0, 20),
    [jobs]
  );
  const totalRevenue = useMemo(
    () => jobs.reduce((total, job) => total + getPaidAmount(job), 0),
    [jobs]
  );
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      matchesSearch([customer.name, customer.phone, customer.address, customer.note], customerSearch)
    );
  }, [customers, customerSearch]);
  const jobListResults = useMemo(
    () => jobs.filter((job) => matchesSearch(getJobSearchFields(job), jobSearch)),
    [jobs, jobSearch]
  );
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesJob = matchesSearch(getJobSearchFields(job), jobSearch);
      const matchesCustomer = matchesSearch(
        [job.customer?.name, job.customer?.phone, job.customer?.address, job.customer?.note],
        customerSearch
      );
      const matchesStatus = jobStatusFilter === "all" || job.status === jobStatusFilter;
      const matchesPayment = paymentStatusFilter === "all" || job.paymentStatus === paymentStatusFilter;
      return matchesJob && matchesCustomer && matchesStatus && matchesPayment;
    });
  }, [jobs, jobSearch, customerSearch, jobStatusFilter, paymentStatusFilter]);

  async function clearCachedData() {
    await AsyncStorage.multiRemove([CUSTOMERS_CACHE_KEY, JOBS_CACHE_KEY]);
    setCustomers([]);
    setJobs([]);
  }

  async function clearSession() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, CUSTOMERS_CACHE_KEY, JOBS_CACHE_KEY]);
    setToken(null);
    setUser(null);
    setCustomers([]);
    setJobs([]);
  }

  async function handleApiError(error) {
    if (error?.status === 401 && token) {
      await clearSession();
      setMessage("Oturum süresi doldu. Lütfen yeniden giriş yap.");
      return;
    }

    if (isConnectionError(error)) {
      const switchedToCloud = await switchToCloudFallback();

      if (!switchedToCloud) {
        setMessage("");
        markConnectionOffline(error);
      }
      return;
    }

    setMessage("Hata: " + translateError(error.message));
  }

  async function saveApiUrl() {
    const nextApiUrl = normalizeApiUrlInput(apiUrlDraft);

    if (!nextApiUrl) {
      setMessage("Sunucu adresi boş olamaz.");
      return;
    }

    await AsyncStorage.setItem(API_URL_KEY, nextApiUrl);
    if (nextApiUrl !== apiUrl) {
      await clearCachedData();
      setConnectionState("checking");
    }
    setApiUrl(nextApiUrl);
    setApiUrlDraft(nextApiUrl);
    setMessage("Sunucu adresi kaydedildi.");
    setShowServerSettings(false);
  }

  async function retryApiConnection() {
    if (connectionRetrying) {
      return;
    }

    try {
      setConnectionRetrying(true);
      setMessage("");
      await api.health(apiUrl, getHealthTimeout(apiUrl));
      setConnectionState("ready");

      if (token) {
        await loadData();
      }
    } catch {
      setConnectionState("offline");
    } finally {
      setConnectionRetrying(false);
    }
  }

  async function testApiConnection(candidateUrl = apiUrlDraft) {
    const nextApiUrl = normalizeApiUrlInput(candidateUrl);

    if (!nextApiUrl) {
      setMessage("Sunucu adresi boş olamaz.");
      return;
    }

    try {
      setLoading(true);
      setConnectionState("checking");
      await api.health(nextApiUrl, getHealthTimeout(nextApiUrl));
      await AsyncStorage.setItem(API_URL_KEY, nextApiUrl);
      if (nextApiUrl !== apiUrl) {
        await clearCachedData();
      }
      setApiUrl(nextApiUrl);
      setApiUrlDraft(nextApiUrl);
      setMessage("Sunucu bağlantısı hazır: " + nextApiUrl);
      setConnectionState("ready");
      setShowServerSettings(false);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const [customerResponse, jobResponse] = await Promise.all([
        api.getCustomers(apiUrl, token),
        api.getJobs(apiUrl, token)
      ]);
      setCustomers(customerResponse.data || []);
      setJobs(jobResponse.data || []);
      setConnectionState("ready");
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSession(response) {
    const nextToken = response.data.token;
    const nextUser = response.data.user;
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setConnectionState("ready");
    setMessage("");
  }

  async function submitAuth() {
    try {
      setLoading(true);
      const response =
        authMode === "register"
          ? await api.register(apiUrl, authForm)
          : await api.login(apiUrl, {
              email: authForm.email,
              password: authForm.password
            });
      await saveSession(response);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  async function createPortalRequest() {
    const validationError = getPortalRequestValidationError(requestForm);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const cleanForm = {
      ...requestForm,
      name: stripDigits(requestForm.name).trim(),
      phone: digitsOnly(requestForm.phone),
      description: String(requestForm.description || "").trim(),
      photos: normalizePhotoList(requestForm.photos)
    };

    try {
      setPortalBusy(true);
      setMessage("");
      const response = await api.createPublicRequest(apiUrl, cleanForm);
      setConnectionState("ready");
      setPortalResult(response.data);
      setTrackingForm({
        requestCode: response.data.requestCode,
        phone: cleanForm.phone
      });
      setRequestForm(initialRequestForm);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setPortalBusy(false);
    }
  }

  async function trackPortalRequest() {
    const validationError = getTrackingValidationError(trackingForm);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const requestCode = String(trackingForm.requestCode || "").trim().toUpperCase();
    const phone = digitsOnly(trackingForm.phone);

    try {
      setPortalBusy(true);
      setMessage("");
      const response = await api.getPublicRequest(apiUrl, requestCode, phone);
      setConnectionState("ready");
      setTrackingForm({ requestCode, phone });
      setPortalResult(response.data);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setPortalBusy(false);
    }
  }

  function upsertCustomer(customer) {
    setCustomers((current) => {
      const exists = current.some((item) => item.id === customer.id);
      return exists ? current.map((item) => (item.id === customer.id ? customer : item)) : [customer, ...current];
    });
    setJobs((current) =>
      current.map((job) => (job.customerId === customer.id ? { ...job, customer } : job))
    );
  }

  function upsertJob(job) {
    const customer = job.customer || customers.find((item) => item.id === job.customerId);
    const nextJob = customer ? { ...job, customer } : job;
    setJobs((current) => {
      const exists = current.some((item) => item.id === nextJob.id);
      return exists ? current.map((item) => (item.id === nextJob.id ? nextJob : item)) : [nextJob, ...current];
    });
  }

  function startNewCustomer() {
    setCustomerForm(initialCustomerForm);
    setEditingCustomerId(null);
    setCustomerView("form");
    setActiveTab("customers");
    setMessage("");
  }

  async function saveCustomer() {
    try {
      const payload = {
        ...customerForm,
        name: stripDigits(customerForm.name).trim(),
        phone: digitsOnly(customerForm.phone),
        address: String(customerForm.address || "").trim(),
        note: String(customerForm.note || "").trim()
      };

      if (payload.name.length < 2) {
        setMessage("Hata: Müşteri adı en az 2 karakter olmalı.");
        return;
      }

      setLoading(true);
      const response = editingCustomerId
        ? await api.updateCustomer(apiUrl, token, editingCustomerId, payload)
        : await api.createCustomer(apiUrl, token, payload);
      upsertCustomer(response.data);
      setCustomerForm(initialCustomerForm);
      setEditingCustomerId(null);
      setCustomerView("list");
      setMessage(editingCustomerId ? "Müşteri güncellendi." : "Müşteri eklendi.");
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  function editCustomer(customer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      note: customer.note || ""
    });
    setCustomerView("form");
    setActiveTab("customers");
    setMessage("");
  }

  async function confirmDeleteCustomer(customer) {
    Alert.alert("Müşteri silinsin mi?", customer.name + " ve bağlı talepleri silinir.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteCustomer(apiUrl, token, customer.id);
            setCustomers((current) => current.filter((item) => item.id !== customer.id));
            setJobs((current) => current.filter((job) => job.customerId !== customer.id));
          } catch (error) {
            await handleApiError(error);
          }
        }
      }
    ]);
  }

  function startJobForCustomer(customer) {
    setJobForm({
      ...initialJobForm,
      customerId: customer.id
    });
    setEditingJobId(null);
    setJobView("form");
    setActiveTab("jobs");
    setMessage(customer.name + " için talep açılıyor.");
  }

  function editJob(job) {
    const appointment = job.appointmentAt ? new Date(job.appointmentAt).toISOString().slice(0, 16).replace("T", " ") : "";
    setEditingJobId(job.id);
    setJobForm({
      customerId: job.customerId || "",
      title: job.title || "",
      description: job.description || "",
      productCategory: job.productCategory || "other",
      productBrand: job.productBrand || "",
      productModel: job.productModel || "",
      price: String(job.price || ""),
      paidAmount: String(job.paidAmount || ""),
      status: job.status || "pending",
      priority: job.priority || "normal",
      paymentStatus: job.paymentStatus || "unpaid",
      appointmentAt: appointment,
      photos: normalizePhotoList(job.photos)
    });
    setJobView("form");
    setActiveTab("jobs");
    setMessage("");
  }

  async function saveJob() {
    try {
      const title = String(jobForm.title || "").trim();
      const price = Number(jobForm.price || 0);
      let paidAmount = Number(jobForm.paidAmount || 0);

      if (!jobForm.customerId) {
        setMessage("Hata: Bir müşteri seçmelisin.");
        return;
      }

      if (title.length < 2) {
        setMessage("Hata: Talep başlığı en az 2 karakter olmalı.");
        return;
      }

      if (jobForm.paymentStatus === "unpaid") {
        paidAmount = 0;
      }

      if (jobForm.paymentStatus === "paid") {
        paidAmount = price;
      }

      if (jobForm.paymentStatus === "partial" && (paidAmount <= 0 || paidAmount >= price)) {
        setMessage("Hata: Kısmi ödeme 0'dan büyük ve toplam ücretten küçük olmalı.");
        return;
      }

      const appointmentAt = parseAppointment(jobForm.appointmentAt);

      if (isPastAppointmentValue(appointmentAt)) {
        setMessage("Hata: Geçmiş tarihli randevu eklenemez.");
        return;
      }

      const payload = {
        ...jobForm,
        title,
        price,
        paidAmount,
        appointmentAt
      };
      setLoading(true);
      const response = editingJobId
        ? await api.updateJob(apiUrl, token, editingJobId, payload)
        : await api.createJob(apiUrl, token, payload);
      upsertJob(response.data);
      setJobForm(initialJobForm);
      setEditingJobId(null);
      setJobView("list");
      setMessage(editingJobId ? "Talep güncellendi." : "Talep eklendi.");
    } catch (error) {
      await handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  async function markJobInProgress(job) {
    try {
      const response = await api.updateJob(apiUrl, token, job.id, { status: "in_progress" });
      upsertJob(response.data);
      setMessage("Talep incelemeye alındı.");
    } catch (error) {
      await handleApiError(error);
    }
  }

  async function markJobCompleted(job) {
    try {
      const response = await api.updateJob(apiUrl, token, job.id, { status: "completed" });
      upsertJob(response.data);
      setMessage("Talep tamamlandı.");
    } catch (error) {
      await handleApiError(error);
    }
  }

  async function markJobCancelled(job) {
    try {
      const response = await api.updateJob(apiUrl, token, job.id, { status: "cancelled" });
      upsertJob(response.data);
      setMessage("Talep iptal edildi.");
    } catch (error) {
      await handleApiError(error);
    }
  }

  async function markJobPaid(job) {
    try {
      const response = await api.updateJob(apiUrl, token, job.id, {
        paymentStatus: "paid",
        paidAmount: Number(job.price || 0)
      });
      upsertJob(response.data);
    } catch (error) {
      await handleApiError(error);
    }
  }

  async function confirmDeleteJob(job) {
    Alert.alert("Talep silinsin mi?", job.title, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteJob(apiUrl, token, job.id);
            setJobs((current) => current.filter((item) => item.id !== job.id));
          } catch (error) {
            await handleApiError(error);
          }
        }
      }
    ]);
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.loadingShell}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator color="#0f766e" size="large" />
        <Text style={styles.loadingText}>Servis Defteri açılıyor...</Text>
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
            <HeaderBlock
              eyebrow="Servis Defteri"
              title={entryMode === "customer" ? "Talep ve takip" : "Usta girişi"}
              subtitle={
                entryMode === "customer"
                  ? "Servis talebini oluştur, takip kodunla son durumunu gör."
                  : "Müşteri taleplerini, randevuları ve ödemeleri yönet."
              }
            />
            <SegmentedControl
              items={[
                { value: "customer", label: "Müşteri" },
                { value: "technician", label: "Usta" }
              ]}
              value={entryMode}
              onChange={setEntryMode}
            />
            {message ? <Message text={message} /> : null}
            {connectionState === "offline" ? (
              <ConnectionNotice
                isLocalNetwork={__DEV__ && isPrivateNetworkApiUrl(apiUrl)}
                retrying={connectionRetrying}
                onRetry={retryApiConnection}
                onSettings={__DEV__ ? () => setShowServerSettings((current) => !current) : null}
              />
            ) : null}
            {__DEV__ && showServerSettings ? (
              <ServerCard
                apiUrlDraft={apiUrlDraft}
                setApiUrlDraft={setApiUrlDraft}
                onSave={saveApiUrl}
                onTest={testApiConnection}
                detectedApiUrl={getSuggestedMobileApiUrl()}
              />
            ) : null}
            {entryMode === "customer" ? (
              <CustomerPortal
                requestForm={requestForm}
                setRequestForm={setRequestForm}
                trackingForm={trackingForm}
                setTrackingForm={setTrackingForm}
                result={portalResult}
                busy={portalBusy}
                onCreate={createPortalRequest}
                onTrack={trackPortalRequest}
                onOpenPhoto={setPreviewPhoto}
                onShare={shareRequestCode}
              />
            ) : (
              <AuthPanel
                authMode={authMode}
                setAuthMode={setAuthMode}
                form={authForm}
                setForm={setAuthForm}
                busy={loading}
                onSubmit={submitAuth}
              />
            )}
          </ScrollView>
          <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={styles.appShell}>
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appEyebrow}>Servis Defteri</Text>
            <Text style={styles.appTitle}>{getActiveTitle(activeTab)}</Text>
          </View>
          <Pressable
            style={[styles.headerButton, loading && styles.headerButtonDisabled]}
            onPress={loadData}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Verileri yenile"
          >
            <RefreshCw size={20} color="#ffffff" strokeWidth={2.4} />
          </Pressable>
        </View>
        {message ? <Message text={message} compact /> : null}
        {connectionState === "offline" ? (
          <View style={styles.connectionBanner}>
            <ConnectionNotice
              isLocalNetwork={__DEV__ && isPrivateNetworkApiUrl(apiUrl)}
              retrying={connectionRetrying}
              onRetry={retryApiConnection}
              onSettings={
                __DEV__
                  ? () => {
                      setShowServerSettings(true);
                      setActiveTab("settings");
                    }
                  : null
              }
            />
          </View>
        ) : null}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#0f766e" />}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === "today" ? renderToday() : null}
          {activeTab === "customers" ? renderCustomers() : null}
          {activeTab === "jobs" ? renderJobs() : null}
          {activeTab === "search" ? renderSearch() : null}
          {activeTab === "settings" ? renderSettings() : null}
        </ScrollView>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </View>
      <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </SafeAreaView>
  );

  function renderToday() {
    const boardItems = [
      { value: "today", label: "Bugün", count: todayJobs.length },
      { value: "open", label: "Açık", count: openJobs.length },
      { value: "urgent", label: "Acil", count: urgentJobs.length },
      { value: "payment", label: "Ödeme", count: paymentJobs.length },
      { value: "completed", label: "Biten", count: completedJobs.length }
    ];
    const boardJobs =
      boardFilter === "open"
        ? sortByAppointment(openJobs)
        : boardFilter === "urgent"
          ? urgentJobs
          : boardFilter === "payment"
            ? paymentJobs
            : boardFilter === "completed"
              ? completedJobs
              : todayJobs;

    return (
      <View style={styles.stack}>
        <StatsStrip
          customers={customers.length}
          jobs={jobs.length}
          open={openJobs.length}
          revenue={totalRevenue}
        />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>İş Panosu</Text>
            <Text style={styles.muted}>{overdueJobs.length} geciken</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {boardItems.map((item) => (
              <Pressable
                key={item.value}
                style={[styles.boardChip, boardFilter === item.value && styles.boardChipActive]}
                onPress={() => setBoardFilter(item.value)}
              >
                <Text style={[styles.boardChipText, boardFilter === item.value && styles.boardChipTextActive]}>
                  {item.label}
                </Text>
                <Text style={[styles.boardChipCount, boardFilter === item.value && styles.boardChipTextActive]}>
                  {item.count}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card>
        <JobList
          jobs={boardJobs}
          emptyText="Bu bölümde takip edilecek talep yok."
          onEdit={editJob}
          onStart={markJobInProgress}
          onComplete={markJobCompleted}
          onCancel={markJobCancelled}
          onPaid={markJobPaid}
          onDelete={confirmDeleteJob}
          onOpenPhoto={setPreviewPhoto}
        />
      </View>
    );
  }

  function renderCustomers() {
    return (
      <View style={styles.stack}>
        <SegmentedControl
          items={[
            { value: "list", label: "Müşteriler" },
            { value: "form", label: customerView === "form" && editingCustomerId ? "Düzenle" : "Yeni Müşteri" }
          ]}
          value={customerView}
          onChange={(value) => {
            if (value === customerView) {
              return;
            }

            if (value === "form") {
              startNewCustomer();
              return;
            }

            setCustomerView(value);
          }}
        />
        {customerView === "form" ? (
          <CustomerForm
            form={customerForm}
            setForm={setCustomerForm}
            editing={Boolean(editingCustomerId)}
            busy={loading}
            onSubmit={saveCustomer}
            onReset={() => {
              setCustomerForm(initialCustomerForm);
              setEditingCustomerId(null);
              setCustomerView("list");
            }}
          />
        ) : (
          <View style={styles.stack}>
            <SearchInput value={customerSearch} onChangeText={setCustomerSearch} placeholder="Müşteri ara" />
            <CustomerList
              customers={filteredCustomers}
              onJob={startJobForCustomer}
              onEdit={editCustomer}
              onDelete={confirmDeleteCustomer}
            />
          </View>
        )}
      </View>
    );
  }

  function renderJobs() {
    return (
      <View style={styles.stack}>
        <SegmentedControl
          items={[
            { value: "list", label: "Talepler" },
            { value: "form", label: jobView === "form" && editingJobId ? "Düzenle" : "Yeni Talep" }
          ]}
          value={jobView}
          onChange={(value) => {
            if (value === jobView) {
              return;
            }

            if (value === "form") {
              setJobForm(initialJobForm);
              setEditingJobId(null);
              setMessage("");
            }

            setJobView(value);
          }}
        />
        {jobView === "form" ? (
          <JobForm
            form={jobForm}
            setForm={setJobForm}
            customers={customers}
            editing={Boolean(editingJobId)}
            busy={loading}
            onSubmit={saveJob}
            onAddCustomer={startNewCustomer}
            onReset={() => {
              setJobForm(initialJobForm);
              setEditingJobId(null);
              setJobView("list");
            }}
          />
        ) : (
          <View style={styles.stack}>
            <SearchInput value={jobSearch} onChangeText={setJobSearch} placeholder="Kod, müşteri, ürün veya arıza ara" />
            <JobList
              jobs={jobListResults}
              emptyText={jobSearch.trim() ? "Aramana uygun talep bulunamadı." : "Henüz talep yok."}
              onEdit={editJob}
              onStart={markJobInProgress}
              onComplete={markJobCompleted}
              onCancel={markJobCancelled}
              onPaid={markJobPaid}
              onDelete={confirmDeleteJob}
              onOpenPhoto={setPreviewPhoto}
            />
          </View>
        )}
      </View>
    );
  }

  function renderSearch() {
    return (
      <View style={styles.stack}>
        <Card>
          <Text style={styles.cardTitle}>Arama ve filtre</Text>
          <Input label="Müşteri" value={customerSearch} onChangeText={setCustomerSearch} placeholder="Ad, telefon, adres" />
          <Input label="Talep" value={jobSearch} onChangeText={setJobSearch} placeholder="Kod, ürün, arıza" />
          <Text style={styles.label}>Durum</Text>
          <SegmentedControl
            items={[{ value: "all", label: "Tümü" }, ...statuses]}
            value={jobStatusFilter}
            onChange={setJobStatusFilter}
          />
          <Text style={styles.label}>Ödeme</Text>
          <SegmentedControl
            items={[{ value: "all", label: "Tümü" }, ...paymentStatuses]}
            value={paymentStatusFilter}
            onChange={setPaymentStatusFilter}
          />
        </Card>
        <JobList
          jobs={filteredJobs}
          emptyText="Aramaya uygun talep yok."
          onEdit={editJob}
          onStart={markJobInProgress}
          onComplete={markJobCompleted}
          onCancel={markJobCancelled}
          onPaid={markJobPaid}
          onDelete={confirmDeleteJob}
          onOpenPhoto={setPreviewPhoto}
        />
        <CustomerList
          customers={filteredCustomers}
          onJob={startJobForCustomer}
          onEdit={editCustomer}
          onDelete={confirmDeleteCustomer}
        />
      </View>
    );
  }

  function renderSettings() {
    return (
      <View style={styles.stack}>
        <Card>
          <Text style={styles.cardTitle}>Hesap</Text>
          <Text style={styles.bodyText}>{user?.name || "Usta"}</Text>
          <Text style={styles.muted}>{user?.email}</Text>
        </Card>
        {__DEV__ ? (
          <View style={styles.stack}>
            <Pressable
              style={styles.developerToggle}
              onPress={() => setShowServerSettings((current) => !current)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showServerSettings }}
            >
              <Text style={styles.developerToggleText}>Geliştirici bağlantısı</Text>
              <Text style={styles.developerToggleText}>{showServerSettings ? "Kapat" : "Aç"}</Text>
            </Pressable>
            {showServerSettings ? (
              <ServerCard
                apiUrlDraft={apiUrlDraft}
                setApiUrlDraft={setApiUrlDraft}
                onSave={saveApiUrl}
                onTest={testApiConnection}
                detectedApiUrl={getSuggestedMobileApiUrl()}
              />
            ) : null}
          </View>
        ) : null}
        <Pressable style={styles.dangerAction} onPress={clearSession}>
          <Text style={styles.dangerActionText}>Çıkış Yap</Text>
        </Pressable>
      </View>
    );
  }
}

function translateError(message) {
  const text = String(message || "");

  if (text === "REQUEST_TIMEOUT") {
    return "Sunucu zamanında yanıt vermedi. Bağlantıyı kontrol edip tekrar dene.";
  }

  if (text.startsWith("NETWORK_ERROR") || text.includes("Network request failed")) {
    return "Sunucuya bağlanılamadı. İnternet bağlantını kontrol et. Yerel geliştirmede telefon ve bilgisayar aynı Wi-Fi'da olmalı.";
  }

  const map = {
    "Email is already registered.": "Bu e-posta zaten kayıtlı.",
    "Invalid email or password.": "E-posta veya şifre hatalı.",
    "Password must be at least 6 characters.": "Şifre en az 6 karakter olmalı.",
    "Name cannot contain numbers.": "Ad soyad alanında rakam kullanma.",
    "Customer name cannot contain numbers.": "Müşteri adında rakam kullanma.",
    "Phone must contain digits only.": "Telefon sadece rakam olmalı.",
    "appointmentAt cannot be in the past.": "Geçmiş tarihli randevu eklenemez."
  };
  return map[message] || message;
}

function getActiveTitle(activeTab) {
  const titles = {
    today: "Bugünün İşleri",
    customers: "Müşteriler",
    jobs: "Talepler",
    search: "Talep Ara",
    settings: "Ayarlar"
  };
  return titles[activeTab] || "Servis Defteri";
}

function HeaderBlock({ eyebrow, title, subtitle }) {
  return (
    <View style={styles.heroBlock}>
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ConnectionNotice({ isLocalNetwork, retrying = false, onRetry, onSettings }) {
  return (
    <View style={styles.connectionNotice}>
      <Text style={styles.connectionNoticeTitle}>Bağlantı kurulamadı</Text>
      <Text style={styles.connectionNoticeText}>
        {isLocalNetwork
          ? "Telefon ve bilgisayar aynı Wi-Fi ağında olmalı. Bilgisayardaki API penceresini açık bırak."
          : "İnternet bağlantısını kontrol edip yeniden dene."}
      </Text>
      <View style={styles.actionRow}>
        <SmallButton title={retrying ? "Bağlanıyor..." : "Tekrar Dene"} onPress={onRetry} disabled={retrying} />
        {onSettings ? <SmallButton title="Geliştirici Ayarı" onPress={onSettings} /> : null}
      </View>
    </View>
  );
}

function ServerCard({ apiUrlDraft, setApiUrlDraft, onSave, onTest, detectedApiUrl }) {
  const normalizedDraft = normalizeApiUrlInput(apiUrlDraft);
  const canUseDetected = detectedApiUrl && detectedApiUrl !== normalizedDraft;
  const isLocalDraft = isLocalApiUrl(normalizedDraft);

  return (
    <Card>
      <Text style={styles.cardTitle}>Geliştirici Sunucu Ayarı</Text>
      <Input
        label="API adresi"
        value={apiUrlDraft}
        onChangeText={setApiUrlDraft}
        placeholder="http://192.168.1.25:4000"
        autoCapitalize="none"
      />
      {detectedApiUrl ? <Text style={styles.muted}>Telefon için önerilen: {detectedApiUrl}</Text> : null}
      {isLocalDraft ? (
        <Text style={styles.warningText}>
          Telefonda localhost kullanılamaz. Bilgisayar IP adresini yaz: http://192.168.1.4:4000
        </Text>
      ) : null}
      <View style={styles.actionRow}>
        {canUseDetected ? (
          <Pressable style={styles.smallButton} onPress={() => setApiUrlDraft(detectedApiUrl)}>
            <Text style={styles.smallButtonText}>LAN IP ile Doldur</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.smallButton} onPress={onSave}>
          <Text style={styles.smallButtonText}>Kaydet</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={() => onTest(apiUrlDraft)}>
          <Text style={styles.smallButtonText}>Test Et</Text>
        </Pressable>
      </View>
    </Card>
  );
}


function AuthPanel({ authMode, setAuthMode, form, setForm, busy, onSubmit }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{authMode === "login" ? "Usta Girişi" : "Usta Hesabı Oluştur"}</Text>
      {authMode === "register" ? (
        <Input
          label="Ad Soyad"
          value={form.name}
          onChangeText={(value) => setForm({ ...form, name: stripDigits(value) })}
          placeholder="Ahmet Yılmaz"
        />
      ) : null}
      <Input
        label="E-posta"
        value={form.email}
        onChangeText={(value) => setForm({ ...form, email: value.trim() })}
        placeholder="ornek@mail.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        label="Şifre"
        value={form.password}
        onChangeText={(value) => setForm({ ...form, password: value })}
        placeholder="En az 6 karakter"
        secureTextEntry
      />
      <PrimaryButton
        title={busy ? "Kontrol ediliyor..." : authMode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        onPress={onSubmit}
        disabled={busy}
      />
      <Pressable
        style={styles.secondaryAction}
        onPress={() => setAuthMode(authMode === "login" ? "register" : "login")}
      >
        <Text style={styles.secondaryActionText}>
          {authMode === "login" ? "Usta hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
        </Text>
      </Pressable>
    </Card>
  );
}

function StatsStrip({ customers, jobs, open, revenue }) {
  const items = [
    { label: "Müşteri", value: customers },
    { label: "Talep", value: jobs },
    { label: "Açık", value: open },
    { label: "Tahsilat", value: formatCurrency(revenue) }
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue}>{item.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function CustomerForm({ form, setForm, editing, busy, onSubmit, onReset }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{editing ? "Müşteri Düzenle" : "Müşteri Ekle"}</Text>
      <Input
        label="Ad Soyad"
        value={form.name}
        onChangeText={(value) => setForm({ ...form, name: stripDigits(value) })}
        placeholder="Ahmet Yılmaz"
        autoCapitalize="words"
        textContentType="name"
      />
      <Input
        label="Telefon"
        value={form.phone}
        onChangeText={(value) => setForm({ ...form, phone: digitsOnly(value) })}
        placeholder="05551234567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        maxLength={11}
      />
      <Input
        label="Adres"
        value={form.address}
        onChangeText={(value) => setForm({ ...form, address: value })}
        placeholder="İstanbul"
      />
      <Input
        label="Not"
        value={form.note}
        onChangeText={(value) => setForm({ ...form, note: value })}
        placeholder="Müşteri notu"
        multiline
      />
      <PrimaryButton
        title={busy ? "Kaydediliyor..." : editing ? "Müşteriyi Güncelle" : "Müşteri Kaydet"}
        onPress={onSubmit}
        disabled={busy}
      />
      {editing ? (
        <Pressable style={styles.secondaryAction} onPress={onReset}>
          <Text style={styles.secondaryActionText}>Vazgeç</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function JobForm({ form, setForm, customers, editing, busy, onSubmit, onReset, onAddCustomer }) {
  const [customerQuery, setCustomerQuery] = useState("");
  const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
  const matchingCustomers = customers
    .filter((customer) => matchesSearch([customer.name, customer.phone, customer.address], customerQuery))
    .slice(0, 20);
  const visibleCustomers =
    selectedCustomer && !matchingCustomers.some((customer) => customer.id === selectedCustomer.id)
      ? [selectedCustomer, ...matchingCustomers]
      : matchingCustomers;

  if (customers.length === 0) {
    return (
      <Card>
        <Text style={styles.cardTitle}>Talep Oluştur</Text>
        <Text style={styles.muted}>Talep açmak için önce bir müşteri eklemelisin.</Text>
        <PrimaryButton title="Müşteri Ekle" onPress={onAddCustomer} />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>{editing ? "Talep Düzenle" : "Talep Oluştur"}</Text>
      <SearchInput
        value={customerQuery}
        onChangeText={setCustomerQuery}
        placeholder="Müşteri adı, telefon veya adres"
      />
      <Text style={styles.pickerCount}>{visibleCustomers.length} müşteri</Text>
      {visibleCustomers.length === 0 ? <Text style={styles.muted}>Müşteri bulunamadı.</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {visibleCustomers.map((customer) => (
          <Pressable
            key={customer.id}
            style={[styles.choiceChip, form.customerId === customer.id && styles.choiceChipActive]}
            onPress={() => {
              setForm({ ...form, customerId: customer.id });
              setCustomerQuery(customer.name);
            }}
          >
            <Text style={[styles.choiceChipText, form.customerId === customer.id && styles.choiceChipTextActive]}>
              {customer.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {selectedCustomer ? <Text style={styles.muted}>Seçili: {selectedCustomer.name}</Text> : null}
      <Text style={styles.label}>Ürün</Text>
      <SegmentedControl
        items={productCategories}
        value={form.productCategory}
        onChange={(value) => setForm({ ...form, productCategory: value })}
      />
      <View style={styles.twoColumn}>
        <Input
          label="Marka"
          value={form.productBrand}
          onChangeText={(value) => setForm({ ...form, productBrand: value })}
          placeholder="Arçelik"
        />
        <Input
          label="Model"
          value={form.productModel}
          onChangeText={(value) => setForm({ ...form, productModel: value })}
          placeholder="Opsiyonel"
        />
      </View>
      <Input
        label="Talep Başlığı"
        value={form.title}
        onChangeText={(value) => setForm({ ...form, title: value })}
        placeholder="Klima soğutmuyor"
      />
      <Input
        label="Arıza Açıklaması"
        value={form.description}
        onChangeText={(value) => setForm({ ...form, description: value })}
        placeholder="İlk notlar"
        multiline
      />
      <Input
        label="Randevu"
        value={form.appointmentAt}
        onChangeText={(value) => setForm({ ...form, appointmentAt: value })}
        placeholder="2026-07-04 14:30"
        autoCapitalize="none"
      />
      <QuickAppointmentPicker
        onChange={(appointmentAt) => setForm({ ...form, appointmentAt })}
      />
      <Input
        label="Tahmini Ücret"
        value={form.price}
        onChangeText={(value) => setForm({ ...form, price: digitsOnly(value) })}
        placeholder="1200"
        keyboardType="number-pad"
      />
      <Text style={styles.label}>Durum</Text>
      <SegmentedControl
        items={statuses}
        value={form.status}
        onChange={(value) => setForm({ ...form, status: value })}
      />
      <Text style={styles.label}>Öncelik</Text>
      <SegmentedControl
        items={priorities}
        value={form.priority}
        onChange={(value) => setForm({ ...form, priority: value })}
      />
      <Text style={styles.label}>Ödeme</Text>
      <SegmentedControl
        items={paymentStatuses}
        value={form.paymentStatus}
        onChange={(value) => {
          const nextPaidAmount = value === "paid" ? form.price : value === "unpaid" ? "0" : form.paidAmount;
          setForm({ ...form, paymentStatus: value, paidAmount: nextPaidAmount });
        }}
      />
      {form.paymentStatus === "partial" ? (
        <Input
          label="Ödenen Tutar"
          value={form.paidAmount}
          onChangeText={(value) => setForm({ ...form, paidAmount: digitsOnly(value) })}
          placeholder="500"
          keyboardType="number-pad"
        />
      ) : null}
      <PhotoPicker photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
      <PrimaryButton
        title={busy ? "Kaydediliyor..." : editing ? "Talebi Güncelle" : "Talep Kaydet"}
        onPress={onSubmit}
        disabled={busy || customers.length === 0}
      />
      {editing ? (
        <Pressable style={styles.secondaryAction} onPress={onReset}>
          <Text style={styles.secondaryActionText}>Vazgeç</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function QuickAppointmentPicker({ onChange }) {
  const presets = [
    { label: "1 saat", value: () => getRoundedFutureAppointment(60) },
    { label: "Akşam 18", value: () => getFixedFutureAppointment(0, 18) },
    { label: "Yarın 10", value: () => getFixedFutureAppointment(1, 10) },
    { label: "Temizle", value: () => "" }
  ];

  return (
    <View style={styles.quickPicker}>
      {presets.map((preset) => (
        <SmallButton key={preset.label} title={preset.label} onPress={() => onChange(preset.value())} />
      ))}
    </View>
  );
}

function ContactActions({ phone, address }) {
  if (!phone && !address) {
    return null;
  }

  return (
    <View style={styles.contactActionRow}>
      {phone ? <SmallButton title="Ara" onPress={() => callPhone(phone)} /> : null}
      {phone ? <SmallButton title="WhatsApp" onPress={() => openWhatsApp(phone)} /> : null}
      {address ? <SmallButton title="Konum" onPress={() => openAddress(address)} /> : null}
    </View>
  );
}

function CustomerList({ customers, onJob, onEdit, onDelete }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>Müşteriler</Text>
      {customers.length === 0 ? <EmptyState text="Müşteri bulunamadı." /> : null}
      {customers.map((customer) => (
        <Card key={customer.id}>
          <Text style={styles.cardTitle}>{customer.name}</Text>
          <Text style={styles.bodyText}>{customer.phone ? formatPhone(customer.phone) : "Telefon yok"}</Text>
          <Text style={styles.muted}>{customer.address || "Adres yok"}</Text>
          <Text style={styles.customerCount}>{customer._count?.jobs || 0} talep</Text>
          <ContactActions phone={customer.phone} address={customer.address} />
          <View style={styles.actionRow}>
            <SmallButton title="Talep Aç" onPress={() => onJob(customer)} />
            <SmallButton title="Düzenle" onPress={() => onEdit(customer)} />
            <SmallButton title="Sil" danger onPress={() => onDelete(customer)} />
          </View>
        </Card>
      ))}
    </View>
  );
}

function JobHistory({ events }) {
  const visibleEvents = Array.isArray(events) ? events.slice(-3) : [];

  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <View style={styles.historyBox}>
      <Text style={styles.historyTitle}>İş geçmişi</Text>
      {visibleEvents.map((event) => (
        <View key={event.id || event.createdAt || event.status} style={styles.historyItem}>
          <Text style={styles.historyStatus}>{statusLabels[event.status] || event.status}</Text>
          <Text style={styles.historyMeta}>{formatDateTime(event.createdAt) || "Tarih yok"}</Text>
        </View>
      ))}
    </View>
  );
}

function JobList({ jobs, emptyText, onEdit, onStart, onComplete, onCancel, onPaid, onDelete, onOpenPhoto }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.sectionTitle}>Talepler</Text>
      {jobs.length === 0 ? <EmptyState text={emptyText} /> : null}
      {jobs.map((job) => {
        const remaining = Math.max(Number(job.price || 0) - getPaidAmount(job), 0);
        const appointment = formatDateTime(job.appointmentAt);
        const overdue = isOverdueJob(job);
        return (
          <Card key={job.id} accent={overdue ? "#dc2626" : "#0f766e"}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              {job.requestCode ? <Badge text={job.requestCode} /> : null}
            </View>
            <Text style={styles.bodyText}>{job.customer?.name || "Müşteri yok"}</Text>
            {job.customer?.phone ? <Text style={styles.muted}>Tel: {formatPhone(job.customer.phone)}</Text> : null}
            {job.customer?.address ? <Text style={styles.muted}>Adres: {job.customer.address}</Text> : null}
            {job.description ? (
              <Text style={styles.jobDescription} numberOfLines={3}>{job.description}</Text>
            ) : null}
            <ContactActions phone={job.customer?.phone} address={job.customer?.address} />
            <Text style={styles.muted}>
              {(productCategoryLabels[job.productCategory] || "Diğer") +
                ([job.productBrand, job.productModel].filter(Boolean).length
                  ? " - " + [job.productBrand, job.productModel].filter(Boolean).join(" ")
                  : "")}
            </Text>
            <PhotoStrip photos={job.photos} onOpenPhoto={onOpenPhoto} />
            <View style={styles.badgeRow}>
              {overdue ? <Badge text="Gecikti" danger /> : null}
              <Badge text={statusLabels[job.status] || job.status} />
              <Badge text={paymentStatusLabels[job.paymentStatus] || job.paymentStatus} />
              <Badge text={priorityLabels[job.priority] || job.priority} />
            </View>
            <JobStatusTrail status={job.status} />
            <Text style={styles.bodyText}>Toplam: {formatCurrency(job.price)}</Text>
            {job.paymentStatus === "partial" ? <Text style={styles.bodyText}>Kalan: {formatCurrency(remaining)}</Text> : null}
            {appointment ? <Text style={styles.muted}>Randevu: {appointment}</Text> : null}
            <JobHistory events={job.statusEvents} />
            <View style={styles.actionRow}>
              <SmallButton title="Düzenle" onPress={() => onEdit(job)} />
              {job.requestCode ? <SmallButton title="Kod Paylaş" onPress={() => shareRequestCode(job)} /> : null}
              <SmallButton
                title="İşe Başla"
                onPress={() => onStart(job)}
                disabled={job.status !== "pending"}
              />
              <SmallButton
                title="Bitti"
                onPress={() => onComplete(job)}
                disabled={!isOpenJob(job) || job.status === "completed"}
              />
              <SmallButton
                title="Ödendi"
                onPress={() => onPaid(job)}
                disabled={job.paymentStatus === "paid" || job.status === "cancelled"}
              />
              <SmallButton
                title="İptal"
                danger
                onPress={() => onCancel(job)}
                disabled={!isOpenJob(job)}
              />
              <SmallButton title="Sil" danger onPress={() => onDelete(job)} />
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function BottomNav({ activeTab, onChange }) {
  const tabs = [
    { value: "today", label: "Bugün", icon: CalendarDays },
    { value: "customers", label: "Müşteri", icon: Users },
    { value: "jobs", label: "Talep", icon: ClipboardList },
    { value: "search", label: "Ara", icon: SearchIcon },
    { value: "settings", label: "Ayarlar", icon: SettingsIcon }
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = activeTab === tab.value;
        const Icon = tab.icon;

        return (
          <Pressable
            key={tab.value}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => onChange(tab.value)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
          >
            <Icon size={20} color={active ? "#0f766e" : "#cbd5e1"} strokeWidth={2.3} />
            <Text style={[styles.navText, active && styles.navTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  flex: {
    flex: 1
  },
  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    gap: 12
  },
  loadingText: {
    color: "#475569",
    fontWeight: "800"
  },
  authContent: {
    padding: 16,
    gap: 12
  },
  heroBlock: {
    paddingVertical: 16
  },
  heroEyebrow: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroTitle: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4
  },
  heroSubtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  connectionNotice: {
    gap: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff1f2"
  },
  connectionBanner: {
    paddingHorizontal: 14,
    paddingTop: 12
  },
  connectionNoticeTitle: {
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "900"
  },
  connectionNoticeText: {
    color: "#7f1d1d",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700"
  },
  developerToggle: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  developerToggleText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900"
  },
  appShell: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  appHeader: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  appEyebrow: {
    color: "#99f6e4",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  appTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f766e"
  },
  headerButtonDisabled: {
    opacity: 0.55
  },
  content: {
    flex: 1
  },
  contentInner: {
    padding: 14,
    paddingBottom: 92
  },
  stack: {
    gap: 12
  },
  cardTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900"
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900"
  },
  bodyText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700"
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900"
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    color: "#111827",
    backgroundColor: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f766e"
  },
  secondaryAction: {
    minHeight: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0"
  },
  secondaryActionText: {
    color: "#334155",
    fontWeight: "900"
  },
  dangerAction: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2"
  },
  dangerActionText: {
    color: "#991b1b",
    fontWeight: "900"
  },
  message: {
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ecfdf5"
  },
  messageText: {
    color: "#115e59",
    fontWeight: "800"
  },
  warningText: {
    color: "#92400e",
    fontSize: 13,
    fontWeight: "800"
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2
  },
  choiceChip: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff"
  },
  choiceChipActive: {
    borderColor: "#0f766e",
    backgroundColor: "#0f766e"
  },
  choiceChipText: {
    color: "#334155",
    fontWeight: "900"
  },
  choiceChipTextActive: {
    color: "#ffffff"
  },
  boardChip: {
    width: 86,
    minHeight: 64,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff"
  },
  boardChipActive: {
    borderColor: "#0f766e",
    backgroundColor: "#0f766e"
  },
  boardChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900"
  },
  boardChipCount: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900"
  },
  boardChipTextActive: {
    color: "#ffffff"
  },
  statsRow: {
    gap: 10
  },
  statCard: {
    width: 118,
    minHeight: 84,
    borderWidth: 1,
    borderColor: "#d9e0ea",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    gap: 6
  },
  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  statValue: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900"
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  twoColumn: {
    gap: 10
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  historyBox: {
    gap: 8,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  historyTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900"
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  historyStatus: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900"
  },
  historyMeta: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800"
  },
  statusStep: {
    flex: 1,
    minHeight: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0"
  },
  statusStepDanger: {
    backgroundColor: "#fee2e2"
  },
  statusStepTextActive: {
    color: "#ffffff"
  },
  badge: {
    minHeight: 26,
    borderRadius: 6,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  badgeText: {
    color: "#115e59",
    fontSize: 12,
    fontWeight: "900"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  photoImage: {
    width: "100%",
    height: "100%"
  },
  photoRemoveText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  photoStripButton: {
    borderRadius: 8,
    overflow: "hidden"
  },
  photoModal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(15,23,42,0.88)"
  },
  photoModalContent: {
    width: "100%",
    maxHeight: "88%",
    gap: 12,
    alignItems: "center"
  },
  photoModalTitle: {
    color: "#ffffff",
    fontWeight: "900"
  },
  photoModalCloseText: {
    color: "#0f766e",
    fontWeight: "900"
  },
  quickPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -4
  },
  contactActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  smallButtonText: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "900"
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#ffffff"
  },
  bottomNav: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 72,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    flexDirection: "row",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#111827"
  },
  navItem: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  navItemActive: {
    backgroundColor: "#f0fdfa"
  },
  navText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "900"
  },
  navTextActive: {
    color: "#0f766e"
  },
  pickerCount: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800"
  },
  customerCount: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "900"
  },
  jobDescription: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20
  }
});

export default App;
