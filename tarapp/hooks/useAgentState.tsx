import React, { createContext, useContext, useState } from 'react';

type AgentState = {
  loading: boolean;
  result: any;
  setLoading: (v: boolean) => void;
  setResult: (v: any) => void;
};

const AgentContext = createContext<AgentState>({
  loading: false,
  result: null,
  setLoading: () => {},
  setResult: () => {},
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  return (
    <AgentContext.Provider value={{ loading, result, setLoading, setResult }}>
      {children}
    </AgentContext.Provider>
  );
}

export const useAgentState = () => useContext(AgentContext);
