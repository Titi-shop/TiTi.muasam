"use client";

import { useEffect } from "react";

export default function AlertProvider() {
  useEffect(() => {
    const oldAlert = window.alert;

    const showTopNotification = (message: string) => {
      const toast = document.createElement("div");

      toast.textContent = message;

      Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#16a34a",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "600",
        zIndex: "99999",
        boxShadow: "0 10px 25px rgba(0,0,0,.15)",
        transition: "all .3s ease",
        maxWidth: "90vw",
        textAlign: "center",
      } satisfies Partial<CSSStyleDeclaration>);

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 4000);
    };

    window.alert = (message?: unknown): void => {
      const text =
        typeof message === "string"
          ? message
          : "Something went wrong";

      showTopNotification(text);
    };

    const checkGlobalAlert = (): void => {
      const message = localStorage.getItem(
        "global_success_alert"
      );

      if (!message) return;

      localStorage.removeItem(
        "global_success_alert"
      );

      showTopNotification(message);
    };

    checkGlobalAlert();

    window.addEventListener(
      "focus",
      checkGlobalAlert
    );

    window.addEventListener(
      "storage",
      checkGlobalAlert
    );

    return () => {
      window.removeEventListener(
        "focus",
        checkGlobalAlert
      );

      window.removeEventListener(
        "storage",
        checkGlobalAlert
      );

      window.alert = oldAlert;
    };
  }, []);

  return null;
}
