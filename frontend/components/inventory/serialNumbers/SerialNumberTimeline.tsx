"use client";
import React, { useState, useEffect } from "react";
import { Timeline } from "primereact/timeline";
import { Card } from "primereact/card";
import { Skeleton } from "primereact/skeleton";
import { Message } from "primereact/message";
import {
  SerialNumberEvent,
  TimelineEvent,
  serialEventToTimelineEvent,
} from "@/types/serialNumber.interface";
import { getSerialNumberJourney } from "@/app/api/serialNumberService";

interface SerialNumberTimelineProps {
  serialId: string;
}

export default function SerialNumberTimeline({
  serialId,
}: SerialNumberTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJourney = async () => {
      try {
        setLoading(true);
        const journey = await getSerialNumberJourney(serialId);
        const timelineEvents = journey.events.map((event) =>
          serialEventToTimelineEvent(event),
        );
        // Sort by date, most recent first
        setEvents(
          timelineEvents.sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
        setError(null);
      } catch (err) {
        console.error("Error loading journey:", err);
        setError("No se pudo cargar la trayectoria del número de serie");
      } finally {
        setLoading(false);
      }
    };

    loadJourney();
  }, [serialId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton height="3rem" />
        <Skeleton height="3rem" />
        <Skeleton height="3rem" />
      </div>
    );
  }

  if (error) {
    return <Message severity="error" text={error} />;
  }

  if (events.length === 0) {
    return (
      <Message
        severity="info"
        text="No hay eventos registrados para este número de serie"
      />
    );
  }

  const customizedMarker = (item: TimelineEvent) => {
    return (
      <span
        className="flex w-3.5 h-3.5 rounded-full z-10 shadow-sm"
        style={{ backgroundColor: item.color || "#007bff" }}
      >
        {item.icon && (
          <i className={`${item.icon} text-white m-auto text-xs`} />
        )}
      </span>
    );
  };

  const customizedContent = (item: TimelineEvent) => {
    return (
      <Card className="mb-4">
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-lg text-gray-800">{item.title}</h4>
          <p className="text-sm text-gray-600">{item.subtitle}</p>
          <span className="text-xs text-gray-500">
            {new Date(item.date).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {item.details && (
            <div className="mt-3 pt-3 border-t space-y-1 text-sm">
              {item.details.warehouse && (
                <p>
                  <strong>Almacén:</strong> {item.details.warehouse}
                </p>
              )}
              {item.details.location && (
                <p>
                  <strong>Ubicación:</strong> {item.details.location}
                </p>
              )}
              {item.details.notes && (
                <p>
                  <strong>Notas:</strong> {item.details.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="py-4">
      <Timeline
        value={events}
        opposite={(item: TimelineEvent) => (
          <small className="text-color-secondary">
            {new Date(item.date).toLocaleDateString("es-ES")}
          </small>
        )}
        content={(item: TimelineEvent) => customizedContent(item)}
        marker={(item: TimelineEvent) => customizedMarker(item)}
        className="customized-timeline"
        layout="vertical"
        align="left"
      />
    </div>
  );
}
