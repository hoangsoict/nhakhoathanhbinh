"use client";

import { ClipboardList, ImageUp, Settings, ShieldCheck, Trash2, Users } from "lucide-react";
import Image from "next/image";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import {
  dayLabels,
  createTimeOptions,
  defaultHomepageContent,
  defaultSlotCapacity,
  defaultWeeklySchedule,
  getAllowedAppointmentDates,
  getCurrentMonthDates,
  type Appointment,
  type AppointmentStatus,
  type HomepageContent,
  type HomepageSlide,
  type WeeklySchedule
} from "@/lib/appointments";

type Role = "admin" | "maintain";
type AdminSection = "appointments" | "settings" | "homepage" | "users";
type ApiState = { type: "idle" | "success" | "error"; message: string };
type MaintainUser = {
  id: string;
  username: string;
  role: "maintain";
  active: boolean;
  created_at: string;
  updated_at: string;
};

const today = getAllowedAppointmentDates().today;
const currentMonthDates = getCurrentMonthDates();
const fullDayTimeOptions = [...createTimeOptions("00:00", "24:00", 30), "24:00"];

export default function ManagePage() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState("");
  const [state, setState] = useState<ApiState>({ type: "idle", message: "" });
  const [settingsState, setSettingsState] = useState<ApiState>({ type: "idle", message: "" });
  const [userState, setUserState] = useState<ApiState>({ type: "idle", message: "" });
  const [section, setSection] = useState<AdminSection>("appointments");
  const [adminDate, setAdminDate] = useState(today);
  const [adminStatus, setAdminStatus] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [internalHolidays, setInternalHolidays] = useState<string[]>([]);
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepageContent);
  const [slotCapacity, setSlotCapacity] = useState(defaultSlotCapacity);
  const [users, setUsers] = useState<MaintainUser[]>([]);
  const [userPasswordDrafts, setUserPasswordDrafts] = useState<Record<string, string>>({});
  const [actionLoadingMessage, setActionLoadingMessage] = useState("");
  const [successPopupMessage, setSuccessPopupMessage] = useState("");

  const appointmentGroups = useMemo(() => groupAppointmentsByScheduleTime(appointments), [appointments]);
  const homepageSlides = useMemo(() => {
    return homepageContent.heroSlides.length
      ? homepageContent.heroSlides
      : [{ imageUrl: homepageContent.heroImageUrl, eyebrow: "", headline: "", description: "" }];
  }, [homepageContent]);
  const isAdmin = role === "admin";

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ type: "idle", message: "" });
    setActionLoadingMessage("Đang đăng nhập...");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password")
      })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setState({ type: "error", message: result.error ?? "Không thể đăng nhập" });
      setActionLoadingMessage("");
      return;
    }

    setToken(result.token);
    setRole(result.role);
    setUsername(result.username);
    setSection("appointments");
    setState({ type: "success", message: "Đã đăng nhập" });

    await loadAppointments(result.token, undefined, true);
    if (result.role === "admin") {
      await loadSettings(result.token, true);
      await loadUsers(result.token, true);
    }
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã đăng nhập");
  }

  function logout() {
    setToken("");
    setRole(null);
    setUsername("");
    setAppointments([]);
    setState({ type: "idle", message: "" });
  }

  function authHeaders(currentToken = token) {
    return { Authorization: `Bearer ${currentToken}` };
  }

  async function loadAppointments(currentToken = token, event?: FormEvent<HTMLFormElement>, silent = false) {
    event?.preventDefault();
    setState({ type: "idle", message: "" });
    if (!silent) setActionLoadingMessage("Đang tải danh sách lịch...");
    const params = new URLSearchParams();
    if (adminDate) params.set("date", adminDate);
    params.set("status", adminStatus);

    const response = await fetch(`/api/admin/appointments?${params.toString()}`, {
      headers: authHeaders(currentToken)
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setState({ type: "error", message: result.error ?? "Không thể tải danh sách" });
      if (!silent) setActionLoadingMessage("");
      return;
    }

    setAppointments(result.appointments);
    const message = `${result.appointments.length} lịch hẹn`;
    setState({ type: "success", message });
    if (!silent) {
      setActionLoadingMessage("");
      setSuccessPopupMessage(`Đã tải ${message}`);
    }
  }

  async function setAppointmentStatus(appointment: Appointment, status: AppointmentStatus) {
    if (appointment.status === status) return;
    setState({ type: "idle", message: "" });
    setActionLoadingMessage("Đang cập nhật trạng thái...");

    const response = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ appointmentId: appointment.id, status })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setState({ type: "error", message: result.error ?? "Không thể cập nhật trạng thái" });
      setActionLoadingMessage("");
      return;
    }

    setState({ type: "success", message: "Đã cập nhật trạng thái lịch" });
    await loadAppointments(token, undefined, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã cập nhật trạng thái lịch");
  }

  async function loadSettings(currentToken = token, silent = false) {
    setSettingsState({ type: "idle", message: "" });
    if (!silent) setActionLoadingMessage("Đang tải cấu hình...");
    const response = await fetch("/api/admin/settings", { headers: authHeaders(currentToken) });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể tải cấu hình" });
      if (!silent) setActionLoadingMessage("");
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setInternalHolidays(result.internalHolidays ?? []);
    setHomepageContent(result.homepageContent ?? defaultHomepageContent);
    setSlotCapacity(result.slotCapacity ?? defaultSlotCapacity);
    setSettingsState({ type: "success", message: "Đã tải cấu hình" });
    if (!silent) {
      setActionLoadingMessage("");
      setSuccessPopupMessage("Đã tải cấu hình");
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsState({ type: "idle", message: "" });
    setActionLoadingMessage("Đang lưu cấu hình...");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ weeklySchedule, internalHolidays, homepageContent, slotCapacity })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể lưu cấu hình" });
      setActionLoadingMessage("");
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setInternalHolidays(result.internalHolidays ?? []);
    setHomepageContent(result.homepageContent ?? homepageContent);
    setSlotCapacity(result.slotCapacity ?? slotCapacity);
    setSettingsState({ type: "success", message: "Đã lưu cấu hình" });
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã lưu cấu hình");
  }

  function updateWorkingDay(day: string, field: "enabled" | "open" | "close", value: boolean | string) {
    setWeeklySchedule((current) => ({
      ...current,
      [day]: { ...current[day], [field]: value }
    }));
  }

  function toggleInternalHoliday(date: string) {
    setInternalHolidays((current) => {
      if (current.includes(date)) {
        return current.filter((holiday) => holiday !== date);
      }

      return [...current, date].sort();
    });
  }

  function updateHomepageContent<K extends keyof HomepageContent>(field: K, value: HomepageContent[K]) {
    setHomepageContent((current) => ({ ...current, [field]: value }));
  }

  function setHomepageSlides(slides: HomepageSlide[]) {
    const nextSlides = slides.length ? slides : defaultHomepageContent.heroSlides;
    const nextImageUrls = nextSlides.map((slide) => slide.imageUrl);
    setHomepageContent((current) => ({
      ...current,
      heroImageUrl: nextImageUrls[0],
      heroImageUrls: nextImageUrls,
      heroSlides: nextSlides
    }));
  }

  function updateHomepageSlide(index: number, field: keyof HomepageSlide, value: string) {
    setHomepageContent((current) => {
      const nextSlides = current.heroSlides.map((slide, slideIndex) => {
        return slideIndex === index ? { ...slide, [field]: value } : slide;
      });
      const nextImageUrls = nextSlides.map((slide) => slide.imageUrl);

      return {
        ...current,
        heroImageUrl: nextImageUrls[0] ?? defaultHomepageContent.heroImageUrl,
        heroImageUrls: nextImageUrls,
        heroSlides: nextSlides
      };
    });
  }

  async function updateHomepageImages(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setSettingsState({ type: "error", message: "Vui lòng chọn file ảnh" });
      return;
    }

    if (selectedFiles.some((file) => file.size > 2_000_000)) {
      setSettingsState({ type: "error", message: "Mỗi ảnh trang chủ cần nhỏ hơn 2MB" });
      return;
    }

    setSettingsState({ type: "idle", message: "Đang upload ảnh..." });
    setActionLoadingMessage("Đang upload ảnh slider...");
    const uploadedImageUrls: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.set("image", file);
      const response = await fetch("/api/admin/homepage-image", {
        method: "POST",
        headers: authHeaders(),
        body: formData
      });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        setSettingsState({ type: "error", message: result.error ?? "Không thể upload ảnh" });
        setActionLoadingMessage("");
        return;
      }

      uploadedImageUrls.push(result.imageUrl);
    }

    const nextSlides = [
      ...homepageSlides,
      ...uploadedImageUrls.map((imageUrl) => ({ imageUrl, eyebrow: "", headline: "", description: "" }))
    ];
    setHomepageSlides(nextSlides);
    await persistHomepageSlides(nextSlides, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã upload và lưu ảnh slider");
  }

  async function updateHomepageLogo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSettingsState({ type: "error", message: "Vui lòng chọn file ảnh logo" });
      return;
    }

    if (file.size > 2_000_000) {
      setSettingsState({ type: "error", message: "Logo cần nhỏ hơn 2MB" });
      return;
    }

    setSettingsState({ type: "idle", message: "Đang upload logo..." });
    setActionLoadingMessage("Đang upload logo...");
    const formData = new FormData();
    formData.set("image", file);
    const response = await fetch("/api/admin/homepage-image", {
      method: "POST",
      headers: authHeaders(),
      body: formData
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể upload logo" });
      setActionLoadingMessage("");
      return;
    }

    updateHomepageContent("logoUrl", result.imageUrl);
    setSettingsState({ type: "success", message: "Đã upload logo, bấm lưu để áp dụng" });
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã upload logo");
  }

  async function deleteHomepageImage(imageUrl: string) {
    const nextSlides = homepageSlides.filter((slide) => slide.imageUrl !== imageUrl);
    setActionLoadingMessage("Đang xóa ảnh slider...");

    if (!imageUrl.startsWith("/")) {
      setSettingsState({ type: "idle", message: "Đang xóa ảnh..." });
      const response = await fetch("/api/admin/homepage-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ imageUrl })
      });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        setSettingsState({ type: "error", message: result.error ?? "Không thể xóa ảnh" });
        setActionLoadingMessage("");
        return;
      }
    }

    setHomepageSlides(nextSlides);
    await persistHomepageSlides(nextSlides, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã xóa ảnh slider");
  }

  async function persistHomepageSlides(slides: HomepageSlide[], silent = false) {
    const nextSlides = slides.length ? slides : defaultHomepageContent.heroSlides;
    const nextImageUrls = nextSlides.map((slide) => slide.imageUrl);
    const nextHomepageContent = {
      ...homepageContent,
      heroImageUrl: nextImageUrls[0],
      heroImageUrls: nextImageUrls,
      heroSlides: nextSlides
    };

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ weeklySchedule, internalHolidays, homepageContent: nextHomepageContent, slotCapacity })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể lưu slider ảnh" });
      if (!silent) setActionLoadingMessage("");
      return;
    }

    setHomepageContent(result.homepageContent ?? nextHomepageContent);
    setSettingsState({ type: "success", message: "Đã lưu slider ảnh" });
    if (!silent) {
      setActionLoadingMessage("");
      setSuccessPopupMessage("Đã lưu slider ảnh");
    }
  }

  async function loadUsers(currentToken = token, silent = false) {
    if (!silent) setActionLoadingMessage("Đang tải user...");
    const response = await fetch("/api/admin/users", { headers: authHeaders(currentToken) });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setUserState({ type: "error", message: result.error ?? "Không thể tải user" });
      if (!silent) setActionLoadingMessage("");
      return;
    }

    setUsers(result.users ?? []);
    setUserPasswordDrafts({});
    if (!silent) {
      setActionLoadingMessage("");
      setSuccessPopupMessage("Đã tải danh sách user");
    }
  }

  async function createMaintainUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserState({ type: "idle", message: "" });
    setActionLoadingMessage("Đang tạo user maintain...");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setUserState({ type: "error", message: result.error ?? "Không thể tạo user" });
      setActionLoadingMessage("");
      return;
    }

    event.currentTarget.reset();
    setUserState({ type: "success", message: "Đã tạo user maintain" });
    await loadUsers(token, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã tạo user maintain");
  }

  async function setMaintainUserActive(user: MaintainUser, active: boolean) {
    setActionLoadingMessage("Đang cập nhật user...");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ userId: user.id, active })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setUserState({ type: "error", message: result.error ?? "Không thể cập nhật user" });
      setActionLoadingMessage("");
      return;
    }

    setUserState({ type: "success", message: "Đã cập nhật user" });
    await loadUsers(token, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage("Đã cập nhật user");
  }

  async function resetMaintainUserPassword(user: MaintainUser) {
    const password = userPasswordDrafts[user.id] ?? "";
    if (password.length < 6) {
      setUserState({ type: "error", message: "Mật khẩu mới cần tối thiểu 6 ký tự" });
      return;
    }

    setActionLoadingMessage("Đang đặt lại mật khẩu...");
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ userId: user.id, password })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setUserState({ type: "error", message: result.error ?? "Không thể đặt lại mật khẩu" });
      setActionLoadingMessage("");
      return;
    }

    setUserPasswordDrafts((current) => ({ ...current, [user.id]: "" }));
    setUserState({ type: "success", message: `Đã đặt lại mật khẩu cho ${user.username}` });
    setActionLoadingMessage("");
    setSuccessPopupMessage(`Đã đặt lại mật khẩu cho ${user.username}`);
  }

  async function deleteMaintainUser(user: MaintainUser) {
    const confirmed = window.confirm(`Xóa user maintain "${user.username}"?`);
    if (!confirmed) {
      return;
    }

    setActionLoadingMessage("Đang xóa user...");
    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ userId: user.id })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setUserState({ type: "error", message: result.error ?? "Không thể xóa user" });
      setActionLoadingMessage("");
      return;
    }

    setUserState({ type: "success", message: `Đã xóa user ${user.username}` });
    await loadUsers(token, true);
    setActionLoadingMessage("");
    setSuccessPopupMessage(`Đã xóa user ${user.username}`);
  }

  if (!token || !role) {
    return (
      <main className="managePage">
        {actionLoadingMessage && <BlockingOverlay message={actionLoadingMessage} />}
        {successPopupMessage && <SuccessPopup message={successPopupMessage} onClose={() => setSuccessPopupMessage("")} />}
        <form className="panel adminLogin" onSubmit={login}>
          <Field label="User" name="username" autoComplete="username" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <button className="primaryAction" type="submit">
            <ShieldCheck aria-hidden="true" />
            Đăng nhập
          </button>
          <FormMessage state={state} />
        </form>
      </main>
    );
  }

  return (
    <main className="managePage">
      {actionLoadingMessage && <BlockingOverlay message={actionLoadingMessage} />}
      {successPopupMessage && <SuccessPopup message={successPopupMessage} onClose={() => setSuccessPopupMessage("")} />}
      <section className="panel">
        <div className="adminWorkspace">
          <div className="adminHeader">
            <div>
              <strong>Manage</strong>
              <p className="manageUser">
                {username} - {role === "admin" ? "Admin" : "Maintain"}
              </p>
            </div>
            <button className="secondaryAction" type="button" onClick={logout}>
              Đăng xuất
            </button>
          </div>

          <div className="adminTabs" role="tablist" aria-label="Tác vụ nội bộ">
            <button className={section === "appointments" ? "active" : ""} onClick={() => setSection("appointments")}>
              <ClipboardList aria-hidden="true" />
              Danh sách đặt lịch
            </button>
            {isAdmin && (
              <>
                <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>
                  <Settings aria-hidden="true" />
                  Cấu hình lịch làm việc
                </button>
                <button className={section === "homepage" ? "active" : ""} onClick={() => setSection("homepage")}>
                  <ImageUp aria-hidden="true" />
                  Thông tin trang chủ
                </button>
                <button className={section === "users" ? "active" : ""} onClick={() => setSection("users")}>
                  <Users aria-hidden="true" />
                  User maintain
                </button>
              </>
            )}
          </div>

          {section === "appointments" && (
            <>
              <form className="adminFilters" onSubmit={(event) => loadAppointments(token, event)}>
                <Field label="Ngày" name="adminDate" type="date" value={adminDate} onChange={setAdminDate} />
                <label>
                  <span>Trạng thái</span>
                  <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="booked">Đã đặt</option>
                    <option value="completed">Đã khám</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="no_show">Không đến</option>
                  </select>
                </label>
                <button className="primaryAction" type="submit">
                  <ClipboardList aria-hidden="true" />
                  Tải lịch
                </button>
              </form>
              <FormMessage state={state} />
              <AppointmentTable groups={appointmentGroups} onStatusChange={setAppointmentStatus} />
            </>
          )}

          {isAdmin && section === "settings" && (
            <form className="settingsPanel" onSubmit={saveSettings}>
              <div className="settingsHeader">
                <strong>Cấu hình lịch làm việc</strong>
              </div>
              <Field
                label="Số khách tối đa mỗi ca"
                name="slotCapacity"
                type="number"
                min="1"
                max="20"
                value={String(slotCapacity)}
                onChange={(value) => setSlotCapacity(Number(value))}
                required
              />
              <div className="scheduleGrid">
                {dayLabels.map((label, index) => {
                  const day = String(index);
                  const schedule = weeklySchedule[day];

                  return (
                    <div className="scheduleRow" key={day}>
                      <label className="checkLabel">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(event) => updateWorkingDay(day, "enabled", event.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                      <TimeSelect24
                        label="Mở cửa"
                        name={`open-${day}`}
                        value={schedule.open}
                        onChange={(value) => updateWorkingDay(day, "open", value)}
                      />
                      <TimeSelect24
                        label="Đóng cửa"
                        name={`close-${day}`}
                        value={schedule.close}
                        onChange={(value) => updateWorkingDay(day, "close", value)}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="holidaySection">
                <strong>Ngày nghỉ nội bộ trong tháng hiện tại</strong>
                <div className="holidayGrid">
                  {currentMonthDates.map((date) => (
                    <label className="holidayItem" key={date}>
                      <input
                        type="checkbox"
                        checked={internalHolidays.includes(date)}
                        onChange={() => toggleInternalHoliday(date)}
                      />
                      <span>{formatShortDate(date)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FormMessage state={settingsState} />
              <button className="primaryAction" type="submit">
                Lưu lịch làm việc
              </button>
            </form>
          )}

          {isAdmin && section === "homepage" && (
            <form className="settingsPanel" onSubmit={saveSettings}>
              <div className="settingsHeader">
                <strong>Thông tin trang chủ</strong>
              </div>
              <div className="homepageConfig">
                <Field label="Tên phòng khám" name="brandName" value={homepageContent.brandName} onChange={(value) => updateHomepageContent("brandName", value)} required />
                <label>
                  <span>Logo phòng khám</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateHomepageLogo(event.target.files?.[0] ?? null)} />
                </label>
                {homepageContent.logoUrl && (
                  <div className="logoPreview">
                    <Image alt="Logo phòng khám hiện tại" height={54} src={homepageContent.logoUrl} unoptimized width={160} />
                  </div>
                )}
                <Field label="Địa chỉ" name="address" value={homepageContent.address} onChange={(value) => updateHomepageContent("address", value)} required />
                <Field label="Link Google Maps" name="addressMapUrl" type="url" value={homepageContent.addressMapUrl} onChange={(value) => updateHomepageContent("addressMapUrl", value)} />
                <Field label="Hotline" name="hotline" value={homepageContent.hotline} onChange={(value) => updateHomepageContent("hotline", value)} required />
                <Field label="Link Facebook" name="facebookUrl" type="url" value={homepageContent.facebookUrl} onChange={(value) => updateHomepageContent("facebookUrl", value)} />
                <label className="wide">
                  <span>Ảnh slider trang chủ</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={(event) => updateHomepageImages(event.target.files)}
                  />
                </label>
                <div className="heroImageGallery wide">
                  {homepageSlides.map((slide, index) => (
                    <article className="heroImageItem" key={`${slide.imageUrl}-${index}`}>
                      <div
                        aria-label={`Ảnh slider ${index + 1}`}
                        role="img"
                        style={{ backgroundImage: `url("${slide.imageUrl}")` }}
                      />
                      <Field
                        label="Nhãn nhỏ"
                        name={`slide-eyebrow-${index}`}
                        value={slide.eyebrow}
                        onChange={(value) => updateHomepageSlide(index, "eyebrow", value)}
                      />
                      <Field
                        label="Tiêu đề chính"
                        name={`slide-headline-${index}`}
                        value={slide.headline}
                        onChange={(value) => updateHomepageSlide(index, "headline", value)}
                      />
                      <label>
                        <span>Mô tả</span>
                        <textarea
                          value={slide.description}
                          onChange={(event) => updateHomepageSlide(index, "description", event.target.value)}
                          rows={3}
                        />
                      </label>
                      <button className="danger" type="button" onClick={() => deleteHomepageImage(slide.imageUrl)}>
                        <Trash2 aria-hidden="true" />
                        Xóa ảnh
                      </button>
                    </article>
                  ))}
                </div>
              </div>
              <FormMessage state={settingsState} />
              <button className="primaryAction" type="submit">
                Lưu thông tin trang chủ
              </button>
            </form>
          )}

          {isAdmin && section === "users" && (
            <div className="settingsPanel">
              <form className="adminFilters" onSubmit={createMaintainUser}>
                <Field label="User maintain" name="username" required />
                <Field label="Password" name="password" type="password" minLength={6} required />
                <button className="primaryAction" type="submit">
                  <Users aria-hidden="true" />
                  Tạo user
                </button>
              </form>
              <FormMessage state={userState} />
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Đặt lại pass</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td data-label="User">{user.username}</td>
                        <td data-label="Trạng thái">{user.active ? "Đang bật" : "Đã tắt"}</td>
                        <td data-label="Ngày tạo">{formatDateTime(user.created_at)}</td>
                        <td data-label="Đặt lại pass">
                          <div className="userPasswordReset">
                            <input
                              aria-label={`Mật khẩu mới cho ${user.username}`}
                              type="password"
                              minLength={6}
                              value={userPasswordDrafts[user.id] ?? ""}
                              onChange={(event) =>
                                setUserPasswordDrafts((current) => ({
                                  ...current,
                                  [user.id]: event.target.value
                                }))
                              }
                              placeholder="Mật khẩu mới"
                            />
                            <button type="button" onClick={() => resetMaintainUserPassword(user)}>
                              Đặt lại pass
                            </button>
                          </div>
                        </td>
                        <td data-label="Thao tác">
                          <div className="buttonRow">
                            <button type="button" onClick={() => setMaintainUserActive(user, !user.active)}>
                              {user.active ? "Disable" : "Enable"}
                            </button>
                            <button type="button" className="danger" onClick={() => deleteMaintainUser(user)}>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function AppointmentTable({
  groups,
  onStatusChange
}: {
  groups: ReturnType<typeof groupAppointmentsByScheduleTime>;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
}) {
  return (
    <div className="tableWrap">
      <table className="adminAppointmentTable">
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Điện thoại</th>
            <th>Lịch khám</th>
            <th>Đặt lúc</th>
            <th>Mục đích</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr className="adminGroupRow">
              <td colSpan={6}>
                <strong>{group.label}</strong>
                <span>{group.appointments.length} lịch</span>
              </td>
            </tr>
            {group.appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td data-label="Khách hàng">
                  {appointment.full_name}
                  <br />
                  <span className="tableMuted">{appointment.age} tuổi</span>
                </td>
                <td data-label="Điện thoại">{appointment.phone}</td>
                <td data-label="Lịch khám">
                  {appointment.appointment_date} {appointment.appointment_time.slice(0, 5)}
                </td>
                <td data-label="Đặt lúc">{formatDateTime(appointment.created_at)}</td>
                <td data-label="Mục đích">{appointment.purpose}</td>
                <td data-label="Trạng thái">
                  <StatusSelect
                    name={`status-${appointment.id}`}
                    value={appointment.status}
                    onChange={(value) => onStatusChange(appointment, value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  ...props
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label>
      <span>{label}</span>
      <input name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} {...props} />
    </label>
  );
}

function TimeSelect24({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value)}>
        {fullDayTimeOptions.map((time) => (
          <option value={time} key={time}>
            {time}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusSelect({
  name,
  value,
  onChange
}: {
  name: string;
  value: AppointmentStatus;
  onChange: (value: AppointmentStatus) => void;
}) {
  return (
    <select name={name} value={value} onChange={(event) => onChange(event.target.value as AppointmentStatus)}>
      <option value="booked">Đã đặt</option>
      <option value="completed">Đã khám</option>
      <option value="cancelled">Đã hủy</option>
      <option value="no_show">Không đến</option>
    </select>
  );
}

function FormMessage({ state }: { state: ApiState }) {
  if (state.type === "idle" || !state.message) return null;
  return <p className={`formMessage ${state.type}`}>{state.message}</p>;
}

function BlockingOverlay({ message }: { message: string }) {
  return (
    <div className="blockingOverlay" role="alert" aria-live="assertive">
      <div className="loadingCard">
        <span className="loadingSpinner" aria-hidden="true" />
        <strong>{message}</strong>
        <span>Vui lòng chờ trong giây lát</span>
      </div>
    </div>
  );
}

function SuccessPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="successDialog" role="dialog" aria-modal="true" aria-label="Thông báo thành công" onClick={onClose}>
      <div className="successCard" onClick={(event) => event.stopPropagation()}>
        <strong>Thành công</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      error: response.ok
        ? "Máy chủ trả về dữ liệu không hợp lệ"
        : `Máy chủ trả về lỗi ${response.status}. Vui lòng tải lại trang và thử lại.`
    };
  }

  try {
    return await response.json();
  } catch {
    return { error: "Không thể đọc phản hồi từ máy chủ" };
  }
}

function groupAppointmentsByScheduleTime(appointments: Appointment[]) {
  const groups = new Map<string, { key: string; label: string; appointments: Appointment[] }>();

  for (const appointment of appointments) {
    const time = appointment.appointment_time.slice(0, 5);
    const key = `${appointment.appointment_date} ${time}`;
    const existing = groups.get(key);

    if (existing) {
      existing.appointments.push(appointment);
      continue;
    }

    groups.set(key, {
      key,
      label: `${appointment.appointment_date} lúc ${time}`,
      appointments: [appointment]
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    appointments: group.appointments.sort((first, second) => {
      return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    })
  }));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}
