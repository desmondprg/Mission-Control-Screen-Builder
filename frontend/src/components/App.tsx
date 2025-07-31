import React from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";

export default function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto p-4">
        <Dashboard />
      </div>
    </div>
  );
}
