"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Row, Col, Breadcrumb, Spin, message } from "antd";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();

        if (!res.ok) {
          message.error(json.message);
          router.replace("/dashboard/halls");
          return;
        }

        setData(json);
      } catch {
        message.error("حدث خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <Breadcrumb items={[{ title: "الرئيسية" }]} />
      <div className="wrapperHalls">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Link href="/dashboard/employees">
              <Card hoverable>
                <h3>الموظفين</h3>
                <div style={{ fontSize: 30, color: "var(--colorP)" }}>
                  {data.usersCount}
                </div>
              </Card>
            </Link>
          </Col>

          <Col xs={24} md={12}>
            <Link href="/dashboard/halls">
              <Card hoverable>
                <h3>القاعات</h3>
                <div style={{ fontSize: 30, color: "var(--colorP)" }}>
                  {data.hallsCount}
                </div>
              </Card>
            </Link>
          </Col>

          <Col xs={24} md={12}>
            <Link href="/dashboard/booking-requests">
              <Card hoverable>
                <h3>طلبات الحجز</h3>
                <div style={{ fontSize: 30, color: "var(--colorP)" }}>
                  {data.bookingRequestsCount}
                </div>
              </Card>
            </Link>
          </Col>

          <Col xs={24} md={12}>
            <Link href="/dashboard/cancel-requests">
              <Card hoverable>
                <h3>طلبات الإلغاء</h3>
                <div style={{ fontSize: 30, color: "var(--colorP)" }}>
                  {data.cancelRequestsCount}
                </div>
              </Card>
            </Link>
          </Col>
        </Row>
      </div>
    </div>
  );
}
