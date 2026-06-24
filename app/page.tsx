"use client";

import { CalendarCheck, ClipboardList, MapPin, Phone, Search, ShieldCheck, Stethoscope } from "lucide-react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  dayLabels,
  createTimeOptions,
  defaultHomepageContent,
  defaultWeeklySchedule,
  getAllowedAppointmentDates,
  getCurrentMonthDates,
  type Appointment,
  type AppointmentStatus,
  type HomepageContent,
  type WeeklySchedule
} from "@/lib/appointments";

type Tab = "booking" | "lookup" | "admin";
type AdminSection = "appointments" | "settings" | "homepage";
type ApiState = { type: "idle" | "success" | "error"; message: string };
type AppointmentSlot = {
  time: string;
  bookedCount: number;
  capacity: number;
  available: boolean;
};

const statusLabels: Record<AppointmentStatus, string> = {
  booked: "Đã đặt",
  cancelled: "Đã hủy",
  completed: "Đã khám",
  no_show: "Không đến"
};

const allowedDates = getAllowedAppointmentDates();
const today = allowedDates.today;
const tomorrow = allowedDates.tomorrow;
const appointmentTimeOptions = createTimeOptions("07:30", "20:00", 30);
const currentMonthDates = getCurrentMonthDates();

export default function Home() {
  const [tab, setTab] = useState<Tab>("booking");
  const [bookingState, setBookingState] = useState<ApiState>({ type: "idle", message: "" });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState("");
  const [bookingSlots, setBookingSlots] = useState<AppointmentSlot[]>([]);
  const [bookingSlotsState, setBookingSlotsState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupState, setLookupState] = useState<ApiState>({ type: "idle", message: "" });
  const [adminState, setAdminState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupPhone, setLookupPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>("appointments");
  const [adminDate, setAdminDate] = useState(today);
  const [adminStatus, setAdminStatus] = useState("all");
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [internalHolidays, setInternalHolidays] = useState<string[]>([]);
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [settingsState, setSettingsState] = useState<ApiState>({ type: "idle", message: "" });

  const bookedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "booked"),
    [appointments]
  );
  const adminAppointmentGroups = useMemo(() => groupAppointmentsByScheduleTime(adminAppointments), [adminAppointments]);

  useEffect(() => {
    async function loadHomepageContent() {
      const response = await fetch("/api/settings/homepage");
      const result = await readJsonResponse(response);

      if (response.ok && result.homepageContent) {
        setHomepageContent(result.homepageContent);
      }
    }

    loadHomepageContent();
  }, []);

  useEffect(() => {
    if (!selectedBookingDate) {
      setBookingSlots([]);
      setBookingSlotsState({ type: "idle", message: "" });
      return;
    }

    let ignore = false;

    async function loadBookingSlots() {
      setBookingSlots([]);
      setBookingSlotsState({ type: "idle", message: "Đang tải giờ khám..." });

      try {
        const response = await fetch(`/api/appointments/availability?date=${encodeURIComponent(selectedBookingDate)}`);
        const result = await readJsonResponse(response);

        if (ignore) {
          return;
        }

        if (!response.ok) {
          setBookingSlotsState({ type: "error", message: result.error ?? "Không thể tải giờ khám" });
          return;
        }

        setBookingSlots(result.slots ?? []);
        setBookingSlotsState({
          type: "idle",
          message: result.reason ?? ((result.slots ?? []).length ? "" : "Không còn giờ khám phù hợp trong ngày này")
        });
      } catch {
        if (!ignore) {
          setBookingSlotsState({ type: "error", message: "Không thể kết nối để tải giờ khám" });
        }
      }
    }

    loadBookingSlots();

    return () => {
      ignore = true;
    };
  }, [selectedBookingDate]);

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBookingSubmitting) {
      return;
    }

    const formElement = event.currentTarget;
    setBookingState({ type: "idle", message: "" });
    setIsBookingSubmitting(true);
    const form = new FormData(formElement);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          age: form.get("age"),
          phone: form.get("phone"),
          appointmentDate: form.get("appointmentDate"),
          appointmentTime: form.get("appointmentTime"),
          purpose: form.get("purpose")
        })
      });

      const result = await readJsonResponse(response);
      if (!response.ok) {
        setBookingState({ type: "error", message: result.error ?? "Không thể đặt lịch" });
        setIsBookingSubmitting(false);
        return;
      }
    } catch {
      setBookingState({ type: "error", message: "Không thể kết nối để đặt lịch. Vui lòng thử lại." });
      setIsBookingSubmitting(false);
      return;
    }

    formElement.reset();
    setSelectedBookingDate("");
    setBookingSlots([]);
    setIsBookingSubmitting(false);
    setBookingState({ type: "success", message: "Lịch khám đã được ghi nhận" });
  }

  async function lookup(phone = lookupPhone) {
    setLookupState({ type: "idle", message: "" });
    const response = await fetch(`/api/appointments?phone=${encodeURIComponent(phone)}`);
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không tìm thấy lịch hẹn" });
      return;
    }

    setAppointments(result.appointments);
    setLookupState({
      type: "success",
      message: result.appointments.length ? "Đã tìm thấy lịch hẹn" : "Chưa có lịch hẹn cho số điện thoại này"
    });
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup();
  }

  async function updateAppointment(event: FormEvent<HTMLFormElement>, appointmentId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId,
        phone: lookupPhone,
        appointmentDate: form.get("appointmentDate"),
        appointmentTime: form.get("appointmentTime"),
        purpose: form.get("purpose")
      })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không thể sửa lịch" });
      return;
    }

    setLookupState({ type: "success", message: "Lịch hẹn đã được cập nhật" });
    await lookup();
  }

  async function cancelAppointment(appointmentId: string) {
    const response = await fetch("/api/appointments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, phone: lookupPhone })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không thể hủy lịch" });
      return;
    }

    setLookupState({ type: "success", message: "Lịch hẹn đã được hủy" });
    await lookup();
  }

  async function unlockAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminState({ type: "idle", message: "" });

    const response = await fetch("/api/admin/settings", {
      headers: { "x-admin-pin": adminPin }
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setAdminUnlocked(false);
      setAdminState({ type: "error", message: result.error ?? "Không thể xác thực PIN admin" });
      return;
    }

    setAdminUnlocked(true);
    setWeeklySchedule(result.weeklySchedule);
    setInternalHolidays(result.internalHolidays ?? []);
    setHomepageContent(result.homepageContent ?? defaultHomepageContent);
    setAdminState({ type: "success", message: "Đã mở khóa trang admin" });
  }

  function lockAdmin() {
    setAdminUnlocked(false);
    setAdminPin("");
    setAdminAppointments([]);
    setAdminState({ type: "idle", message: "" });
    setSettingsState({ type: "idle", message: "" });
  }

  async function loadAdminAppointments(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setAdminState({ type: "idle", message: "" });

    const params = new URLSearchParams();
    if (adminDate) params.set("date", adminDate);
    params.set("status", adminStatus);

    const response = await fetch(`/api/admin/appointments?${params.toString()}`, {
      headers: { "x-admin-pin": adminPin }
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setAdminState({ type: "error", message: result.error ?? "Không thể tải danh sách" });
      return;
    }

    setAdminAppointments(result.appointments);
    setAdminState({ type: "success", message: `${result.appointments.length} lịch hẹn` });
  }

  async function setAdminAppointmentStatus(appointment: Appointment, status: AppointmentStatus) {
    if (appointment.status === status) {
      return;
    }

    setAdminState({ type: "idle", message: "" });
    const response = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ appointmentId: appointment.id, status })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setAdminState({ type: "error", message: result.error ?? "Không thể cập nhật trạng thái" });
      return;
    }

    setAdminState({ type: "success", message: "Đã cập nhật trạng thái lịch" });
    await loadAdminAppointments();
  }

  async function loadSettings() {
    setSettingsState({ type: "idle", message: "" });
    const response = await fetch("/api/admin/settings", {
      headers: { "x-admin-pin": adminPin }
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể tải cấu hình" });
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setInternalHolidays(result.internalHolidays ?? []);
    setHomepageContent(result.homepageContent ?? defaultHomepageContent);
    setSettingsState({ type: "success", message: "Đã tải cấu hình lịch làm việc" });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsState({ type: "idle", message: "" });
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ weeklySchedule, internalHolidays, homepageContent: homepageContent ?? defaultHomepageContent })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể lưu cấu hình" });
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setInternalHolidays(result.internalHolidays ?? []);
    setHomepageContent(result.homepageContent ?? homepageContent);
    setSettingsState({ type: "success", message: "Đã lưu cấu hình" });
  }

  function updateWorkingDay(day: string, field: "enabled" | "open" | "close", value: boolean | string) {
    setWeeklySchedule((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value
      }
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

  function updateHomepageContent(field: keyof HomepageContent, value: string) {
    setHomepageContent((current) => ({
      ...(current ?? defaultHomepageContent),
      [field]: value
    }));
  }

  async function updateHomepageImage(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSettingsState({ type: "error", message: "Vui lòng chọn file ảnh" });
      return;
    }

    if (file.size > 2_000_000) {
      setSettingsState({ type: "error", message: "Ảnh trang chủ cần nhỏ hơn 2MB" });
      return;
    }

    setSettingsState({ type: "idle", message: "Đang upload ảnh..." });
    const formData = new FormData();
    formData.set("image", file);

    const response = await fetch("/api/admin/homepage-image", {
      method: "POST",
      headers: { "x-admin-pin": adminPin },
      body: formData
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể upload ảnh" });
      return;
    }

    updateHomepageContent("heroImageUrl", result.imageUrl);
    setSettingsState({ type: "success", message: "Đã upload ảnh mới, bấm lưu để áp dụng" });
  }

  if (!homepageContent) {
    return (
      <main className="loadingPage">
        <p>Đang tải thông tin phòng khám...</p>
      </main>
    );
  }

  return (
    <main>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(3, 33, 31, 0.82), rgba(3, 33, 31, 0.44), rgba(3, 33, 31, 0.12)), url("${homepageContent.heroImageUrl}")`
        }}
      >
        <div className="heroOverlay">
          <nav className="topbar">
            <div className="brand">
              <Stethoscope aria-hidden="true" />
              <span>{homepageContent.brandName}</span>
            </div>
            <div className="contactLine">
              <MapPin aria-hidden="true" />
              <span>{homepageContent.address}</span>
            </div>
          </nav>

          <div className="heroContent">
            <p className="eyebrow">{homepageContent.eyebrow}</p>
            <h1>{homepageContent.headline}</h1>
            <p className="heroCopy">{homepageContent.description}</p>
            <div className="heroActions" role="tablist" aria-label="Chức năng">
              <button className={tab === "booking" ? "active" : ""} onClick={() => setTab("booking")}>
                <CalendarCheck aria-hidden="true" />
                Đặt lịch
              </button>
              <button className={tab === "lookup" ? "active" : ""} onClick={() => setTab("lookup")}>
                <Search aria-hidden="true" />
                Tra cứu
              </button>
              <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>
                <ShieldCheck aria-hidden="true" />
                Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="infoStrip">
          <div>
            <Phone aria-hidden="true" />
            <span>Hotline: {homepageContent.hotline}</span>
          </div>
          <div>
            <ClipboardList aria-hidden="true" />
            <span>{homepageContent.hoursText}</span>
          </div>
        </div>

        {tab === "booking" && (
          <form className="panel formGrid" onSubmit={handleBooking}>
            <Field label="Họ tên" name="fullName" autoComplete="name" required />
            <Field label="Tuổi" name="age" type="number" min="1" max="129" required />
            <Field label="Số điện thoại" name="phone" autoComplete="tel" required />
            <Field
              label="Ngày khám"
              name="appointmentDate"
              type="date"
              min={today}
              max={tomorrow}
              value={selectedBookingDate}
              onChange={setSelectedBookingDate}
              required
            />
            <TimeSelect
              label="Giờ khám"
              name="appointmentTime"
              slots={bookingSlots}
              disabled={!selectedBookingDate || Boolean(bookingSlotsState.message)}
              placeholder={
                !selectedBookingDate
                  ? "Chọn ngày khám trước"
                  : bookingSlotsState.message
                    ? "Chưa có giờ khả dụng"
                    : "Chọn giờ khám"
              }
              required
            />
            {bookingSlotsState.message && <p className="slotHint">{bookingSlotsState.message}</p>}
            <label className="wide">
              <span>Mục đích khám</span>
              <textarea name="purpose" rows={4} required />
            </label>
            <FormMessage state={bookingState} />
            <button className="primaryAction" type="submit" disabled={isBookingSubmitting}>
              <CalendarCheck aria-hidden="true" />
              {isBookingSubmitting ? "Đang đặt lịch..." : "Đặt lịch khám"}
            </button>
          </form>
        )}

        {tab === "lookup" && (
          <div className="panel">
            <form className="lookupBar" onSubmit={handleLookup}>
              <Field label="Số điện thoại" name="lookupPhone" value={lookupPhone} onChange={setLookupPhone} required />
              <button className="primaryAction" type="submit">
                <Search aria-hidden="true" />
                Tra cứu
              </button>
            </form>
            <FormMessage state={lookupState} />
            <div className="appointmentList">
              {bookedAppointments.map((appointment) => (
                <article className="appointmentCard" key={appointment.id}>
                  <header>
                    <strong>{appointment.full_name}</strong>
                    <span>{statusLabels[appointment.status]}</span>
                  </header>
                  <p>
                    {appointment.appointment_date} lúc {appointment.appointment_time.slice(0, 5)}
                  </p>
                  <form className="editGrid" onSubmit={(event) => updateAppointment(event, appointment.id)}>
                    <Field
                      label="Ngày mới"
                      name="appointmentDate"
                      type="date"
                      min={today}
                      max={tomorrow}
                      defaultValue={appointment.appointment_date}
                      required
                    />
                    <TimeSelect
                      label="Giờ mới"
                      name="appointmentTime"
                      defaultValue={appointment.appointment_time.slice(0, 5)}
                      required
                    />
                    <label>
                      <span>Mục đích khám</span>
                      <textarea name="purpose" rows={3} defaultValue={appointment.purpose} required />
                    </label>
                    <div className="buttonRow">
                      <button type="submit">Cập nhật</button>
                      <button type="button" className="danger" onClick={() => cancelAppointment(appointment.id)}>
                        Hủy lịch
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "admin" && (
          <div className="panel">
            {!adminUnlocked && (
              <form className="adminLogin" onSubmit={unlockAdmin}>
                <Field
                  label="PIN admin"
                  name="adminPin"
                  type="password"
                  value={adminPin}
                  onChange={setAdminPin}
                  required
                />
                <button className="primaryAction" type="submit">
                  <ShieldCheck aria-hidden="true" />
                  Mở admin
                </button>
                <FormMessage state={adminState} />
              </form>
            )}

            {adminUnlocked && (
              <div className="adminWorkspace">
                <div className="adminHeader">
                  <div className="adminTabs" role="tablist" aria-label="Tác vụ admin">
                    <button
                      type="button"
                      className={adminSection === "appointments" ? "active" : ""}
                      onClick={() => setAdminSection("appointments")}
                    >
                      Danh sách đặt lịch
                    </button>
                    <button
                      type="button"
                      className={adminSection === "settings" ? "active" : ""}
                      onClick={() => setAdminSection("settings")}
                    >
                      Cấu hình lịch làm việc
                    </button>
                    <button
                      type="button"
                      className={adminSection === "homepage" ? "active" : ""}
                      onClick={() => setAdminSection("homepage")}
                    >
                      Thông tin trang chủ
                    </button>
                  </div>
                  <button className="secondaryAction" type="button" onClick={lockAdmin}>
                    Khóa admin
                  </button>
                </div>

                {adminSection === "appointments" && (
                  <>
                    <form className="adminFilters" onSubmit={loadAdminAppointments}>
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
                    <FormMessage state={adminState} />

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
                        {adminAppointmentGroups.map((group) => (
                          <tbody key={group.key}>
                            <tr className="adminGroupRow">
                              <td colSpan={6}>
                                <strong>{group.label}</strong>
                                <span>{group.appointments.length} lịch</span>
                              </td>
                            </tr>
                            {group.appointments.map((appointment) => (
                              <tr key={appointment.id}>
                                <td>
                                  {appointment.full_name}
                                  <br />
                                  <span className="tableMuted">{appointment.age} tuổi</span>
                                </td>
                                <td>{appointment.phone}</td>
                                <td>
                                  {appointment.appointment_date} {appointment.appointment_time.slice(0, 5)}
                                </td>
                                <td>{formatDateTime(appointment.created_at)}</td>
                                <td>{appointment.purpose}</td>
                                <td>
                                  <StatusSelect
                                    name={`status-${appointment.id}`}
                                    value={appointment.status}
                                    onChange={(value) => setAdminAppointmentStatus(appointment, value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        ))}
                      </table>
                    </div>
                  </>
                )}

                {adminSection === "settings" && (
                  <form className="settingsPanel" onSubmit={saveSettings}>
                    <div className="settingsHeader">
                      <strong>Cấu hình lịch làm việc</strong>
                      <button type="button" onClick={loadSettings}>
                        Tải cấu hình
                      </button>
                    </div>
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
                            <Field
                              label="Mở cửa"
                              name={`open-${day}`}
                              type="time"
                              value={schedule.open}
                              onChange={(value) => updateWorkingDay(day, "open", value)}
                            />
                            <Field
                              label="Đóng cửa"
                              name={`close-${day}`}
                              type="time"
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

                {adminSection === "homepage" && (
                  <form className="settingsPanel" onSubmit={saveSettings}>
                    <div className="settingsHeader">
                      <strong>Thông tin trang chủ</strong>
                      <button type="button" onClick={loadSettings}>
                        Tải cấu hình
                      </button>
                    </div>
                    <div className="homepageConfig">
                      <Field
                        label="Tên phòng khám"
                        name="brandName"
                        value={homepageContent.brandName}
                        onChange={(value) => updateHomepageContent("brandName", value)}
                        required
                      />
                      <Field
                        label="Địa chỉ"
                        name="address"
                        value={homepageContent.address}
                        onChange={(value) => updateHomepageContent("address", value)}
                        required
                      />
                      <Field
                        label="Hotline"
                        name="hotline"
                        value={homepageContent.hotline}
                        onChange={(value) => updateHomepageContent("hotline", value)}
                        required
                      />
                      <Field
                        label="Giờ làm việc hiển thị"
                        name="hoursText"
                        value={homepageContent.hoursText}
                        onChange={(value) => updateHomepageContent("hoursText", value)}
                        required
                      />
                      <Field
                        label="Nhãn nhỏ"
                        name="eyebrow"
                        value={homepageContent.eyebrow}
                        onChange={(value) => updateHomepageContent("eyebrow", value)}
                        required
                      />
                      <Field
                        label="Tiêu đề chính"
                        name="headline"
                        value={homepageContent.headline}
                        onChange={(value) => updateHomepageContent("headline", value)}
                        required
                      />
                      <label className="wide">
                        <span>Mô tả</span>
                        <textarea
                          value={homepageContent.description}
                          onChange={(event) => updateHomepageContent("description", event.target.value)}
                          rows={4}
                          required
                        />
                      </label>
                      <label className="wide">
                        <span>Ảnh trang chủ</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => updateHomepageImage(event.target.files?.[0] ?? null)}
                        />
                      </label>
                      <div className="heroImagePreview wide">
                        <div
                          aria-label="Ảnh trang chủ hiện tại"
                          role="img"
                          style={{ backgroundImage: `url("${homepageContent.heroImageUrl}")` }}
                        />
                      </div>
                    </div>
                    <FormMessage state={settingsState} />
                    <button className="primaryAction" type="submit">
                      Lưu thông tin trang chủ
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
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
      <input
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        {...props}
      />
    </label>
  );
}

function TimeSelect({
  label,
  name,
  value,
  onChange,
  defaultValue,
  placeholder = "Chọn giờ khám",
  slots,
  disabled,
  required
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  slots?: AppointmentSlot[];
  disabled?: boolean;
  required?: boolean;
}) {
  const hasDynamicSlots = Array.isArray(slots);

  return (
    <label>
      <span>{label}</span>
      <select
        name={name}
        value={value}
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        disabled={disabled}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {hasDynamicSlots
          ? slots.map((slot) => (
              <option value={slot.time} key={slot.time} disabled={!slot.available}>
                {slot.time} - {slot.bookedCount}/{slot.capacity} khách
              </option>
            ))
          : appointmentTimeOptions.map((time) => (
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
  defaultValue,
  onChange
}: {
  name: string;
  value?: AppointmentStatus;
  defaultValue?: AppointmentStatus;
  onChange?: (value: AppointmentStatus) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onChange={onChange ? (event) => onChange(event.target.value as AppointmentStatus) : undefined}
    >
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
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

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}
