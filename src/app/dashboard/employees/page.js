"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Checkbox,
  Spin,
  Breadcrumb,
  Select,
} from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

export default function EmployeesPage() {
  // =============================
  // State
  // =============================

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // modals
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openChangePass, setOpenChangePass] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);

  // loading states per action
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignModalLoading, setAssignModalLoading] = useState(false);

  // selected user for edit/delete/assign
  const [selectedUser, setSelectedUser] = useState(null);

  // halls for assign modal
  const [halls, setHalls] = useState([]);
  const [selectedHalls, setSelectedHalls] = useState([]);

  const [isMobile, setIsMobile] = useState(false);

  // forms
  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();
  const [formPassword] = Form.useForm();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // ✅ import واحد بس بدل الـ import المكرر اللي كان موجود
  const router = useRouter();

  // =============================
  // حماية الصفحة — client-side guard
  // (الحماية الحقيقية في middleware.ts والـ API)
  // =============================

  useEffect(() => {
    if (currentUser && currentUser.role !== "SUPER_ADMIN") {
      router.replace("/dashboard/halls");
    }
  }, [currentUser, router]);

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
  // تحميل البيانات الأولي
  // =============================

  async function loadInitialData() {
    try {
      setLoading(true);

      const meRes = await fetch("/api/me");

      // ✅ لو الـ API رجع 401 أو 403 — مش بس null
      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const me = await meRes.json();

      // ✅ تحقق إن الداتا موجودة فعلاً
      if (!me || !me.id) {
        router.replace("/login");
        return;
      }

      setCurrentUser(me);

      if (me.role !== "SUPER_ADMIN") {
        router.replace("/dashboard/halls");
        return;
      }

      setAuthorized(true);

      const usersRes = await fetch("/api/users");

      if (!usersRes.ok) {
        message.error("حدث خطأ أثناء تحميل قائمة الموظفين");
        return;
      }

      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch {
      message.error("حدث خطأ أثناء تحميل البيانات");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // =============================
  // إعادة تحميل قائمة الموظفين
  // ✅ أضفنا error handling
  // =============================

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        message.error("حدث خطأ أثناء تحديث القائمة");
        return;
      }
      const data = await res.json();
      setUsers(data);
    } catch {
      message.error("حدث خطأ أثناء تحديث القائمة");
    }
  };

  // =============================
  // إضافة موظف
  // =============================

  const handleAdd = async (values) => {
    // ✅ التحقق من تطابق كلمتي المرور على الفرونت
    if (values.password !== values.confirmPassword) {
      message.error("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setAddLoading(true);

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role: values.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data?.message || "حدث خطأ أثناء الإضافة");
        return;
      }

      message.success("تم إضافة الموظف بنجاح");
      setOpenAdd(false);
      formAdd.resetFields();
      fetchUsers();
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setAddLoading(false);
    }
  };

  // =============================
  // حذف موظف
  // =============================

  const handleDelete = (id) => {
    Modal.confirm({
      title: "تأكيد الحذف",
      content: "هل أنت متأكد أنك تريد حذف هذا الموظف؟",
      okText: "حذف",
      cancelText: "إلغاء",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
          const data = await res.json();

          if (!res.ok) {
            message.error(data?.message || "حدث خطأ");
            return;
          }

          message.success("تم الحذف بنجاح");
          fetchUsers();
        } catch {
          message.error("حدث خطأ في الاتصال بالسيرفر");
        }
      },
    });
  };

  // =============================
  // فتح مودال التعديل
  // =============================

  const openEditModal = (record) => {
    setSelectedUser(record);
    formEdit.setFieldsValue({ username: record.username, password: "" });
    setOpenEdit(true);
  };

  // =============================
  // تعديل موظف
  // =============================

  const handleEdit = async (values) => {
    try {
      setEditLoading(true);

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data?.message || "حدث خطأ");
        return;
      }

      message.success("تم التعديل بنجاح");
      setOpenEdit(false);
      formEdit.resetFields();
      fetchUsers();
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setEditLoading(false);
    }
  };

  // =============================
  // تغيير كلمة المرور (للمستخدم الحالي)
  // =============================

  const handleChangePassword = async (values) => {
    // ✅ التحقق من تطابق كلمتي المرور الجديدة
    if (values.newPassword !== values.confirmNewPassword) {
      message.error("كلمتا المرور الجديدة غير متطابقتين");
      return;
    }

    try {
      setChangePassLoading(true);

      const res = await fetch("/api/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data?.message || "حدث خطأ");
        return;
      }

      message.success("تم تغيير كلمة المرور بنجاح");
      setOpenChangePass(false);
      formPassword.resetFields();
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setChangePassLoading(false);
    }
  };

  // =============================
  // فتح مودال تعيين القاعات
  // =============================

  const openAssignModal = async (user) => {
    try {
      setSelectedUser(user);
      setOpenAssign(true);
      setAssignModalLoading(true);

      const [hallsRes, assignRes] = await Promise.all([
        fetch("/api/halls/all"),
        fetch(`/api/users/${user.id}/assign-halls`),
      ]);

      if (!hallsRes.ok || !assignRes.ok) {
        message.error("حدث خطأ أثناء تحميل القاعات");
        setOpenAssign(false);
        return;
      }

      const [hallsData, assigned] = await Promise.all([
        hallsRes.json(),
        assignRes.json(),
      ]);

      setHalls(hallsData);
      setSelectedHalls(assigned);
    } catch {
      message.error("حدث خطأ أثناء تحميل القاعات");
      setOpenAssign(false);
    } finally {
      setAssignModalLoading(false);
    }
  };

  // =============================
  // حفظ تعيين القاعات
  // =============================

  const handleAssign = async () => {
    try {
      setAssignLoading(true);

      const res = await fetch(`/api/users/${selectedUser.id}/assign-halls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hallIds: selectedHalls }),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message);
        return;
      }

      message.success("تم التعيين بنجاح");
      setOpenAssign(false);
    } catch {
      message.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setAssignLoading(false);
    }
  };

  // =============================
  // أزرار العمليات
  // =============================

  const renderActions = (record) => {
    if (!isSuperAdmin || record.role === "SUPER_ADMIN") return null;
    return (
      <Space wrap>
        <Button
          type="primary"
          size="small"
          onClick={() => openEditModal(record)}
        >
          تعديل
        </Button>
        <Button size="small" onClick={() => openAssignModal(record)}>
          تعيين قاعات
        </Button>
        <Button danger size="small" onClick={() => handleDelete(record.id)}>
          حذف
        </Button>
      </Space>
    );
  };

  // =============================
  // أعمدة الجدول
  // =============================

  const columns = [
    {
      title: "اسم المستخدم",
      dataIndex: "username",
    },
    {
      title: "الدور",
      dataIndex: "role",
      render: (role) => {
        if (role === "SUPER_ADMIN") return "سوبر أدمن";
        if (role === "ADMIN") return "أدمن";
        return "موظف";
      },
    },
    ...(!isMobile
      ? [
          {
            title: "العمليات",
            render: (_, record) => renderActions(record),
          },
        ]
      : []),
  ];

  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === "SUPER_ADMIN" && b.role !== "SUPER_ADMIN") return -1;
    if (a.role !== "SUPER_ADMIN" && b.role === "SUPER_ADMIN") return 1;
    return 0;
  });

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

  if (!authorized) {
    return null;
  }

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[{ title: "الموظفين" }]}
      />

      {isSuperAdmin && (
        <div className="wrapperHalls">
          <Space style={{ marginBottom: 16 }}>
            <Button className="butDef" onClick={() => setOpenAdd(true)}>
              إضافة موظف
            </Button>
            <Button onClick={() => setOpenChangePass(true)}>
              تغيير كلمة المرور
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={sortedUsers}
            rowKey="id"
            loading={loading}
            expandable={
              isMobile && isSuperAdmin
                ? {
                    expandedRowRender: (record) =>
                      record.role !== "SUPER_ADMIN" ? (
                        <div style={{ padding: "8px 0" }}>
                          {renderActions(record)}
                        </div>
                      ) : null,
                    rowExpandable: (record) =>
                      isSuperAdmin && record.role !== "SUPER_ADMIN",
                    expandIcon: ({ expanded, onExpand, record }) =>
                      record.role !== "SUPER_ADMIN" ? (
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
                      ) : null,
                  }
                : undefined
            }
          />

          {/* ===== Modal: إضافة موظف ===== */}
          <Modal
            title="إضافة موظف"
            open={openAdd}
            footer={null}
            onCancel={() => {
              setOpenAdd(false);
              formAdd.resetFields();
            }}
          >
            <Form form={formAdd} layout="vertical" onFinish={handleAdd}>
              <Form.Item
                label="اسم المستخدم"
                name="username"
                rules={[{ required: true, message: "أدخل اسم المستخدم" }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item
                label="كلمة المرور"
                name="password"
                rules={[
                  { required: true, message: "أدخل كلمة المرور" },
                  { min: 8, message: "كلمة المرور لازم تكون 8 حروف على الأقل" },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              {/* ✅ حقل تأكيد كلمة المرور */}
              <Form.Item
                label="تأكيد كلمة المرور"
                name="confirmPassword"
                rules={[{ required: true, message: "أكد كلمة المرور" }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label="نوع الحساب"
                name="role"
                initialValue="EMPLOYEE"
                rules={[{ required: true, message: "اختر نوع الحساب" }]}
              >
                <Select
                  options={[
                    { label: "أدمن", value: "ADMIN" },
                    { label: "موظف", value: "EMPLOYEE" },
                  ]}
                />
              </Form.Item>
              <Button
                className="butDef"
                htmlType="submit"
                block
                loading={addLoading}
              >
                إضافة
              </Button>
            </Form>
          </Modal>

          {/* ===== Modal: تعديل موظف ===== */}
          <Modal
            title="تعديل موظف"
            open={openEdit}
            footer={null}
            onCancel={() => {
              setOpenEdit(false);
              formEdit.resetFields();
            }}
          >
            <Form form={formEdit} layout="vertical" onFinish={handleEdit}>
              <Form.Item
                label="اسم المستخدم"
                name="username"
                rules={[{ required: true, message: "أدخل اسم المستخدم" }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item
                label="كلمة المرور الجديدة"
                name="password"
                rules={[
                  { min: 8, message: "كلمة المرور لازم تكون 8 حروف على الأقل" },
                ]}
              >
                <Input.Password
                  placeholder="اتركها فارغة لو مش عايز تغيرها"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Button
                className="butDef"
                htmlType="submit"
                block
                loading={editLoading}
              >
                حفظ التعديلات
              </Button>
            </Form>
          </Modal>

          {/* ===== Modal: تغيير كلمة المرور ===== */}
          <Modal
            title="تغيير كلمة المرور"
            open={openChangePass}
            footer={null}
            onCancel={() => {
              setOpenChangePass(false);
              formPassword.resetFields();
            }}
          >
            <Form
              form={formPassword}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                label="كلمة المرور الحالية"
                name="oldPassword"
                rules={[
                  { required: true, message: "أدخل كلمة المرور الحالية" },
                ]}
              >
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                label="كلمة المرور الجديدة"
                name="newPassword"
                rules={[
                  { required: true, message: "أدخل كلمة المرور الجديدة" },
                  { min: 8, message: "كلمة المرور لازم تكون 8 حروف على الأقل" },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              {/* ✅ حقل تأكيد كلمة المرور الجديدة */}
              <Form.Item
                label="تأكيد كلمة المرور الجديدة"
                name="confirmNewPassword"
                rules={[{ required: true, message: "أكد كلمة المرور الجديدة" }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Button
                className="butDef"
                htmlType="submit"
                block
                loading={changePassLoading}
              >
                تغيير كلمة المرور
              </Button>
            </Form>
          </Modal>

          {/* ===== Modal: تعيين القاعات ===== */}
          <Modal
            title={`تعيين القاعات — ${selectedUser?.username}`}
            open={openAssign}
            okText="حفظ"
            cancelText="إلغاء"
            onOk={handleAssign}
            onCancel={() => setOpenAssign(false)}
            confirmLoading={assignLoading}
          >
            {assignModalLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: 40,
                }}
              >
                <Spin />
              </div>
            ) : (
              <Checkbox.Group
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
                value={selectedHalls}
                onChange={(value) => setSelectedHalls(value)}
              >
                {halls.map((hall) => (
                  <Checkbox key={hall.id} value={hall.id}>
                    {hall.name}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            )}
          </Modal>
        </div>
      )}
    </div>
  );
}
