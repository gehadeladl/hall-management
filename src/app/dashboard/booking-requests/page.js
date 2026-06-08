"use client";

import {
  Table,
  Spin,
  message,
  Button,
  Modal,
  Descriptions,
  Space,
  Popconfirm,
  Breadcrumb,
} from "antd";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

export default function BookingRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // =============================
  // استشعار حجم الشاشة
  // =============================

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // =============================
  // ✅ حماية الصفحة — بتتحقق من الـ role وبتطرد فوراً
  // =============================

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const me = await res.json();
        if (!me?.id || me.role !== "SUPER_ADMIN") {
          router.replace("/dashboard/halls");
          return;
        }
        loadRequests();
      } catch {
        router.replace("/login");
      }
    }
    checkAuth();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await fetch("/api/booking-requests/all");
      const data = await res.json();
      if (!res.ok) {
        message.error(data.message);
        return;
      }
      setRequests(data);
    } catch {
      message.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/booking-requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.message);
        return;
      }
      message.success("تم اعتماد الحجز بنجاح");
      loadRequests();
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id) {
    try {
      setActionLoading(id);
      const res = await fetch(`/api/booking-requests/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.message);
        return;
      }
      message.success("تم رفض الطلب");
      loadRequests();
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setActionLoading(null);
    }
  }

  // =============================
  // أزرار الإجراءات — مشتركة بين العمود والـ expandable
  // =============================

  const renderActions = (record) => (
    <Space wrap>
      <Button
        onClick={() => {
          setSelectedRequest(record);
          setDetailsOpen(true);
        }}
      >
        تفاصيل
      </Button>
      <Button
        type="primary"
        loading={actionLoading === record.id}
        onClick={() => handleApprove(record.id)}
      >
        قبول
      </Button>
      <Popconfirm title="رفض الطلب ؟" onConfirm={() => handleReject(record.id)}>
        <Button danger>رفض</Button>
      </Popconfirm>
    </Space>
  );

  // =============================
  // أعمدة الجدول
  // على الموبايل: القاعة ومقدم الطلب بس — الباقي في expandable
  // =============================

  const columns = [
    {
      title: "القاعة",
      dataIndex: ["hall", "name"],
    },
    {
      title: "مقدم الطلب",
      render: (_, record) => record.createdBy?.username,
    },
    // الأعمدة دي بتظهر بس على الشاشات الكبيرة
    ...(!isMobile
      ? [
          {
            title: "العريس / العروسة",
            render: (_, record) => (
              <div>
                <div>{record.groomName}</div>
                <div>{record.brideName}</div>
              </div>
            ),
          },
          {
            title: "العربون",
            dataIndex: "depositAmount",
          },
          {
            title: "الإجمالي",
            dataIndex: "totalAmount",
          },
          {
            title: "الإجراءات",
            width: 250,
            render: (_, record) => renderActions(record),
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ title: "طلبات الحجز" }]} />
      <div className="wrapperHalls">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={requests}
          pagination={{ pageSize: 10 }}
          // ✅ expandable على الموبايل بس
          expandable={
            isMobile
              ? {
                  expandedRowRender: (record) => (
                    <div style={{ padding: "8px 0" }}>
                      <p
                        style={{
                          margin: "6px 0",
                          padding: "7px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "60px",
                            color: " var(--color)",
                          }}
                        >
                          العريس
                        </span>
                        : <span>{record.groomName}</span>
                      </p>
                      <p
                        style={{
                          margin: "6px 0",
                          padding: "7px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "60px",
                            color: " var(--color)",
                          }}
                        >
                          العروسة
                        </span>
                        : <span>{record.brideName}</span>
                      </p>
                      <p
                        style={{
                          margin: "6px 0",
                          padding: "7px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "60px",
                            color: " var(--color)",
                          }}
                        >
                          العربون
                        </span>
                        : <span>{record.depositAmount}</span>
                      </p>
                      <p
                        style={{
                          margin: "6px 0",
                          padding: "7px 0",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "60px",
                            color: " var(--color)",
                          }}
                        >
                          الإجمالي
                        </span>
                        : <span> {record.totalAmount}</span>
                      </p>
                      <div style={{ marginTop: 20 }}>
                        {renderActions(record)}
                      </div>
                    </div>
                  ),
                  expandIcon: ({ expanded, onExpand, record }) => (
                    <button
                      onClick={(e) => onExpand(record, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "0 4px",
                        color: "#1677ff",
                      }}
                    >
                      {expanded ? <UpOutlined /> : <DownOutlined />}
                    </button>
                  ),
                }
              : undefined
          }
        />

        <Modal
          title="تفاصيل الطلب"
          open={detailsOpen}
          footer={null}
          onCancel={() => setDetailsOpen(false)}
          width={700}
        >
          {selectedRequest && (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="القاعة">
                {selectedRequest.hall?.name}
              </Descriptions.Item>
              <Descriptions.Item label="العريس">
                {selectedRequest.groomName}
              </Descriptions.Item>
              <Descriptions.Item label="العروسة">
                {selectedRequest.brideName}
              </Descriptions.Item>
              <Descriptions.Item label="اسم الحاجز">
                {selectedRequest.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="رقم الهاتف">
                {selectedRequest.phone}
              </Descriptions.Item>
              <Descriptions.Item label="العربون">
                {selectedRequest.depositAmount}
              </Descriptions.Item>
              <Descriptions.Item label="المبلغ الكلي">
                {selectedRequest.totalAmount}
              </Descriptions.Item>
              <Descriptions.Item label="الاتفاقات">
                {selectedRequest.notes || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="مقدم الطلب">
                {selectedRequest.createdBy?.username}
              </Descriptions.Item>
              <Descriptions.Item label="تاريخ المناسبة">
                {dayjs(selectedRequest.bookingDate).format("YYYY-MM-DD")}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </>
  );
}
