"use client";

import { useEffect, useState } from "react";

export default function PiSigninCallbackPage() {
  const [status, setStatus] = useState("Reading callback...");
  const [token, setToken] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    const hash = window.location.hash;

    console.log("[PI CALLBACK] HASH =", hash);

    if (!hash) {
      setStatus("No callback data.");
      return;
    }

    const params = new URLSearchParams(hash.substring(1));

    const accessToken =
      params.get("access_token") ?? "";
const expectedState =
  sessionStorage.getItem("pi_oauth_state") ?? "";

console.log(
  "[PI CALLBACK] EXPECTED STATE",
  expectedState
);
    const oauthState =
      params.get("state") ?? "";

    console.log(
      "[PI CALLBACK] ACCESS TOKEN",
      accessToken
    );

    console.log(
      "[PI CALLBACK] STATE",
      oauthState
    );

    setToken(accessToken);
    setState(oauthState);
if (oauthState !== expectedState) {
  setStatus("Invalid state.");
  return;
}

sessionStorage.removeItem(
  "pi_oauth_state"
);

if (accessToken) {

  // Lưu token cho OAuth login
  localStorage.setItem(
    "pi_access_token",
    accessToken
  );

  setStatus(
    "Login successful."
  );

  // Cho phép xem token 1 giây
  setTimeout(() => {
    window.location.href =
      "/";
  }, 1000);

  return;
}

setStatus(
  "Access token not found."
);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl p-6 text-center">

        <h1 className="text-3xl font-bold">
          Pi Sign-In Callback
        </h1>

        <p className="mt-4">
          {status}
        </p>

        <div className="mt-6 break-all text-left">

          <p>
            <strong>Access Token:</strong>
          </p>

          <p className="text-sm text-gray-600">
            {token || "(empty)"}
          </p>

          <div className="h-4" />

          <p>
            <strong>State:</strong>
          </p>

          <p className="text-sm text-gray-600">
            {state || "(empty)"}
          </p>

        </div>

      </div>
    </main>
  );
}
