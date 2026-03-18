import React, { createContext, useContext, useState } from "react";

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

import { sendCommerceAction } from "../src/api/client";

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const userId = "mobile_user_01";
  const scope = "shop:main";

  const createState = async (ucode: string, title: string, payload: any) => {
    setLoading(true);
    try {
      const res = await sendCommerceAction({
        channel: "app_agent",
        userId,
        scope,
        action: "CREATE",
        data: { ucode, title, payload },
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const updateState = async (ucode: string, title: string, payload: any) => {
    setLoading(true);
    try {
      const res = await sendCommerceAction({
        channel: "app_agent",
        userId,
        scope,
        action: "UPDATE",
        data: { ucode, title, payload },
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const deleteState = async (ucode: string) => {
    setLoading(true);
    try {
      const res = await sendCommerceAction({
        channel: "app_agent",
        userId,
        scope,
        action: "DELETE",
        data: { ucode },
      });
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
