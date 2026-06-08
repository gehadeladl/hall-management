"use client";

import {
  Breadcrumb,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Tag,
  message,
  Row,
  Col,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const { TextArea } = Input;

export default function BookingDayPage() {
  const params = useParams();

  const [user, setUser] = useState(null);

  // كل الحجوزات لهذا اليوم مرتبة تصاعديًا
  const [allBookings, setAllBookings] = useState([]);
  const [hall, setHall] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openBooking, setOpenBooking] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();

  const [openCancel, setOpenCancel] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelForm] = Form.useForm();

  // =====================
  // تحميل البيانات
  // =====================

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const [hallRes, bookingsRes, meRes] = await Promise.all([
        fetch(`/api/halls/${params.hallId}`),

        fetch("/api/bookings/history-by-date", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hallId: params.hallId,
            date: params.date,
          }),
        }),

        fetch("/api/me"),
      ]);

      const hallData = await hallRes.json();
      const bookingsData = await bookingsRes.json();
      const meData = await meRes.json();

      setHall(hallData);

      setAllBookings(Array.isArray(bookingsData) ? bookingsData : []);

      setUser(meData);
    } catch {
      message.error("حدث خطأ أثناء التحميل");
    } finally {
      setLoading(false);
    }
  }

  // =====================
  // إضافة حجز
  // =====================

  const handleBooking = async (values) => {
    try {
      setSaveLoading(true);

      const meRes = await fetch("/api/me");
      const me = await meRes.json();

      const apiUrl =
        me.role === "EMPLOYEE" ? "/api/booking-requests" : "/api/bookings";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          hallId: params.hallId,
          bookingDate: params.date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message);
        return;
      }
      console.log("ROLE =", me.role);
      if (me.role === "EMPLOYEE") {
        message.success("تم إرسال طلب الحجز للإدارة للمراجعة");
      } else {
        message.success("تم تسجيل الحجز بنجاح");
      }

      setOpenBooking(false);
      form.resetFields();
      loadPage();
    } finally {
      setSaveLoading(false);
    }
  };

  // =====================
  // إلغاء حجز
  // =====================

  const handleCancelBooking = async (values) => {
    try {
      setCancelLoading(true);

      if (user?.role === "EMPLOYEE") {
        const res = await fetch("/api/cancel-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: activeBooking.id,

            refundAmount: values.refundAmount,

            reason: values.reason,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          message.error(data.message);
          return;
        }

        message.success("تم إرسال طلب الإلغاء للإدارة للمراجعة");
      } else {
        const res = await fetch(`/api/bookings/cancel/${activeBooking.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await res.json();

        if (!res.ok) {
          message.error(data.message);
          return;
        }

        message.success("تم إلغاء الحجز");
      }

      setOpenCancel(false);
      cancelForm.resetFields();

      loadPage();
    } catch (error) {
      console.error(error);

      message.error("حدث خطأ أثناء تنفيذ العملية");
    } finally {
      setCancelLoading(false);
    }
  };

  // =====================
  // منطق العرض
  // =====================

  // الحجز الأخير هو اللي نعرضه (active أو cancelled)
  const latestBooking =
    allBookings.length > 0 ? allBookings[allBookings.length - 1] : null;

  // الحجز النشط هو الأخير لو لم يُلغَ
  const activeBooking =
    latestBooking?.status === "ACTIVE" ? latestBooking : null;

  // سجل النشاطات من كل الحجوزات
  const activities = [];
  allBookings.forEach((item) => {
    activities.push({
      action: "تم إنشاء الحجز",
      user: item.createdBy?.username,
      date: item.createdAt,
    });
    if (item.cancellation) {
      activities.push({
        action: "تم إلغاء الحجز",
        user: item.cancellation?.cancelledBy?.username,
        date: item.cancellation?.cancelledAt,
      });
    }
  });
  activities.sort((a, b) => new Date(a.date) - new Date(b.date));

  // =====================
  // الرندر
  // =====================

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
          {
            title: (
              <Link href={`/dashboard/halls/${params.hallId}`}>
                {hall?.name}
              </Link>
            ),
          },
          { title: params.date },
        ]}
      />
      <div className="wrapperHalls">
        {/* ===== حالة: لا يوجد أي حجز ===== */}
        {allBookings.length === 0 && (
          <Card>
            <Space direction="vertical" size="large">
              <h2>لا يوجد حجز لهذا اليوم</h2>
              <Button
                className="butDef"
                icon={<PlusOutlined />}
                onClick={() => setOpenBooking(true)}
              >
                {user?.role === "EMPLOYEE" ? "طلب حجز" : "إضافة حجز"}
              </Button>
            </Space>
          </Card>
        )}

        {/* ===== حالة: يوجد حجز (نشط أو ملغي) ===== */}
        {latestBooking && (
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {/* الحالة */}
              {activeBooking ? (
                <Tag color="green">محجوز</Tag>
              ) : (
                <Tag color="red">تم إلغاء الحجز</Tag>
              )}

              {/* زر الإلغاء لو نشط */}
              {activeBooking && (
                <Button danger onClick={() => setOpenCancel(true)}>
                  {user?.role === "EMPLOYEE"
                    ? "طلب إلغاء الحجز"
                    : "إلغاء الحجز"}
                </Button>
              )}

              {/* بيانات الحجز */}
              <Descriptions bordered column={1}>
                <Descriptions.Item label="اسم العريس">
                  {latestBooking.groomName}
                </Descriptions.Item>
                <Descriptions.Item label="اسم العروسة">
                  {latestBooking.brideName}
                </Descriptions.Item>
                <Descriptions.Item label="اسم الحاجز">
                  {latestBooking.customerName}
                </Descriptions.Item>
                <Descriptions.Item label="رقم الهاتف">
                  {latestBooking.phone}
                </Descriptions.Item>
                <Descriptions.Item label="العربون">
                  {latestBooking.depositAmount} جنيه
                </Descriptions.Item>
                <Descriptions.Item label="المبلغ الكلي">
                  {latestBooking.totalAmount} جنيه
                </Descriptions.Item>
                <Descriptions.Item label="المتبقي">
                  {Number(latestBooking.totalAmount) -
                    Number(latestBooking.depositAmount)}{" "}
                  جنيه
                </Descriptions.Item>
                {latestBooking.notes && (
                  <Descriptions.Item label="الاتفاقات">
                    {latestBooking.notes}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="تم الحجز بواسطة">
                  {latestBooking.createdBy?.username}
                </Descriptions.Item>
                <Descriptions.Item label="تاريخ إنشاء الحجز">
                  {new Date(latestBooking.createdAt).toLocaleString("ar-EG")}
                </Descriptions.Item>
              </Descriptions>

              {/* بيانات الإلغاء لو ملغي */}
              {latestBooking.cancellation && (
                <Card title="بيانات الإلغاء">
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="المبلغ المسترد">
                      {latestBooking.cancellation.refundAmount} جنيه
                    </Descriptions.Item>
                    <Descriptions.Item label="سبب الإلغاء">
                      {latestBooking.cancellation.reason}
                    </Descriptions.Item>
                    <Descriptions.Item label="تم الإلغاء بواسطة">
                      {latestBooking.cancellation.cancelledBy?.username}
                    </Descriptions.Item>
                    <Descriptions.Item label="تاريخ الإلغاء">
                      {new Date(
                        latestBooking.cancellation.cancelledAt,
                      ).toLocaleString("ar-EG")}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              )}

              {/* سجل النشاطات */}
              {activities.length > 0 && (
                <Card title="سجل النشاطات">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #eee", padding: 10 }}>
                          العملية
                        </th>
                        <th style={{ border: "1px solid #eee", padding: 10 }}>
                          بواسطة
                        </th>
                        <th style={{ border: "1px solid #eee", padding: 10 }}>
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, index) => (
                        <tr key={index}>
                          <td style={{ border: "1px solid #eee", padding: 10 }}>
                            {activity.action}
                          </td>
                          <td style={{ border: "1px solid #eee", padding: 10 }}>
                            {activity.user}
                          </td>
                          <td style={{ border: "1px solid #eee", padding: 10 }}>
                            {new Date(activity.date).toLocaleString("ar-EG")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              {/* زر إعادة الحجز لو ملغي */}
              {!activeBooking && (
                <Button type="primary" onClick={() => setOpenBooking(true)}>
                  {user?.role === "EMPLOYEE"
                    ? "طلب إعادة الحجز"
                    : "إعادة الحجز"}
                </Button>
              )}
            </Space>
          </Card>
        )}

        {/* ===== Modal: إضافة / إعادة حجز ===== */}
        <Modal
          title={user?.role === "EMPLOYEE" ? "طلب   إضافة حجز" : " إضافة حجز"}
          open={openBooking}
          footer={null}
          onCancel={() => setOpenBooking(false)}
        >
          <Form form={form} layout="vertical" onFinish={handleBooking}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="اسم العريس"
                  name="groomName"
                  rules={[
                    {
                      required: true,
                      message: "أدخل اسم العريس",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="اسم العروسة"
                  name="brideName"
                  rules={[
                    {
                      required: true,
                      message: "أدخل اسم العروسة",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="اسم الحاجز"
                  name="customerName"
                  rules={[
                    {
                      required: true,
                      message: "أدخل اسم الحاجز",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="رقم الهاتف" name="phone">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="العربون"
                  name="depositAmount"
                  rules={[
                    {
                      required: true,
                      message: "أدخل العربون",
                    },
                  ]}
                >
                  <InputNumber
                    style={{
                      width: "100%",
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="المبلغ الكلي"
                  name="totalAmount"
                  rules={[
                    {
                      required: true,
                      message: "أدخل المبلغ الكلي",
                    },
                  ]}
                >
                  <InputNumber
                    style={{
                      width: "100%",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="الاتفاقات" name="notes">
              <TextArea rows={4} />
            </Form.Item>

            <Button
              block
              className="butDef"
              htmlType="submit"
              loading={saveLoading}
            >
              {user?.role === "EMPLOYEE" ? "طلب   حفظ الحجز" : " حفظ الحجز"}
            </Button>
          </Form>
        </Modal>

        {/* ===== Modal: إلغاء حجز ===== */}
        <Modal
          title={
            user?.role === "EMPLOYEE" ? "طلب   إلغاء الحجز" : "  إلغاء الحجز"
          }
          open={openCancel}
          footer={null}
          onCancel={() => setOpenCancel(false)}
        >
          <Form
            layout="vertical"
            form={cancelForm}
            onFinish={handleCancelBooking}
          >
            <Form.Item
              label="المبلغ المسترد"
              name="refundAmount"
              rules={[{ required: true, message: "أدخل المبلغ المسترد" }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="سبب الإلغاء"
              name="reason"
              rules={[{ required: true, message: "أدخل سبب الإلغاء" }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Button danger block htmlType="submit" loading={cancelLoading}>
              {user?.role === "EMPLOYEE"
                ? "طلب  تأكيد الإلغاء"
                : " تأكيد الإلغاء"}
            </Button>
          </Form>
        </Modal>
      </div>
    </>
  );
}
