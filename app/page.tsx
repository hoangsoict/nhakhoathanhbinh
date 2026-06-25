"use client";

import { CalendarCheck, ExternalLink, MapPin, Phone, Search, Stethoscope } from "lucide-react";
import Image from "next/image";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createTimeOptions,
  getAllowedAppointmentDates,
  appointmentStartsAt,
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
  const workspaceRef = useRef<HTMLElement | null>(null);
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
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
  const [actionLoadingMessage, setActionLoadingMessage] = useState("");
  const [successPopupMessage, setSuccessPopupMessage] = useState("");

  const heroImageUrls = useMemo(() => {
    if (!homepageContent) return [];
    return homepageContent.heroSlides.length ? homepageContent.heroSlides.map((slide) => slide.imageUrl) : [homepageContent.heroImageUrl];
  }, [homepageContent]);
  const activeHeroSlide = homepageContent?.heroSlides[activeHeroImageIndex];

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

  useEffect(() => {
    if (heroImageUrls.length <= 1) {
      setActiveHeroImageIndex(0);
      return;
    }

    setActiveHeroImageIndex((current) => (current >= heroImageUrls.length ? 0 : current));

    const timer = window.setInterval(() => {
      setActiveHeroImageIndex((current) => (current + 1) % heroImageUrls.length);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [heroImageUrls.length]);

  async function handleBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBookingSubmitting) {
      return;
    }

    const formElement = event.currentTarget;
    setBookingState({ type: "idle", message: "" });
    setIsBookingSubmitting(true);
    setActionLoadingMessage("Đang đặt lịch...");
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
        setActionLoadingMessage("");
        return;
      }
    } catch {
      setBookingState({ type: "error", message: "Không thể kết nối để đặt lịch. Vui lòng thử lại." });
      setIsBookingSubmitting(false);
      setActionLoadingMessage("");
      return;
    }

    formElement.reset();
    setSelectedBookingDate("");
    setBookingSlots([]);
    setIsBookingSubmitting(false);
    setActionLoadingMessage("");
    setBookingState({ type: "success", message: "Lịch khám đã được ghi nhận" });
    setSuccessPopupMessage("Lịch khám đã được ghi nhận");
  }

  async function lookup(phone = lookupPhone) {
    setLookupState({ type: "idle", message: "" });
    setActionLoadingMessage("Đang tra cứu lịch hẹn...");
    const response = await fetch(`/api/appointments?phone=${encodeURIComponent(phone)}`);
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không tìm thấy lịch hẹn" });
      setActionLoadingMessage("");
      return;
    }

    setAppointments(result.appointments);
    const message = result.appointments.length ? "Đã tìm thấy lịch hẹn" : "Chưa có lịch hẹn cho số điện thoại này";
    setLookupState({ type: "success", message });
    setActionLoadingMessage("");
    setSuccessPopupMessage(message);
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup();
  }

  async function updateAppointment(event: FormEvent<HTMLFormElement>, appointmentId: string) {
    event.preventDefault();
    setActionLoadingMessage("Đang cập nhật lịch hẹn...");
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
      setActionLoadingMessage("");
      return;
    }

    setLookupState({ type: "success", message: "Lịch hẹn đã được cập nhật" });
    await lookup();
    setActionLoadingMessage("");
    setSuccessPopupMessage("Lịch hẹn đã được cập nhật");
  }

  async function cancelAppointment(appointmentId: string) {
    setActionLoadingMessage("Đang hủy lịch hẹn...");
    const response = await fetch("/api/appointments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, phone: lookupPhone })
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setLookupState({ type: "error", message: result.error ?? "Không thể hủy lịch" });
      setActionLoadingMessage("");
      return;
    }

    setLookupState({ type: "success", message: "Lịch hẹn đã được hủy" });
    await lookup();
    setActionLoadingMessage("");
    setSuccessPopupMessage("Lịch hẹn đã được hủy");
  }

  function switchTab(targetTab: Tab) {
    setTab(targetTab);
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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
      {actionLoadingMessage && <BlockingOverlay message={actionLoadingMessage} />}
      {successPopupMessage && <SuccessPopup message={successPopupMessage} onClose={() => setSuccessPopupMessage("")} />}
      <nav className="siteHeader">
        <div className="brand">
          {homepageContent.logoUrl ? (
            <Image alt="" className="brandLogo" height={42} src={homepageContent.logoUrl} unoptimized width={42} />
          ) : (
            <Stethoscope aria-hidden="true" />
          )}
          <span className="brandText">
            <span>{homepageContent.brandName}</span>
            <span className="brandHotline">{homepageContent.hotline}</span>
          </span>
        </div>
        <div className="headerMenu" role="tablist" aria-label="Chức năng">
          <button className={tab === "booking" ? "active" : ""} onClick={() => switchTab("booking")}>
            Đặt lịch
          </button>
          <button className={tab === "lookup" ? "active" : ""} onClick={() => switchTab("lookup")}>
            Tra cứu
          </button>
        </div>
        <div className="headerInfo">
          <div>
            <MapPin aria-hidden="true" />
            <AddressLink content={homepageContent} />
          </div>
          {homepageContent.facebookUrl && <FacebookLink content={homepageContent} />}
        </div>
      </nav>

      <section className="hero">
        <div className="heroSlides" aria-hidden="true">
          {heroImageUrls.map((imageUrl, index) => (
            <div
              className={`heroSlide${index === activeHeroImageIndex ? " active" : ""}`}
              key={`${imageUrl}-${index}`}
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />
          ))}
        </div>
        <div className="heroOverlay">
          <div className="heroContent">
            {activeHeroSlide?.eyebrow && <p className="eyebrow">{activeHeroSlide.eyebrow}</p>}
            {activeHeroSlide?.headline && <h1>{activeHeroSlide.headline}</h1>}
            {activeHeroSlide?.description && <p className="heroCopy">{activeHeroSlide.description}</p>}
          </div>
          {heroImageUrls.length > 1 && (
            <div className="heroDots" aria-label="Chọn ảnh giới thiệu">
              {heroImageUrls.map((_, index) => (
                <button
                  aria-label={`Chuyển đến ảnh ${index + 1}`}
                  aria-pressed={index === activeHeroImageIndex}
                  className={index === activeHeroImageIndex ? "active" : ""}
                  key={index}
                  onClick={() => setActiveHeroImageIndex(index)}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="workspace" ref={workspaceRef}>
        <div className="infoStrip">
          <div>
            <Phone aria-hidden="true" />
            <span>Hotline: {homepageContent.hotline}</span>
          </div>
          {homepageContent.facebookUrl && <FacebookLink content={homepageContent} />}
        </div>

        {tab === "booking" && (
          <form className="panel formGrid" onSubmit={handleBooking}>
            <Field label="Họ tên" name="fullName" autoComplete="name" required />
            <Field label="Tuổi" name="age" type="number" min="1" max="129" />
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
              <textarea name="purpose" rows={4} />
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
              {appointments.map((appointment) => {
                const canEditAppointment = canCustomerEditAppointment(appointment);

                return (
                  <article className="appointmentCard" key={appointment.id}>
                    <header>
                      <strong>{appointment.full_name}</strong>
                      <span>{statusLabels[appointment.status]}</span>
                    </header>
                    <p>
                      {appointment.appointment_date} lúc {appointment.appointment_time.slice(0, 5)}
                    </p>
                    {appointment.age ? <p>{appointment.age} tuổi</p> : null}
                    {appointment.purpose ? <p>{appointment.purpose}</p> : null}
                    {canEditAppointment ? (
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
                          <textarea name="purpose" rows={3} defaultValue={appointment.purpose} />
                        </label>
                        <div className="buttonRow">
                          <button type="submit">Cập nhật</button>
                          <button type="button" className="danger" onClick={() => cancelAppointment(appointment.id)}>
                            Hủy lịch
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="slotHint">Lịch này chỉ hiển thị, không còn đủ điều kiện để sửa hoặc hủy.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function canCustomerEditAppointment(appointment: Appointment) {
  return appointment.status === "booked" && appointmentStartsAt(appointment.appointment_date, appointment.appointment_time).getTime() > Date.now();
}

function AddressLink({ content }: { content: HomepageContent }) {
  if (!content.addressMapUrl) {
    return <span>{content.address}</span>;
  }

  return (
    <a href={content.addressMapUrl} target="_blank" rel="noopener noreferrer">
      {content.address}
    </a>
  );
}

function FacebookLink({ content }: { content: HomepageContent }) {
  return (
    <div>
      <ExternalLink aria-hidden="true" />
      <a href={content.facebookUrl} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
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
