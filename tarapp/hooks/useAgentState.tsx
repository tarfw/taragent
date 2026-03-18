import React, { createContext, useContext, useState } from "react";
import { createStateApi, updateStateApi, deleteStateApi } from "../src/api/client";

type AgentState = {
  loading: boolean;
  result: any;
  setLoading: (v: boolean) => void;
  setResult: (v: any) => void;
  createState: (ucode: string, title: string, payload: any) => Promise<void>;
  updateState: (ucode: string, title: string, payload: any) => Promise<void>;
  deleteState: (ucode: string) => Promise<void>;
};

const AgentContext = createContext<AgentState>({
  loading: false,
  result: null,
  setLoading: () => {},
  setResult: () => {},
  createState: async () => {},
  updateState: async () => {},
  deleteState: async () => {},
});

const SCOPE = "shop:main";

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // All state CRUD goes directly to /api/state — no channels, no interpreter
  const createState = async (ucode: string, title: string, payload: any) => {
    setLoading(true);
    try {
      const res = await createStateApi(ucode, title, payload, SCOPE);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (ucode: string, title: string, payload: any) => {
    setLoading(true);
    try {
      const res = await updateStateApi(ucode, title, payload, SCOPE);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const deleteState = async (ucode: string) => {
    setLoading(true);
    try {
      const res = await deleteStateApi(ucode, SCOPE);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentContext.Provider
      value={{
        loading,
        result,
        setLoading,
        setResult,
        createState,
        updateState,
        deleteState,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export const useAgentState = () => useContext(AgentContext);
