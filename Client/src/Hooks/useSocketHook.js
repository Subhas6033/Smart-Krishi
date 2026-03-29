import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

let globalSocket = null;

export function useSocket() {
  // ── If the socket already exists (e.g. navigating between pages),
  //    initialise state with it immediately — no async wait needed.
  const [socket, setSocket] = useState(() => globalSocket);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!globalSocket) {
      globalSocket = io(import.meta.env.VITE_BACKEND_URL || "", {
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      globalSocket.on("connect", () => {
        console.log("[Socket] Connected:", globalSocket.id);
      });

      globalSocket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });

      globalSocket.on("connect_error", (err) => {
        console.error("[Socket] Error:", err.message);
      });
    }

    // Only triggers a re-render on the very first mount when
    // globalSocket was null — all subsequent calls skip this.
    setSocket(globalSocket);

    return () => {
      // Don't disconnect — share socket across pages
    };
  }, []);

  return socket;
}
