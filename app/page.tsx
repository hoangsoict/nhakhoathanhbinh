"use client";

import { CalendarCheck, ClipboardList, MapPin, Phone, Search, ShieldCheck, Stethoscope } from "lucide-react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import {
  dayLabels,
  defaultWeeklySchedule,
  type Appointment,
  type AppointmentStatus,
  type WeeklySchedule
} from "@/lib/appointments";

type Tab = "booking" | "lookup" | "admin";
type ApiState = { type: "idle" | "success" | "error"; message: string };

const statusLabels: Record<AppointmentStatus, string> = {
  booked: "Đã đặt",
  cancelled: "Đã hủy",
  completed: "Đã khám",
  no_show: "Không đến"
};

const today = new Date().toISOString().slice(0, 10);

export default function Home() {
  const [tab, setTab] = useState<Tab>("booking");
  const [bookingState, setBookingState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupState, setLookupState] = useState<ApiState>({ type: "idle", message: "" });
  const [adminState, setAdminState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupPhone, setLookupPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adminAppointments, setAdminAppointments] = useState<Appointment[]>([]);
  const [adminPin, setAdminPin] = useState("");
  const [adminDate, setAdminDate] = useState(today);
  const [adminStatus, setAdminStatus] = useState("all");
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(defaultWeeklySchedule);
  const [settingsState, setSettingsState] = useState<ApiState>({ type: "idle", message: "" });

  const bookedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "booked"),
    [appointments]
  );

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBookingState({ type: "idle", message: "" });
    const form = new FormData(formElement);

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

    const result = await response.json();
    if (!response.ok) {
      setBookingState({ type: "error", message: result.error ?? "Không thể đặt lịch" });
      return;
    }

    formElement.reset();
    setBookingState({ type: "success", message: "Lịch khám đã được ghi nhận" });
  }

  async function lookup(phone = lookupPhone) {
    setLookupState({ type: "idle", message: "" });
    const response = await fetch(`/api/appointments?phone=${encodeURIComponent(phone)}`);
    const result = await response.json();

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
    const result = await response.json();

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
    const result = await response.json();

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không thể hủy lịch" });
      return;
    }

    setLookupState({ type: "success", message: "Lịch hẹn đã được hủy" });
    await lookup();
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
    const result = await response.json();

    if (!response.ok) {
      setAdminState({ type: "error", message: result.error ?? "Không thể tải danh sách" });
      return;
    }

    setAdminAppointments(result.appointments);
    setAdminState({ type: "success", message: `${result.appointments.length} lịch hẹn` });
  }

  async function setAdminAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const response = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ appointmentId, status })
    });
    const result = await response.json();

    if (!response.ok) {
      setAdminState({ type: "error", message: result.error ?? "Không thể cập nhật trạng thái" });
      return;
    }

    await loadAdminAppointments();
  }

  async function loadSettings() {
    setSettingsState({ type: "idle", message: "" });
    const response = await fetch("/api/admin/settings", {
      headers: { "x-admin-pin": adminPin }
    });
    const result = await response.json();

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể tải cấu hình" });
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setSettingsState({ type: "success", message: "Đã tải cấu hình lịch làm việc" });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsState({ type: "idle", message: "" });
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": adminPin },
      body: JSON.stringify({ weeklySchedule })
    });
    const result = await response.json();

    if (!response.ok) {
      setSettingsState({ type: "error", message: result.error ?? "Không thể lưu cấu hình" });
      return;
    }

    setWeeklySchedule(result.weeklySchedule);
    setSettingsState({ type: "success", message: "Đã lưu lịch làm việc" });
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

  return (
    <main>
      <section className="hero">
        <div className="heroOverlay">
          <nav className="topbar">
            <div className="brand">
              <Stethoscope aria-hidden="true" />
              <span>Thanh Bình Clinic</span>
            </div>
            <div className="contactLine">
              <MapPin aria-hidden="true" />
              <span>123 Nguyễn Trãi, Quận 1, TP.HCM</span>
            </div>
          </nav>

          <div className="heroContent">
            <p className="eyebrow">Phòng khám đa khoa</p>
            <h1>Đặt lịch khám bằng số điện thoại</h1>
            <p className="heroCopy">
              Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn.
            </p>
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
            <span>Hotline: 028 1234 5678</span>
          </div>
          <div>
            <ClipboardList aria-hidden="true" />
            <span>Thứ 2 - Chủ nhật, 07:30 - 20:00</span>
          </div>
        </div>

        {tab === "booking" && (
          <form className="panel formGrid" onSubmit={handleBooking}>
            <Field label="Họ tên" name="fullName" autoComplete="name" required />
            <Field label="Tuổi" name="age" type="number" min="1" max="129" required />
            <Field label="Số điện thoại" name="phone" autoComplete="tel" required />
            <Field label="Ngày khám" name="appointmentDate" type="date" min={today} required />
            <Field label="Giờ khám" name="appointmentTime" type="time" required />
            <label className="wide">
              <span>Mục đích khám</span>
              <textarea name="purpose" rows={4} required />
            </label>
            <FormMessage state={bookingState} />
            <button className="primaryAction" type="submit">
              <CalendarCheck aria-hidden="true" />
              Đặt lịch khám
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
                    <Field label="Ngày mới" name="appointmentDate" type="date" min={today} defaultValue={appointment.appointment_date} required />
                    <Field label="Giờ mới" name="appointmentTime" type="time" defaultValue={appointment.appointment_time.slice(0, 5)} required />
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
            <form className="adminFilters" onSubmit={loadAdminAppointments}>
              <Field label="PIN admin" name="adminPin" type="password" value={adminPin} onChange={setAdminPin} required />
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
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Điện thoại</th>
                    <th>Lịch khám</th>
                    <th>Mục đích</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.full_name}</td>
                      <td>{appointment.phone}</td>
                      <td>
                        {appointment.appointment_date} {appointment.appointment_time.slice(0, 5)}
                      </td>
                      <td>{appointment.purpose}</td>
                      <td>
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            setAdminAppointmentStatus(appointment.id, event.target.value as AppointmentStatus)
                          }
                        >
                          <option value="booked">Đã đặt</option>
                          <option value="completed">Đã khám</option>
                          <option value="cancelled">Đã hủy</option>
                          <option value="no_show">Không đến</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <FormMessage state={settingsState} />
              <button className="primaryAction" type="submit">
                Lưu lịch làm việc
              </button>
            </form>
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

function FormMessage({ state }: { state: ApiState }) {
  if (state.type === "idle" || !state.message) return null;
  return <p className={`formMessage ${state.type}`}>{state.message}</p>;
}
