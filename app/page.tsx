"use client";

import { CalendarCheck, ExternalLink, MapPin, Search, Stethoscope } from "lucide-react";
import Image from "next/image";
import type { FormEvent, InputHTMLAttributes } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  appointmentPurposeLabels,
  defaultBookingAdvanceDays,
  defaultHomepageContent,
  getAllowedAppointmentDates,
  appointmentStartsAt,
  type Appointment,
  type AppointmentPurpose,
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
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepageContent);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState(defaultBookingAdvanceDays);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionLoadingMessage, setActionLoadingMessage] = useState("");
  const [successPopupMessage, setSuccessPopupMessage] = useState("");

  const heroImageUrls = useMemo(() => {
    return homepageContent.heroSlides.length ? homepageContent.heroSlides.map((slide) => slide.imageUrl) : [homepageContent.heroImageUrl];
  }, [homepageContent]);
  const activeHeroSlide = homepageContent.heroSlides[activeHeroImageIndex];
  const maxAppointmentDate = useMemo(() => getAllowedAppointmentDates(bookingAdvanceDays).maxDate, [bookingAdvanceDays]);

  useEffect(() => {
    async function loadHomepageContent() {
      try {
        const response = await fetch("/api/settings/homepage");
        const result = await readJsonResponse(response);

        if (response.ok && result.homepageContent && !result.warning) {
          setHomepageContent(result.homepageContent);
          setBookingAdvanceDays(result.bookingAdvanceDays ?? defaultBookingAdvanceDays);
          setLoadError(false);
        } else {
          setHomepageContent(defaultHomepageContent);
          setBookingAdvanceDays(defaultBookingAdvanceDays);
          setLoadError(true);
        }
      } catch {
        setHomepageContent(defaultHomepageContent);
        setBookingAdvanceDays(defaultBookingAdvanceDays);
        setLoadError(true);
      } finally {
        setIsPageLoading(false);
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
    setBookingState({ type: "idle", message: "" });
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

  return (
    <main>
      {isPageLoading ? (
        <div className="topLoadingBanner">
          Đang tải dữ liệu phòng khám...
        </div>
      ) : loadError ? (
        <div className="topLoadingBanner error">
          Không thể tải dữ liệu mới nhất từ máy chủ. Đang hiển thị dữ liệu mặc định.
        </div>
      ) : null}
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
          <AddressLink content={homepageContent} />
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
        {tab === "booking" && (
          <form className="panel formGrid" onSubmit={handleBooking} onInvalid={handleInvalidField} onInput={clearFieldValidation} onChange={clearFieldValidation}>
            <Field label="Họ tên" name="fullName" autoComplete="name" required />
            <Field
              label="Số điện thoại"
              name="phone"
              autoComplete="tel"
              inputMode="numeric"
              pattern="0(3|5|7|8|9)[0-9]{8}"
              required
            />
            <Field
              label="Ngày khám"
              name="appointmentDate"
              type="date"
              min={today}
              max={maxAppointmentDate}
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
            <p className="appointmentTimeNote">Lưu ý: Bệnh nhân đến trước lịch hẹn 10 phút</p>
            {bookingSlotsState.message && <p className="slotHint">{bookingSlotsState.message}</p>}
            <PurposeOptions className="wide" defaultValue="new_treatment" />
            <FormMessage state={bookingState} />
            <button className="primaryAction" type="submit" disabled={isBookingSubmitting}>
              <CalendarCheck aria-hidden="true" />
              {isBookingSubmitting ? "Đang đặt lịch..." : "Đặt lịch khám"}
            </button>
          </form>
        )}

        {tab === "lookup" && (
          <div className="panel">
            <form className="lookupBar" onSubmit={handleLookup} onInvalid={handleInvalidField} onInput={clearFieldValidation} onChange={clearFieldValidation}>
              <Field
                label="Số điện thoại"
                name="lookupPhone"
                value={lookupPhone}
                onChange={setLookupPhone}
                inputMode="numeric"
                pattern="0(3|5|7|8|9)[0-9]{8}"
                required
              />
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
                    <p>{appointmentPurposeLabels[appointment.purpose] ?? appointment.purpose}</p>
                    {canEditAppointment ? (
                      <EditableAppointmentForm
                        appointment={appointment}
                        maxDate={maxAppointmentDate}
                        minDate={today}
                        onCancel={() => cancelAppointment(appointment.id)}
                        onSubmit={(event) => updateAppointment(event, appointment.id)}
                      />
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

function EditableAppointmentForm({
  appointment,
  minDate,
  maxDate,
  onSubmit,
  onCancel
}: {
  appointment: Appointment;
  minDate: string;
  maxDate: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(appointment.appointment_date);
  const [selectedTime, setSelectedTime] = useState(appointment.appointment_time.slice(0, 5));
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotsState, setSlotsState] = useState<ApiState>({ type: "idle", message: "" });

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      setSlotsState({ type: "idle", message: "" });
      return;
    }

    let ignore = false;

    async function loadSlots() {
      setSlots([]);
      setSlotsState({ type: "idle", message: "Đang tải giờ khám..." });

      try {
        const params = new URLSearchParams({
          date: selectedDate,
          excludeAppointmentId: appointment.id
        });
        const response = await fetch(`/api/appointments/availability?${params.toString()}`);
        const result = await readJsonResponse(response);

        if (ignore) {
          return;
        }

        if (!response.ok) {
          setSlotsState({ type: "error", message: result.error ?? "Không thể tải giờ khám" });
          return;
        }

        setSlots(result.slots ?? []);
        setSlotsState({
          type: "idle",
          message: result.reason ?? ((result.slots ?? []).length ? "" : "Không còn giờ khám phù hợp trong ngày này")
        });
      } catch {
        if (!ignore) {
          setSlotsState({ type: "error", message: "Không thể kết nối để tải giờ khám" });
        }
      }
    }

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [appointment.id, selectedDate]);

  return (
    <form className="editGrid" onSubmit={onSubmit} onInvalid={handleInvalidField} onInput={clearFieldValidation} onChange={clearFieldValidation}>
      <Field
        label="Ngày mới"
        name="appointmentDate"
        type="date"
        min={minDate}
        max={maxDate}
        value={selectedDate}
        onChange={(value) => {
          setSelectedDate(value);
          setSelectedTime("");
        }}
        required
      />
      <TimeSelect
        label="Giờ mới"
        name="appointmentTime"
        value={selectedTime}
        onChange={setSelectedTime}
        slots={slots}
        disabled={!selectedDate || Boolean(slotsState.message)}
        placeholder={
          !selectedDate
            ? "Chọn ngày khám trước"
            : slotsState.message
              ? "Chưa có giờ khả dụng"
              : "Chọn giờ khám"
        }
        required
      />
      {slotsState.message && <p className="slotHint">{slotsState.message}</p>}
      <PurposeOptions defaultValue={appointment.purpose} />
      <div className="buttonRow">
        <button type="submit">Cập nhật</button>
        <button type="button" className="danger" onClick={onCancel}>
          Hủy lịch
        </button>
      </div>
    </form>
  );
}

function AddressLink({ content }: { content: HomepageContent }) {
  if (!content.addressMapUrl) {
    return (
      <div className="headerInfoItem">
        <MapPin aria-hidden="true" />
        <span>{content.address}</span>
      </div>
    );
  }

  return (
    <a className="headerInfoItem" href={content.addressMapUrl} target="_blank" rel="noopener noreferrer">
      <MapPin aria-hidden="true" />
      <span>{content.address}</span>
    </a>
  );
}

function FacebookLink({ content }: { content: HomepageContent }) {
  return (
    <a className="headerInfoItem" href={content.facebookUrl} target="_blank" rel="noopener noreferrer">
      <ExternalLink aria-hidden="true" />
      <span>Facebook</span>
    </a>
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
  placeholder = "Chọn giờ khám",
  slots = [],
  disabled,
  required
}: {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  slots?: AppointmentSlot[];
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        disabled={disabled}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {slots.map((slot) => (
          <option className={!slot.available ? "slotFullOption" : ""} value={slot.time} key={slot.time} disabled={!slot.available}>
            {slot.time} - {slot.bookedCount}/{slot.capacity} khách
          </option>
        ))}
      </select>
    </label>
  );
}

function PurposeOptions({
  defaultValue,
  className
}: {
  defaultValue?: AppointmentPurpose;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend>Mục đích khám</legend>
      {(Object.entries(appointmentPurposeLabels) as [AppointmentPurpose, string][]).map(([value, label]) => (
        <label className="checkLabel" key={value}>
          <input name="purpose" type="radio" value={value} defaultChecked={defaultValue === value} required />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
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

type ValidatableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isValidatableElement(target: EventTarget | null): target is ValidatableElement {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

function clearFieldValidation(event: FormEvent<HTMLFormElement>) {
  if (isValidatableElement(event.target)) {
    clearControlValidation(event.target);
  }
}

function handleInvalidField(event: FormEvent<HTMLFormElement>) {
  if (!isValidatableElement(event.target)) {
    return;
  }

  clearControlValidation(event.target);
  if (event.target.validity.valid) {
    return;
  }

  event.target.setCustomValidity(getVietnameseValidationMessage(event.target));
}

function clearControlValidation(control: ValidatableElement) {
  if (control instanceof HTMLInputElement && control.type === "radio") {
    const controls = control.form ? Array.from(control.form.elements) : [];
    controls.forEach((field) => {
      if (field instanceof HTMLInputElement && field.type === "radio" && field.name === control.name) {
        field.setCustomValidity("");
      }
    });
    return;
  }

  control.setCustomValidity("");
}

function getVietnameseValidationMessage(control: ValidatableElement) {
  const label = getFieldLabel(control);
  const validity = control.validity;

  if (validity.valueMissing) {
    return control instanceof HTMLInputElement && control.type === "radio"
      ? `Vui lòng chọn ${label.toLowerCase()}`
      : `${label} là bắt buộc`;
  }

  if (validity.patternMismatch) {
    if (control.name === "phone" || control.name === "lookupPhone") {
      return "Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09";
    }

    return `${label} không đúng định dạng`;
  }

  if (validity.typeMismatch) {
    return `${label} không đúng định dạng`;
  }

  if (validity.rangeUnderflow) {
    return `${label} không được nhỏ hơn giá trị tối thiểu`;
  }

  if (validity.rangeOverflow) {
    return `${label} vượt quá giá trị cho phép`;
  }

  if (validity.tooShort) {
    return `${label} quá ngắn`;
  }

  if (validity.tooLong) {
    return `${label} quá dài`;
  }

  return `${label} không hợp lệ`;
}

function getFieldLabel(control: ValidatableElement) {
  const fieldsetLegend = control.closest("fieldset")?.querySelector("legend")?.textContent?.trim();
  if (fieldsetLegend) {
    return fieldsetLegend;
  }

  const labelText = control.closest("label")?.querySelector("span")?.textContent?.trim();
  if (labelText) {
    return labelText;
  }

  return "Trường này";
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
