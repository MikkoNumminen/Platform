"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";

type Severity = "success" | "error" | "warning" | "info";

interface SnackbarMessage {
  id: number;
  message: string;
  severity: Severity;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({
  showSnackbar: () => {},
});

export function useSnackbar() {
  return useContext(SnackbarContext);
}

let nextId = 0;

interface SnackbarProviderProps {
  children: ReactNode;
  autoHideDuration?: number;
}

export default function SnackbarProvider({
  children,
  autoHideDuration = 4000,
}: SnackbarProviderProps) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const showSnackbar = useCallback((message: string, severity: Severity = "success") => {
    const id = nextId++;
    setMessages((prev) => [...prev, { id, message, severity }]);
  }, []);

  function handleClose(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {messages.map((msg, index) => (
        <Snackbar
          key={msg.id}
          open
          autoHideDuration={autoHideDuration}
          onClose={() => handleClose(msg.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ bottom: `${index * 60 + 24}px !important` }}
        >
          <Alert
            onClose={() => handleClose(msg.id)}
            severity={msg.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {msg.message}
          </Alert>
        </Snackbar>
      ))}
    </SnackbarContext.Provider>
  );
}
