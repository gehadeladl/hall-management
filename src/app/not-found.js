// app/not-found.jsx
import Link from "next/link";
import { Button, Result } from "antd";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="الصفحة اللي بتدور عليها مش موجودة"
        extra={
          <Link href="/dashboard/halls">
            <Button className="butDef">ارجع للرئيسية</Button>
          </Link>
        }
      />
    </div>
  );
}
