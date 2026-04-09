"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { handleFormError } from "@/utils/errorHandlers";
import { appointmentService } from "@/app/api/workshop";
import type {
  ServiceAppointment,
  AppointmentStatus,
} from "@/libs/interfaces/workshop";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#22c55e",
  ARRIVED: "#f59e0b",
  COMPLETED: "#10b981",
  NO_SHOW: "#ef4444",
  CANCELLED: "#9ca3af",
};

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 – 20:00
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface AppointmentCalendarProps {
  onAppointmentClick: (appt: ServiceAppointment) => void;
}

export default function AppointmentCalendar({
  onAppointmentClick,
}: AppointmentCalendarProps) {
  const toast = useRef<Toast>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates(currentDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const load = async () => {
    setLoading(true);
    try {
      const startDate = new Date(weekStart);
      startDate.setHours(0, 0, 0, 0);
      const startStr = startDate.toISOString();

      const endDate = new Date(weekEnd);
      endDate.setHours(23, 59, 59, 999);
      const endStr = endDate.toISOString();

      const res = await appointmentService.getAll({
        dateFrom: startStr,
        dateTo: endStr,
        limit: 100,
        sortBy: "scheduledDate",
        sortOrder: "asc",
      });
      console.log(res);
      setAppointments(res.data ?? []);
    } catch (err) {
      handleFormError(err, toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentDate]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // Map appointments to cells
  const getApptsForDayHour = (date: Date, hour: number) =>
    appointments.filter((a) => {
      const d = new Date(a.scheduledDate);
      return sameDay(d, date) && d.getHours() === hour;
    });

  const formatWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${weekDates[0].toLocaleDateString(
      "es-MX",
      opts,
    )} – ${weekDates[6].toLocaleDateString("es-MX", {
      ...opts,
      year: "numeric",
    })}`;
  };

  const today = new Date();

  return (
    <>
      <Toast ref={toast} />

      {/* Navigation */}
      <div className="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="flex align-items-center gap-2">
          <Button icon="pi pi-chevron-left" text rounded onClick={prevWeek} />
          <span className="font-semibold text-900">{formatWeekRange()}</span>
          <Button icon="pi pi-chevron-right" text rounded onClick={nextWeek} />
        </div>
        <div className="flex gap-2">
          <Button label="Hoy" outlined size="small" onClick={goToday} />
          {loading && <ProgressSpinner style={{ width: 24, height: 24 }} />}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "700px" }}>
          {/* Day headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7, 1fr)",
              gap: "1px",
              marginBottom: "1px",
            }}
          >
            <div />
            {weekDates.map((date, i) => {
              const isToday = sameDay(date, today);
              return (
                <div
                  key={i}
                  className={`text-center py-2 font-semibold text-sm border-round ${
                    isToday ? "bg-primary text-white" : "surface-100 text-700"
                  }`}
                >
                  <div>{DAYS[date.getDay()]}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{
                display: "grid",
                gridTemplateColumns: "60px repeat(7, 1fr)",
                gap: "1px",
                marginBottom: "1px",
              }}
            >
              {/* Hour label */}
              <div
                className="text-xs text-500 text-right pr-2 pt-1"
                style={{ lineHeight: "40px" }}
              >
                {`${String(hour).padStart(2, "0")}:00`}
              </div>

              {/* Day cells */}
              {weekDates.map((date, di) => {
                const appts = getApptsForDayHour(date, hour);
                const isToday = sameDay(date, today);
                return (
                  <div
                    key={di}
                    style={{
                      minHeight: "48px",
                      backgroundColor: isToday
                        ? "var(--blue-50)"
                        : "var(--surface-50)",
                      border: "1px solid var(--surface-200)",
                      borderRadius: "4px",
                      padding: "2px",
                      position: "relative",
                    }}
                  >
                    {appts.map((appt) => {
                      return (
                        <div
                          key={appt.id}
                          className="cursor-pointer border-round px-1 py-1 mb-1 text-xs"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[appt.status] ?? "#3b82f6",
                            color: "white",
                            fontSize: "10px",
                            lineHeight: "1.3",
                            overflow: "hidden",
                          }}
                          onClick={() => onAppointmentClick(appt)}
                          title={`${appt.folio} — ${appt.customer?.name ?? ""}`}
                        >
                          <div
                            className="font-bold"
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {appt.folio}
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {appt.customer?.name ?? appt.vehiclePlate ?? "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {appointments.length === 0 && !loading && (
        <div className="text-center text-500 py-4">
          <i className="pi pi-calendar text-3xl mb-2 block" />
          Sin citas esta semana
        </div>
      )}
    </>
  );
}
