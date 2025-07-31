import React from "react";
import GridLayout, { Layout } from "react-grid-layout";
import TelemetryBox from "./TelemetryBox";
import { CommandBox } from "./CommandBox";
import { ChartBox } from "./ChartBox";
import { useStore } from "../store/useStore";
import { useDrop } from "react-dnd";

export function Dashboard() {
  const { components, layout, setLayout, addComponent, removeComponent } = useStore();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "BOX",
    drop: (item: { type: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset) return;
      addComponent(item.type);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const getBoxSize = (type: string) => {
  switch (type) {
    case "TelemetryBox":
      return { w: 8, h: 16 };
    case "CommandBox":
      return { w: 17, h: 40 };
    case "ChartBox":
      return { w: 14, h: 24 };
    default:
      return { w: 20, h: 20 };
  }
};

  const gridLayout: Layout[] =
    layout.length > 0
      ? layout
      : components.map((comp, idx) => {
          const base = { i: comp.id, ...getBoxSize(comp.type), moved: false, static: false };
          switch (comp.type) {
            case "TelemetryBox":
              return { ...base, x: 0, y: 0 };
            case "CommandBox":
              return { ...base, x: 10, y: 0 };
            case "ChartBox":
              return { ...base, x: 0, y: 20 };
            default:
              return { ...base, x: (idx % 3) * 10, y: Math.floor(idx / 3) * 10 };
          }
        });

  const renderComponent = (comp: { id: string; type: string }) => {
    const props = { id: comp.id, onClose: () => removeComponent(comp.id) };

    switch (comp.type) {
      case "TelemetryBox":
        return <TelemetryBox {...props} />;
      case "CommandBox":
        return <CommandBox {...props} />;
      case "ChartBox":
        return <ChartBox {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={drop}
      className="w-full h-full bg-white"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    >
      <GridLayout
        className="layout"
        layout={gridLayout}
        cols={48}
        rowHeight={10}
        width={window.innerWidth}
        margin={[2, 2]}
        preventCollision={true}
        compactType={null}
        onLayoutChange={(newLayout) => setLayout(newLayout)}
        isResizable={true}
        onResizeStop={(newLayout) => setLayout(newLayout)}
        draggableHandle=".drag-handle"
        resizeHandles={["se"]}
      >
        {components.map((comp, idx) => {
          const gridItem =
            gridLayout.find((g) => g.i === comp.id) || {
              i: comp.id,
              x: (idx % Math.floor(window.innerWidth / 50)) * 15,
              y: Math.floor(idx / 2) * 30,
              ...getBoxSize(comp.type),
            };

          return (
            <div key={comp.id} data-grid={gridItem} className="group relative">
              <div className="bg-white rounded shadow p-4 h-full flex flex-col">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeComponent(comp.id);
                  }}
                  className="absolute top-2 right-2 text-red-500 font-bold z-10"
                >
                  ×
                </button>

                <div className="flex justify-between items-center drag-handle cursor-move mb-2 pr-6">
                  <span className="font-semibold">{comp.type}</span>
                </div>

                <div className="flex-1 overflow-auto">
                  {renderComponent(comp)}
                </div>
              </div>
              <div
                className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-gray-600 cursor-se-resize z-20 opacity-100"
                style={{ pointerEvents: "none" }}
              />
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
