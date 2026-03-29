import React, { useState, useEffect } from "react";

interface StatusTimerProps {
  lastChange: string;
}

const TemporizadorEstado = ({ lastChange }: StatusTimerProps) => {
  const [display, setDisplay] = useState("0s");

  useEffect(() => {
    const calculate = () => {
      if (!lastChange) return "0s";
      const diff = Math.floor((new Date().getTime() - new Date(lastChange).getTime()) / 1000);
      if (diff < 60) return `${diff}s`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
      return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    };

    setDisplay(calculate());
    const timer = setInterval(() => setDisplay(calculate()), 1000);
    return () => clearInterval(timer);
  }, [lastChange]);

  return <span>{display}</span>;
};

export default TemporizadorEstado;
