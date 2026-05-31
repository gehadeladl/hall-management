"use client";

import { useEffect, useState } from "react";
import { Breadcrumb, Calendar, Card, Spin, Tag, message } from "antd";
import { useParams, useRouter } from "next/navigation";
import "dayjs/locale/ar";
import dayjs from "dayjs";
import Link from "next/link";

dayjs.locale("ar");

export default function HallPage() {
  const router = useRouter();
  const params = useParams();

  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);

  // نتحكم في الـ Calendar يدوياً عشان نتحكم في التنقل بين البانيلات
  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [calendarMode, setCalendarMode] = useState("month"); // "month" = عرض الأيام | "year" = عرض الشهور
  // key بنغيره عشان نجبر الـ Calendar يعمل re-mount لما الـ mode مش بيتغير
  const [calendarKey, setCalendarKey] = useState(0);

  // =========================
  // تحميل بيانات القاعة
  // =========================

  useEffect(() => {
    loadHall();
  }, []);

  async function loadHall() {
    try {
      setLoading(true);

      const res = await fetch(`/api/halls/${params.hallId}`);
      const data = await res.json();

      if (!res.ok) {
        message.error(data.message);
        return;
      }

      setHall(data);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // الأيام المحجوزة
  // =========================

  const bookedDates =
    hall?.bookings
      ?.filter((item) => item.status === "ACTIVE")
      ?.map((item) => dayjs(item.bookingDate).format("YYYY-MM-DD")) || [];

  // =========================
  // الضغط على يوم أو شهر
  // =========================

  const handleSelect = (value, info) => {
    const source = info?.source;

    if (source === "month") {
      // المستخدم اختار شهر → روح على panel الأيام
      setCalendarValue(value);
      setCalendarMode("month");
      setCalendarKey((k) => k + 1);
      return;
    }

    if (source === "year") {
      // المستخدم اختار سنة → روح على panel الشهور
      setCalendarValue(value);
      setCalendarMode("year");
      setCalendarKey((k) => k + 1);
      return;
    }

    if (source === "date") {
      // المستخدم اختار يوم فعلي → navigate
      router.push(
        `/dashboard/halls/${params.hallId}/${value.format("YYYY-MM-DD")}`,
      );
    }
  };

  // =========================
  // تمييز الأيام
  // =========================

  const cellRender = (value) => {
    const currentDate = value.format("YYYY-MM-DD");
    const booked = bookedDates.includes(currentDate);

    if (!booked) return null;

    return (
      <div style={{ marginTop: 4, textAlign: "center" }}>
        <Tag color="green">محجوز</Tag>
      </div>
    );
  };

  // =========================
  // الرندر
  // =========================

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[
          { title: <Link href="/dashboard/halls">القاعات</Link> },
          { title: hall?.name },
        ]}
      />

      <div className="wrapperHalls">
        <Card>
          <Calendar
            key={calendarKey}
            fullscreen
            value={calendarValue}
            mode={calendarMode}
            cellRender={cellRender}
            onSelect={handleSelect}
            onPanelChange={(value, mode) => {
              setCalendarValue(value);
              setCalendarMode(mode);
              setCalendarKey((k) => k + 1);
            }}
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
          />
        </Card>
      </div>
    </>
  );
}
