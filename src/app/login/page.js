"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message);
        return;
      }

      message.success("تم تسجيل الدخول بنجاح");

      // ✅ الـ redirect بناءً على الـ role اللي رجع من الـ API
      if (data.role === "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard/halls");
      }
    } catch {
      message.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <Card style={{ width: 400 }}>
        <Title level={3}>تسجيل الدخول</Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="اسم المستخدم"
            name="username"
            rules={[{ required: true, message: "من فضلك أدخل اسم المستخدم" }]}
          >
            <Input className="input" />
          </Form.Item>

          <Form.Item
            label="كلمة المرور"
            name="password"
            rules={[{ required: true, message: "من فضلك أدخل كلمة المرور" }]}
          >
            <Input.Password />
          </Form.Item>

          <Button className="butDef" htmlType="submit" block loading={loading}>
            دخول
          </Button>
        </Form>
      </Card>
    </div>
  );
}
