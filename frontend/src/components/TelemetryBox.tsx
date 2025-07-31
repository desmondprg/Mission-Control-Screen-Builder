import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useStore } from "../store/useStore";

export default function TelemetryBox() {
  const [telemetry, setTelemetry] = useState({ temp: 0, status: "", time: "" });
  const { staleTimeout, tempThreshold, unit, calibration } = useStore();

  const { lastMessage } = useWebSocket("ws://localhost:8080/ws/telemetry");
  useEffect(() => { if (lastMessage) setTelemetry(JSON.parse(lastMessage.data)); }, [lastMessage]);

  const isStale = () => !telemetry.time || (Date.now() - new Date(telemetry.time).getTime()) / 1000 > staleTimeout;

  const convertTemp = (t: number) => {
    let adjusted = t + calibration;
    return unit === "C" ? ((adjusted - 32) * 5) / 9 : adjusted;
  };

  const displayTemp = convertTemp(telemetry.temp);
  const threshold = convertTemp(tempThreshold);
  const isOver = displayTemp > threshold;

  return (
    <div className="p-4 h-full w-full flex flex-col justify-center">
      <h3 className="font-bold">Telemetry</h3>
      <p>Temp: <span className={isOver ? "text-red-600" : ""}>{displayTemp.toFixed(2)}°{unit}</span></p>
      <p>Status: {telemetry.status}</p>
      <p className={isStale() ? "text-red-500" : "text-green-600"}>{isStale() ? "Stale" : "Live"}</p>
    </div>
  );
}
