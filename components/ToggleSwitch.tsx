import React from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, description, checked, onChange, disabled }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-grow pr-4">
        <label htmlFor={id} className="font-medium text-gray-200 block cursor-pointer">
          {label}
        </label>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
        <input
          type="checkbox"
          id={id}
          name={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
        />
        <label
          htmlFor={id}
          className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"
        ></label>
      </div>
      <style>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #16a34a; /* green-600 */
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #16a34a; /* green-600 */
        }
      `}</style>
    </div>
  );
};

export default ToggleSwitch;