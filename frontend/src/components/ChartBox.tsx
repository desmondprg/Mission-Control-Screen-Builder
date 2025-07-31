import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from "recharts";
import { useStore } from "../store/useStore";


const formatTimestamp = (tick: string) => {
  const date = new Date(tick);
  return `${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date
    .getDate()
    .toString()
    .padStart(2, "0")}/${date.getFullYear()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
};


export function ChartBox() {
  const [data, setData] = useState<any[]>([]);
  const { timeRange, tempThreshold, unit, calibration, selectedSignals } = useStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/telemetry");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch telemetry data", err);
      }
  };

  fetchData(); // initial load
  const interval = setInterval(fetchData, 5000); // poll every 5 seconds

  return () => clearInterval(interval); // cleanup
}, []);

  const convertTemp = (t: number) => {
    let adjusted = t + calibration;
    return unit === "C" ? ((adjusted - 32) * 5) / 9 : adjusted;
  };

  const convertValue = (sig: string, val: number) => {
    if (sig === "temp") return convertTemp(val);
    return val; // Pressure and voltage unchanged for now
  };

  const filtered = data
    .filter((d) => new Date(d.time).getTime() >= Date.now() - timeRange * 60000)
    .map((d) => {
      const newObj: any = { time: d.time };
      for (const sig of ["temp", "pressure", "voltage"]) {
        newObj[sig] = convertValue(sig, d[sig]);
      }
      return newObj;
    });

  const threshold = convertTemp(tempThreshold);
  const colors: Record<string, string> = {
    temp: "#8884d8",
    pressure: "#82ca9d",
    voltage: "#ff7300"
  };

  return (
    <div className="p-4 h-full w-full flex flex-col justify-center">
      <h3 className="font-bold mb-2">Historical Telemetry</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={formatTimestamp} tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          {selectedSignals.map((sig) => (
            <Line key={sig} type="monotone" dataKey={sig} stroke={colors[sig]} dot={false} />
          ))}
          <ReferenceLine y={threshold} stroke="red" strokeDasharray="3 3" label="Temp Threshold" />
          <Brush dataKey="time" height={30} stroke="#8884d8" tickFormatter={formatTimestamp} />
        
        <ReferenceLine
          y={tempThreshold.high}
          stroke="red"
          strokeDasharray="3 3"
          label={{ value: "High Limit", position: "top", fill: "red" }}
        />
        <ReferenceLine
          y={tempThreshold.low}
          stroke="blue"
          strokeDasharray="3 3"
          label={{ value: "Low Limit", position: "bottom", fill: "blue" }}
        />

      </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
