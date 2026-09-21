import assert from "node:assert/strict";
import test from "node:test";
import type { Appointment } from "../lib/appointments";
import { groupReportAppointments, parseReportFilters, reportMaxEndDate, reportCsv, reportDateTime } from "../lib/reports";

function appointment(id: string, phone: string, overrides: Partial<Appointment> = {}): Appointment {
  return { id, phone, full_name: "Khách thử", appointment_date: "2026-09-21", appointment_time: "08:00:00", purpose: "new_treatment", status: "booked", created_at: "2026-09-20T17:00:00Z", updated_at: "2026-09-20T17:00:00Z", ...overrides };
}

test("validates calendar dates, required filters and reversed ranges", () => {
  for (const query of ["", "type=other&from=2026-09-01&to=2026-09-21", "type=no_show&from=2026-02-30&to=2026-03-01", "type=no_show&from=2026-09-22&to=2026-09-21"]) {
    assert.throws(() => parseReportFilters(new URLSearchParams(query)));
  }
  assert.deepEqual(parseReportFilters(new URLSearchParams("type=no_show&from=2024-02-29&to=2024-02-29")), { type: "no_show", from: "2024-02-29", to: "2024-02-29" });
});

test("repeat bookings group by phone despite differing names and include cancelled bookings", () => {
  const rows = [appointment("b", "0900000001", { full_name: "Tên khác", status: "cancelled" }), appointment("a", "0900000001", { created_at: "2026-09-19T17:00:00Z" }), appointment("c", "0900000002")];
  const groups = groupReportAppointments(rows, "repeat_bookings");
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].appointments.map((row) => row.id), ["a", "b"]);
  assert.deepEqual(groupReportAppointments([], "repeat_bookings"), []);
});

test("both reports enforce one inclusive calendar month across month ends and leap years", () => {
  for (const [from, to, rejected] of [
    ["2026-09-01", "2026-09-30", "2026-10-01"],
    ["2026-09-05", "2026-10-04", "2026-10-05"],
    ["2026-01-31", "2026-02-28", "2026-03-01"],
    ["2024-01-31", "2024-02-29", "2024-03-01"],
    ["2026-12-15", "2027-01-14", "2027-01-15"]
  ]) {
    assert.equal(reportMaxEndDate(from), to);
    for (const type of ["no_show", "repeat_bookings"]) {
      assert.doesNotThrow(() => parseReportFilters(new URLSearchParams({ type, from, to })));
      assert.throws(() => parseReportFilters(new URLSearchParams({ type, from, to: rejected })), /tối đa 1 tháng/);
    }
  }
});

test("no-show report excludes booked, completed and cancelled appointments", () => {
  const groups = groupReportAppointments([appointment("a", "0900000001", { status: "no_show" }), appointment("b", "0900000001"), appointment("c", "0900000002", { status: "completed" }), appointment("d", "0900000003", { status: "cancelled" })], "no_show");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].appointments.length, 1);
  assert.equal(groups[0].appointments[0].id, "a");
});

test("CSV preserves Vietnamese, phone leading zero, quotes and neutralizes formulas", () => {
  const csv = reportCsv({ type: "no_show", from: "2026-09-01", to: "2026-09-21", appointmentCount: 1, groups: [{ phone: "0900000001", appointments: [appointment("a", "0900000001", { full_name: '=HYPERLINK("bad")', status: "no_show" })] }] });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'0900000001"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes("Không đến"));
  assert.ok(reportDateTime("2026-09-20T17:00:00Z").includes("21/09/2026"));
});
