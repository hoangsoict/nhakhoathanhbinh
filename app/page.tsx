"use client";

import { CalendarCheck, ClipboardList, MapPin, Phone, Search, Stethoscope } from "lucide-react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createTimeOptions,
  getAllowedAppointmentDates,
  type Appointment,
  type AppointmentStatus,
  type HomepageContent
} from "@/lib/appointments";

type Tab = "booking" | "lookup";
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

export default function Home() {
  const [tab, setTab] = useState<Tab>("booking");
  const [bookingState, setBookingState] = useState<ApiState>({ type: "idle", message: "" });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState("");
  const [bookingSlots, setBookingSlots] = useState<AppointmentSlot[]>([]);
  const [bookingSlotsState, setBookingSlotsState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupState, setLookupState] = useState<ApiState>({ type: "idle", message: "" });
  const [lookupPhone, setLookupPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);

  const bookedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "booked"),
    [appointments]
  );

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
