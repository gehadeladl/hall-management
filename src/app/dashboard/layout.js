"use client";

import { Layout, Menu, Typography, Button, Drawer } from "antd";
import {
  TeamOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const TABLET_BREAKPOINT = 992;

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname(); // المسار الحالي عشان نعرف أي item محدد

  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // =============================
  // استشعار حجم الشاشة
  // =============================

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth < TABLET_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // =============================
  // تحميل بيانات المستخدم
  // =============================

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  // =============================
  // تسجيل الخروج
  // =============================

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  // =============================
  // تحديد الـ item النشط بناءً على المسار الحالي
  // =============================

  const getSelectedKey = () => {
    if (pathname.startsWith("/dashboard/employees")) return "employees";
    if (pathname.startsWith("/dashboard/halls")) return "halls";
    return "halls";
  };

  // =============================
  // الـ menu items — مشتركة بين السايدبار والدراور
  // =============================

  const menuItems = [
    {
      key: "halls",
      icon: <HomeOutlined />,
      label: "القاعات",
      onClick: () => {
        router.push("/dashboard/halls");
        setDrawerOpen(false);
      },
    },
    // صفحة الموظفين تظهر بس للسوبر أدمن
    ...(user?.role === "SUPER_ADMIN"
      ? [
          {
            key: "employees",
            icon: <TeamOutlined />,
            label: "الموظفين",
            onClick: () => {
              router.push("/dashboard/employees");
              setDrawerOpen(false);
            },
          },
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* ===== السايدبار — يظهر بس على الديسك توب ===== */}
      {!isTablet && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={220}
          collapsedWidth={64}
          style={{ transition: "all 0.2s" }}
        >
          <div
            style={{
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontSize: collapsed ? 0 : 16,
              transition: "font-size 0.2s",
            }}
          >
            {!collapsed && "لوحة التحكم"}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
          />
        </Sider>
      )}

      {/* ===== الدراور — يظهر بس على التابلت والموبايل ===== */}
      {isTablet && (
        <Drawer
          placement="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={220}
          styles={{
            body: { padding: 0, background: "#001529" },
            header: { display: "none" },
          }}
        >
          <div
            style={{
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            لوحة التحكم
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
          />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInline: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() =>
                isTablet ? setDrawerOpen(true) : setCollapsed((c) => !c)
              }
            />
            <Text>{user ? `مرحباً، ${user.username}` : "جاري التحميل..."}</Text>
          </div>

          <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
            تسجيل الخروج
          </Button>
        </Header>

        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}
