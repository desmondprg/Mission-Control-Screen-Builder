import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import { useStore } from "../store/useStore";

const availableComponents = [
  { id: "telemetry", type: "TelemetryBox" },
  { id: "command", type: "CommandBox" },
  { id: "chart", type: "ChartBox" }
];

function DraggableItem({ type }: { type: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "BOX",
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-2 m-1 bg-gray-200 rounded cursor-move ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {type}
    </div>
  );
}

export function Sidebar() {
  const {
    staleTimeout,
    tempThreshold,
    timeRange,
    unit,
    calibration,
    selectedSignals,
    setStaleTimeout,
    setTempThreshold,
    setTimeRange,
    setUnit,
    setCalibration,
    toggleSignal,
    addComponent,
    resetSettings,
    layout,
    components,
    setLayout,
    setComponents,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveLayout = async () => {
    try {
      const data = JSON.stringify({ layout, components }, null, 2);
      const handle = await window.showSaveFilePicker({
        suggestedName: "layout.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (error) {
      console.error("Error saving screen:", error);
      alert("Failed to save screen.");
    }
  };

  const loadLayout = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = JSON.parse(event.target?.result as string);
        if (result.layout && result.components) {
          setLayout(result.layout);
          setComponents(result.components);
        } else {
          alert("Invalid layout file format.");
        }
      } catch (err) {
        console.error("Error parsing file:", err);
        alert("Failed to load layout.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-gray-100 w-64 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold mb-2">Add Component</h2>
        {availableComponents.map((comp) => (
          <DraggableItem key={comp.id} type={comp.type} />
        ))}

        <h2 className="text-lg font-semibold mt-4 mb-2">Telemetry Settings</h2>

        <div className="mb-2">
          <label className="text-sm">Stale Timeout (s):</label>
          <input
            type="number"
            value={staleTimeout}
            onChange={(e) => setStaleTimeout(Number(e.target.value))}
            className="w-full p-1 border rounded"
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Temp Threshold ({unit === "C" ? "°C" : "°F"})
          </label>
          <input
            type="number"
            value={tempThreshold}
            onChange={(e) => setTempThreshold(Number(e.target.value))}
            className="w-full p-1 border rounded"
          />
        </div>

        <div className="mb-2">
          <label className="text-sm">Time Range (min):</label>
          <input
            type="number"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full p-1 border rounded"
          />
        </div>

        <div className="mb-2">
          <label className="text-sm">Unit:</label>
          <select
            value={unit}
            onChange={(e) => {
              const newUnit = e.target.value;
              if (newUnit !== unit) {
                const convert = (t: number) =>
                  newUnit === "C" ? ((t - 32) * 5) / 9 : (t * 9) / 5 + 32;
                setTempThreshold(convert(tempThreshold));
              }
              setUnit(newUnit);
            }}
            className="border p-1 rounded w-full"
          >
            <option value="F">Fahrenheit (°F)</option>
            <option value="C">Celsius (°C)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm">Calibration Offset:</label>
          <input
            type="number"
            value={calibration}
            onChange={(e) => setCalibration(Number(e.target.value))}
            className="w-full p-1 border rounded"
          />
        </div>

        <div className="mt-4 mb-6">
          <label className="block font-semibold mb-1">
            Select Telemetry Signals
          </label>
          {["temp", "pressure", "voltage"].map((sig) => (
            <label key={sig} className="block text-sm">
              <input
                type="checkbox"
                checked={selectedSignals.includes(sig)}
                onChange={() => toggleSignal(sig)}
                className="mr-2"
              />
              {sig.charAt(0).toUpperCase() + sig.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <button
          onClick={saveLayout}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Layout
        </button>
        <button
          onClick={loadLayout}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Load Layout
        </button>
        <button
          onClick={resetSettings}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Reset Settings
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
