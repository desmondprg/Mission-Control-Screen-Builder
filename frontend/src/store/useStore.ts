import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

interface ComponentItem {
  id: string;
  type: string;
  props?: Record<string, any>;
}

interface ConfigState {
  staleTimeout: number;
  tempThreshold: number;
  timeRange: number;
  layout: any[];
  components: ComponentItem[];
  unit: "F" | "C";
  calibration: number;
  selectedSignals: string[];
  setStaleTimeout: (v: number) => void;
  setTempThreshold: (v: number) => void;
  setTimeRange: (v: number) => void;
  setLayout: (layout: any[]) => void;
  setComponents: (components: ComponentItem[]) => void;
  addComponent: (type: string) => void;
  removeComponent: (id: string) => void;
  resetSettings: () => void;
  setUnit: (u: "F" | "C") => void;
  setCalibration: (v: number) => void;
  toggleSignal: (signal: string) => void;
  saveScreen: () => void;
  loadScreen: () => void;
}

export const useStore = create<ConfigState>((set, get) => ({
  staleTimeout: 5,
  tempThreshold: 75,
  timeRange: 30,
  layout: [],
  components: [
    { id: "telemetry-1", type: "TelemetryBox" },
    { id: "command-1", type: "CommandBox" },
    { id: "chart-1", type: "ChartBox" }
  ],
  unit: "F",
  calibration: 0,
  selectedSignals: ["temp"],

  setStaleTimeout: (v) => set((s) => ({ ...s, staleTimeout: v })),
  setTempThreshold: (v) => set((s) => ({ ...s, tempThreshold: v })),
  setTimeRange: (v) => set((s) => ({ ...s, timeRange: v })),
  setLayout: (layout) => set((s) => ({ ...s, layout })),
  setComponents: (components) => set((s) => ({ ...s, components })),

  addComponent: (type) =>
    set((s) => ({
      ...s,
      components: [...s.components, { id: uuidv4(), type }],
    })),

  removeComponent: (id) =>
    set((s) => ({
      components: s.components.filter((c) => c.id !== id),
      layout: s.layout.filter((l) => l.i !== id),
    })),

  resetSettings: () =>
    set(() => ({
      staleTimeout: 5,
      tempThreshold: 75,
      timeRange: 30,
      layout: [],
      components: [
        { id: "telemetry-1", type: "TelemetryBox" },
        { id: "command-1", type: "CommandBox" },
        { id: "chart-1", type: "ChartBox" }
      ],
      unit: "F",
      calibration: 0,
      selectedSignals: ["temp"],
    })),

  setUnit: (u) => set((s) => ({ ...s, unit: u })),
  setCalibration: (v) => set((s) => ({ ...s, calibration: v })),
  toggleSignal: (signal) =>
    set((s) => ({
      selectedSignals: s.selectedSignals.includes(signal)
        ? s.selectedSignals.filter((s) => s !== signal)
        : [...s.selectedSignals, signal],
    })),

  saveScreen: () => {},
  loadScreen: () => {},
}));
