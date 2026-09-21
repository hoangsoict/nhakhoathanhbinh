"use client";

import { useState, type FormEvent } from "react";
import { appointmentPurposeLabels, formatDateInVietnam } from "@/lib/appointments";
import { parseReportFilters, reportMaxEndDate, reportCsv, reportDateTime, reportStatusLabels, type AppointmentReport, type ReportType } from "@/lib/reports";

export default function ReportsPanel({ token }: { token: string }) {
  const [type, setType] = useState<ReportType>("no_show");
  const [from, setFrom] = useState(() => `${formatDateInVietnam(new Date()).slice(0, 7)}-01`);
  const [to, setTo] = useState(() => formatDateInVietnam(new Date()));
  const [report, setReport] = useState<AppointmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function clearResult() {
    setReport(null);
    setError("");
  }

  async function loadReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearResult();
    try {
      parseReportFilters(new URLSearchParams({ type, from, to }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Khoảng ngày không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?${new URLSearchParams({ type, from, to })}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Không thể tải báo cáo");
      setReport(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tải báo cáo");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([reportCsv(report)], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-${report.type}-${report.from}-${report.to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section aria-label="Báo cáo lịch hẹn" aria-busy={loading}>
      <h2>Báo cáo lịch hẹn</h2>
      <form onSubmit={loadReport}>
        <fieldset disabled={loading} className="reportFilters">
          <div className="adminFilters">
            <label><span>Loại báo cáo</span>
              <select value={type} onChange={(event) => { setType(event.target.value as ReportType); clearResult(); }}>
                <option value="no_show">Khách đặt lịch nhưng không đến</option>
                <option value="repeat_bookings">Khách đặt nhiều hơn 1 lịch</option>
              </select>
            </label>
            <label><span>Từ ngày</span><input type="date" required value={from} max={to || undefined} onChange={(event) => { setFrom(event.target.value); clearResult(); }} /></label>
            <label><span>Đến ngày</span><input type="date" required value={to} min={from || undefined} max={reportMaxEndDate(from) || undefined} onChange={(event) => { setTo(event.target.value); clearResult(); }} /></label>
          </div>
          <p className="manageUser">
            {type === "no_show"
              ? "Lọc theo ngày hẹn khám, chỉ gồm lịch được ghi nhận trạng thái Không đến."
              : "Lọc theo ngày hẹn khám, gồm tất cả trạng thái (kể cả đã hủy). Cùng số điện thoại được tính là một khách hàng; sửa lịch không tính là lượt đặt mới."}
            {" "}Tính cả ngày bắt đầu và kết thúc, theo giờ Việt Nam. Tối đa 1 tháng (ví dụ: 05/09–04/10).
          </p>
          <div className="buttonRow">
            <button type="submit" className="primaryAction">{loading ? "Đang tải báo cáo..." : "Xem báo cáo"}</button>
            <button type="button" className="secondaryAction" disabled={!report?.appointmentCount} onClick={downloadCsv}>Xuất CSV (Excel)</button>
          </div>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      {report && <>
        <p role="status">{report.groups.length} khách hàng · {report.appointmentCount} lịch hẹn</p>
        {report.groups.length === 0 ? <p>Không có dữ liệu phù hợp trong khoảng ngày đã chọn.</p> : (
          <div className="tableWrap">
            <table className="adminAppointmentTable">
              <thead><tr><th>Khách hàng</th><th>Điện thoại</th><th>Đặt lúc</th><th>Lịch khám</th><th>Mục đích</th><th>Trạng thái</th></tr></thead>
              {report.groups.map((group) => <tbody key={group.phone}>
                <tr className="adminGroupRow"><td colSpan={6}><strong>{group.phone}</strong><span>{group.appointments.length} lịch</span></td></tr>
                {group.appointments.map((appointment) => <tr key={appointment.id}>
                  <td data-label="Khách hàng">{appointment.full_name}</td>
                  <td data-label="Điện thoại">{appointment.phone}</td>
                  <td data-label="Đặt lúc">{reportDateTime(appointment.created_at)}</td>
                  <td data-label="Lịch khám">{appointment.appointment_date.split("-").reverse().join("/")} {appointment.appointment_time.slice(0, 5)}</td>
                  <td data-label="Mục đích">{appointmentPurposeLabels[appointment.purpose] ?? "Không ghi"}</td>
                  <td data-label="Trạng thái">{reportStatusLabels[appointment.status]}</td>
                </tr>)}
              </tbody>)}
            </table>
          </div>
        )}
      </>}
    </section>
  );
}
