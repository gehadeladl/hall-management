"use client";

import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Spin,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HallsPage() {
  const router = useRouter();

  // =========================
  // البيانات
  // =========================

  const [halls, setHalls] = useState([]);
  const [user, setUser] = useState(null);

  // =========================
  // اللودينج
  // =========================

  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // =========================
  // المودال
  // =========================

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [selectedHall, setSelectedHall] = useState(null);

  // =========================
  // البحث
  // =========================

  const [search, setSearch] = useState("");

  // =========================
  // الفورم
  // =========================

  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();

  // =========================
  // تحميل البيانات
  // =========================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [meRes, hallsRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/halls"),
      ]);

      const me = await meRes.json();
      const hallsData = await hallsRes.json();

      setUser(me);
      setHalls(hallsData);
    } catch (error) {
      console.error(error);
      message.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // هل المستخدم سوبر أدمن
  // =========================

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // =========================
  // إضافة قاعة
  // =========================

  const handleAddHall = async (values) => {
    try {
      setAddLoading(true);

      const res = await fetch("/api/halls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || "حدث خطأ");
        return;
      }

      message.success("تم إضافة القاعة بنجاح");

      formAdd.resetFields();
      setOpenAdd(false);

      loadData();
    } finally {
      setAddLoading(false);
    }
  };

  // =========================
  // فتح التعديل
  // =========================

  const openEditModal = (hall) => {
    setSelectedHall(hall);

    formEdit.setFieldsValue({
      name: hall.name,
    });

    setOpenEdit(true);
  };

  // =========================
  // تعديل قاعة
  // =========================

  const handleEditHall = async (values) => {
    try {
      setEditLoading(true);

      const res = await fetch(`/api/halls/${selectedHall.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || "حدث خطأ");
        return;
      }

      message.success("تم تعديل القاعة");

      setOpenEdit(false);

      loadData();
    } finally {
      setEditLoading(false);
    }
  };

  // =========================
  // حذف قاعة
  // =========================

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(id);

      const res = await fetch(`/api/halls/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        message.error(data.message || "حدث خطأ");
        return;
      }

      message.success("تم حذف القاعة");

      loadData();
    } finally {
      setDeleteLoading(null);
    }
  };

  // =========================
  // البحث
  // =========================

  const filteredHalls = useMemo(() => {
    return halls.filter((hall) =>
      hall.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [halls, search]);

  return (
    <>
      <Breadcrumb
        items={[
          {
            title: "القاعات",
          },
        ]}
        style={{
          marginBottom: 20,
        }}
      />

      <div className="wrapperHalls">
        <Space
          style={{
            width: "100%",
            marginBottom: 24,
            justifyContent: "space-between",
          }}
        >
          <Input
            allowClear
            placeholder="ابحث عن قاعة..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              maxWidth: 350,
            }}
          />

          {isSuperAdmin && (
            <Button
              className="butDef"
              icon={<PlusOutlined />}
              onClick={() => setOpenAdd(true)}
            >
              إضافة قاعة
            </Button>
          )}
        </Space>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 100,
            }}
          >
            <Spin size="large" />
          </div>
        ) : filteredHalls.length === 0 ? (
          <Empty description="لا توجد قاعات" />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredHalls.map((hall) => (
              <Col xs={24} sm={12} md={8} lg={8} key={hall.id}>
                <Card
                  hoverable
                  onClick={() => router.push(`/dashboard/halls/${hall.id}`)}
                  style={{
                    borderRadius: 14,
                  }}
                >
                  <h3>{hall.name}</h3>

                  {isSuperAdmin && (
                    <Space
                      className="wrapperBut"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(hall)}
                      >
                        تعديل
                      </Button>

                      <Popconfirm
                        title="حذف القاعة"
                        description="هل أنت متأكد من حذف القاعة؟"
                        okText="نعم"
                        cancelText="إلغاء"
                        onConfirm={() => handleDelete(hall.id)}
                      >
                        <Button
                          danger
                          loading={deleteLoading === hall.id}
                          icon={<DeleteOutlined />}
                        >
                          حذف
                        </Button>
                      </Popconfirm>
                    </Space>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* إضافة قاعة */}

        <Modal
          title="إضافة قاعة"
          open={openAdd}
          footer={null}
          onCancel={() => setOpenAdd(false)}
        >
          <Form layout="vertical" form={formAdd} onFinish={handleAddHall}>
            <Form.Item
              label="اسم القاعة"
              name="name"
              rules={[
                {
                  required: true,
                  message: "أدخل اسم القاعة",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Button
              block
              className="butDef"
              htmlType="submit"
              loading={addLoading}
            >
              إضافة
            </Button>
          </Form>
        </Modal>

        {/* تعديل قاعة */}

        <Modal
          title="تعديل القاعة"
          open={openEdit}
          footer={null}
          onCancel={() => setOpenEdit(false)}
        >
          <Form layout="vertical" form={formEdit} onFinish={handleEditHall}>
            <Form.Item
              label="اسم القاعة"
              name="name"
              rules={[
                {
                  required: true,
                  message: "أدخل اسم القاعة",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Button
              block
              className="butDef"
              htmlType="submit"
              loading={editLoading}
            >
              حفظ التعديلات
            </Button>
          </Form>
        </Modal>
      </div>
    </>
  );
}
