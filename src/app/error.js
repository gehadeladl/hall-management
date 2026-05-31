// app/error.jsx
"use client";
import { Button, Result } from "antd";

export default function Error({ reset }) {
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
        status="500"
        title="500"
        subTitle="حصل خطأ غير متوقع"
        extra={
          <Button className="butDef" onClick={reset}>
            حاول تاني
          </Button>
        }
      />
    </div>
  );
}
