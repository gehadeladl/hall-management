"use client";

import { useEffect, useState } from "react";
import { useEffect as useRedirectEffect } from "react";
import { useRouter as useRedirectRouter } from "next/navigation";
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
} from "antd";

export default function EmployeesPage() {
  // =============================
  // State
  // =============================

  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // استشعار حجم الشاشة — على التاب والموبايل نخفي عمود العمليات وندخله في expandable
  const [isMobile, setIsMobile] = useState(false);

  // forms
  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();
  const [formPassword] = Form.useForm();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // =============================
  // حماية الصفحة — الموظف العادي مينفعش يدخلها
  // =============================

  const protectRouter = useRedirectRouter();

  useRedirectEffect(() => {
    // بعد ما البيانات تتحمل، لو مش super admin → ارجع للقاعات
    if (currentUser && currentUser.role !== "SUPER_ADMIN") {
      protectRouter.replace("/dashboard/halls");
    }
  }, [currentUser]);

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

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [meRes, usersRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/users"),
      ]);

      const [me, usersData] = await Promise.all([
        meRes.json(),
        usersRes.json(),
      ]);

      setCurrentUser(me);
      setUsers(usersData);
    } catch {
      message.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // =============================
  // إعادة تحميل قائمة الموظفين
  // =============================

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  // =============================
  // إضافة موظف
  // =============================

  const handleAdd = async (values) => {
    try {
      setAddLoading(true);

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok) {
          message.error(data?.message || "حدث خطأ");
          return;
        }

        message.success("تم الحذف بنجاح");
        fetchUsers();
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
        body: JSON.stringify(values),
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
    } finally {
      setEditLoading(false);
    }
  };

  // =============================
  // تغيير كلمة المرور (للمستخدم الحالي)
  // =============================

  const handleChangePassword = async (values) => {
    try {
      setChangePassLoading(true);

      const res = await fetch("/api/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data?.message || "حدث خطأ");
        return;
      }

      message.success("تم تغيير كلمة المرور بنجاح");
      setOpenChangePass(false);
      formPassword.resetFields();
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

      const [hallsData, assigned] = await Promise.all([
        hallsRes.json(),
        assignRes.json(),
      ]);

      setHalls(hallsData);
      setSelectedHalls(assigned);
    } catch {
      message.error("حدث خطأ أثناء تحميل القاعات");
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
    } finally {
      setAssignLoading(false);
    }
  };

  // =============================
  // أزرار العمليات — مشتركة بين عمود الجدول والـ expandable
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
  // عمود العمليات يظهر بس على الشاشات الكبيرة (>= 768px)
  // على الموبايل/التاب يتحول للـ expandable
  // =============================

  const columns = [
    {
      title: "اسم المستخدم",
      dataIndex: "username",
    },
    {
      title: "الدور",
      dataIndex: "role",
      render: (role) => (role === "SUPER_ADMIN" ? "مدير" : "موظف"),
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

  // السوبر أدمن يكون أول واحد في القائمة دايماً
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === "SUPER_ADMIN" && b.role !== "SUPER_ADMIN") return -1;
    if (a.role !== "SUPER_ADMIN" && b.role === "SUPER_ADMIN") return 1;
    return 0;
  });

  // =============================
  // الرندر
  // =============================

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 20 }}
        items={[{ title: "الموظفين" }]}
      />
      {isSuperAdmin && (
        <div className="wrapperHalls">
          <Space style={{ marginBottom: 16 }}>
            {isSuperAdmin && (
              <Button className="butDef" onClick={() => setOpenAdd(true)}>
                إضافة موظف
              </Button>
            )}
            {isSuperAdmin && (
              <Button onClick={() => setOpenChangePass(true)}>
                تغيير كلمة المرور
              </Button>
            )}
          </Space>

          <Table
            columns={columns}
            dataSource={sortedUsers}
            rowKey="id"
            loading={loading}
            // على الموبايل/التاب: العمليات تظهر جوه expandable row
            expandable={
              isMobile && isSuperAdmin
                ? {
                    expandedRowRender: (record) =>
                      record.role !== "SUPER_ADMIN" ? (
                        <div style={{ padding: "8px 0" }}>
                          {renderActions(record)}
                        </div>
                      ) : null,
                    // إخفاء زرار الـ expand للسوبر أدمن لأنه مفيش عمليات ليه
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
                          {expanded ? "▲" : "▼"}
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
                <Input />
              </Form.Item>
              <Form.Item
                label="كلمة المرور"
                name="password"
                rules={[{ required: true, message: "أدخل كلمة المرور" }]}
              >
                <Input.Password />
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
                <Input />
              </Form.Item>
              <Form.Item label="كلمة المرور الجديدة" name="password">
                <Input.Password placeholder="اتركها فارغة لو مش عايز تغيرها" />
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
                label="كلمة المرور القديمة"
                name="oldPassword"
                rules={[
                  { required: true, message: "أدخل كلمة المرور القديمة" },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label="كلمة المرور الجديدة"
                name="newPassword"
                rules={[
                  { required: true, message: "أدخل كلمة المرور الجديدة" },
                ]}
              >
                <Input.Password />
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
