"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  Calendar,
  Card,
  Spin,
  Tag,
  message,
  DatePicker,
} from "antd";
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
  const [isMobile, setIsMobile] = useState(false);

  const [calendarValue, setCalendarValue] = useState(dayjs());
  const [calendarMode, setCalendarMode] = useState("month");
  const [calendarKey, setCalendarKey] = useState(0);

  // =============================
  // استشعار حجم الشاشة
  // =============================

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 880);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // =============================
  // تحميل بيانات القاعة
  // =============================

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
    } catch {
      message.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // =============================
  // الأيام المحجوزة
  // =============================

  const bookedDates =
    hall?.bookings
      ?.filter((item) => item.status === "ACTIVE")
      ?.map((item) => dayjs(item.bookingDate).format("YYYY-MM-DD")) || [];

  const pendingDates =
    hall?.bookingRequests?.map((item) =>
      dayjs(item.bookingDate).format("YYYY-MM-DD"),
    ) || [];

  const pendingCancelDates =
    hall?.bookings
      ?.filter((booking) => booking.cancelRequests?.length > 0)
      ?.map((booking) => dayjs(booking.bookingDate).format("YYYY-MM-DD")) || [];

  // =============================
  // الضغط على يوم أو شهر
  // =============================

  const handleSelect = (value, info) => {
    const source = info?.source;

    if (source === "month") {
      setCalendarValue(value);
      setCalendarMode("month");
      setCalendarKey((k) => k + 1);
      return;
    }

    if (source === "year") {
      setCalendarValue(value);
      setCalendarMode("year");
      setCalendarKey((k) => k + 1);
      return;
    }

    if (source === "date") {
      router.push(
        `/dashboard/halls/${params.hallId}/${value.format("YYYY-MM-DD")}`,
      );
    }
  };

  // =============================
  // تمييز الأيام — ديسك توب
  // =============================

  const cellRender = (value) => {
    const currentDate = value.format("YYYY-MM-DD");
    const booked = bookedDates.includes(currentDate);
    const pending = pendingDates.includes(currentDate);
    const pendingCancel = pendingCancelDates.includes(currentDate);

    if (pending) {
      return (
        <div style={{ marginTop: 4, textAlign: "center" }}>
          <Tag color="orange">بانتظار التأكيد</Tag>
        </div>
      );
    }
    if (pendingCancel) {
      return (
        <div style={{ marginTop: 4, textAlign: "center" }}>
          <Tag color="red">بانتظار الإلغاء</Tag>
        </div>
      );
    }
    if (booked) {
      return (
        <div style={{ marginTop: 4, textAlign: "center" }}>
          <Tag color="green">محجوز</Tag>
        </div>
      );
    }
    return null;
  };

  // =============================
  // عرض الموبايل — قائمة الأيام القادمة
  // =============================

  const getMobileList = () => {
    const today = dayjs().startOf("day");

    // بنجمع كل الأيام المهمة ونرتبهم
    const allDates = [
      ...bookedDates.map((d) => ({ date: d, type: "booked" })),
      ...pendingDates.map((d) => ({ date: d, type: "pending" })),
      ...pendingCancelDates.map((d) => ({ date: d, type: "pendingCancel" })),
    ]
      .filter(
        (item) =>
          dayjs(item.date).isSame(today) || dayjs(item.date).isAfter(today),
      )
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    return allDates;
  };

  const mobileList = getMobileList();

  // =============================
  // الرندر
  // =============================

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
        {/* ===== ديسك توب: الكالندر الكامل ===== */}
        {!isMobile && (
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
        )}

        {/* ===== موبايل: قائمة الأيام المحجوزة ===== */}
        {isMobile && (
          <div>
            {/* ===== ليجند ===== */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <Tag color="green">محجوز</Tag>
              <Tag color="orange">بانتظار التأكيد</Tag>
              <Tag color="red">بانتظار الإلغاء</Tag>
            </div>

            {/* ===== القائمة ===== */}
            {mobileList.length === 0 ? (
              <Card>
                <p style={{ textAlign: "center", color: "#888", margin: 0 }}>
                  لا توجد حجوزات قادمة
                </p>
              </Card>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {mobileList.map((item) => {
                  const d = dayjs(item.date);
                  const tagColor =
                    item.type === "booked"
                      ? "green"
                      : item.type === "pending"
                        ? "orange"
                        : "red";
                  const tagLabel =
                    item.type === "booked"
                      ? "محجوز"
                      : item.type === "pending"
                        ? "بانتظار التأكيد"
                        : "بانتظار الإلغاء";

                  return (
                    <Card
                      key={item.date}
                      size="small"
                      hoverable
                      onClick={() =>
                        router.push(
                          `/dashboard/halls/${params.hallId}/${item.date}`,
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14 }}>
                            {d.format("DD MMMM YYYY")}
                          </div>
                          <div
                            style={{
                              color: "#888",
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {d.format("dddd")}
                          </div>
                        </div>
                        <Tag color={tagColor}>{tagLabel}</Tag>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* ===== date picker لاختيار تاريخ حجز جديد ===== */}
            <div style={{ marginTop: 10 }}>
              <DatePicker
                style={{ width: "100%" }}
                placeholder="اختر تاريخ لحجز جديد"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                onChange={(date) => {
                  if (date) {
                    router.push(
                      `/dashboard/halls/${params.hallId}/${date.format("YYYY-MM-DD")}`,
                    );
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
