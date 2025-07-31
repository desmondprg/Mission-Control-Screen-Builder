import React from "react";
import { useStore } from "../store/useStore";

export function CommandBox({ id }: { id: string }) {
  const [isShowingModal, setIsShowingModal] = React.useState(false);
  const { components, setComponents } = useStore();

  const compIndex = components.findIndex((c) => c.id === id);
  const component = components[compIndex];
  const props = component?.props || {
    command: "",
    params: [{ key: "", value: "", validation: { required: false, pattern: "", errorMessage: "" } }],
    isHazardous: false,
    confirmationRequired: false,
    twoFACode: "",
    status: "",
    showConfirmation: false
  };


  const updateProps = (newProps: Partial<typeof props>) => {
    const updated = [...components];
    updated[compIndex] = {
      ...component,
      props: { ...props, ...newProps }
    };
    setComponents(updated);
  };

  React.useEffect(() => {
    if (props.status) {
      const timer = setTimeout(() => {
        updateProps({ status: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [props.status]);


  const validate = () => {
    if (!props.command.trim()) {
      updateProps({ status: "Command name is required." });
      return false;
    }
    if (props.isHazardous && !/^[0-9]{6}$/.test(props.twoFACode)) {
      updateProps({ status: "Hazardous commands require a valid 6-digit 2FA code." });
      return false;
    }
    for (const pair of props.params) {
      const val = pair.value || "";
      const rules = pair.validation || {};
      if (rules.required && !val.trim()) {
        updateProps({ status: rules.errorMessage || `Value for "${pair.key}" is required.` });
        return false;
      }
      if (rules.pattern) {
        try {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(val)) {
            updateProps({ status: rules.errorMessage || `Value for "${pair.key}" does not match pattern.` });
            return false;
          }
        } catch (e) {
          updateProps({ status: `Invalid regex pattern in "${pair.key}".` });
          return false;
        }
      }
    }
    return true;
  };

  const handleSend = () => {
    if (!validate()) return;
    updateProps({ status: "Sending command..." });
    setTimeout(() => {
      updateProps({ status: "✅ Command sent successfully." });
    }, 1000);
  };

  const onSubmit = () => {
    if (props.confirmationRequired) {
      setIsShowingModal(true);
    } else {
      handleSend();
    }
  };

  return (
    <div className="bg-white border rounded shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold">Command Box</h2>

      <input
        type="text"
        placeholder="Command name"
        value={props.command}
        onChange={(e) => updateProps({ command: e.target.value })}
        className="w-full p-2 border rounded"
      />

      <div className="space-y-2">
        {props.params.map((pair, idx) => (
          <div key={idx} className="space-y-1 border p-2 rounded">
            <div className="flex space-x-2 items-center">
              <input
                type="text"
                placeholder="Key"
                value={pair.key}
                onChange={(e) => {
                  const updated = [...props.params];
                  updated[idx].key = e.target.value;
                  updateProps({ params: updated });
                }}
                className="flex-1 p-1 border rounded"
              />
              <input
                type="text"
                placeholder="Value"
                value={pair.value}
                onChange={(e) => {
                  const updated = [...props.params];
                  updated[idx].value = e.target.value;
                  updateProps({ params: updated });
                }}
                className="flex-1 p-1 border rounded"
              />
              <button
                onClick={() => {
                  const updated = [...props.params];
                  updated.splice(idx, 1);
                  updateProps({ params: updated });
                }}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={pair.validation?.required || false}
                  onChange={(e) => {
                    const updated = [...props.params];
                    updated[idx].validation = {
                      ...updated[idx].validation,
                      required: e.target.checked,
                    };
                    updateProps({ params: updated });
                  }}
                />
                <span>Required</span>
              </label>
              <input
                type="text"
                placeholder="Regex pattern"
                value={pair.validation?.pattern || ""}
                onChange={(e) => {
                  const updated = [...props.params];
                  updated[idx].validation = {
                    ...updated[idx].validation,
                    pattern: e.target.value,
                  };
                  updateProps({ params: updated });
                }}
                className="p-1 border rounded col-span-1"
              />
              <input
                type="text"
                placeholder="Custom error message"
                value={pair.validation?.errorMessage || ""}
                onChange={(e) => {
                  const updated = [...props.params];
                  updated[idx].validation = {
                    ...updated[idx].validation,
                    errorMessage: e.target.value,
                  };
                  updateProps({ params: updated });
                }}
                className="p-1 border rounded col-span-1"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            updateProps({
              params: [
                ...props.params,
                { key: "", value: "", validation: { required: false, pattern: "", errorMessage: "" } },
              ],
            })
          }
          className="text-blue-600 text-sm"
        >
          + Add Parameter
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={props.isHazardous}
          onChange={(e) => updateProps({ isHazardous: e.target.checked })}
        />
        <label>Hazardous</label>
      </div>

      {props.isHazardous && (
        <input
          type="text"
          placeholder="Enter 2FA code"
          value={props.twoFACode}
          onChange={(e) => updateProps({ twoFACode: e.target.value })}
          className="w-full p-2 border rounded"
        />
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={props.confirmationRequired}
          onChange={(e) => updateProps({ confirmationRequired: e.target.checked })}
        />
        <label>Require confirmation</label>
      </div>

      <button
        onClick={onSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Command
      </button>

      {props.status && <div className="text-sm text-gray-600">{props.status}</div>}

      {isShowingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Confirm Command</h3>
            <p>Are you sure you want to send the <strong>{props.command}</strong> command?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsShowingModal(false)}
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => { setIsShowingModal(false); handleSend(); }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}