import React from 'react';

export const FormInput = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  options = [], // for select type
  rows = 3, // for textarea type
  className = '',
  helperText,
  icon: Icon,
  onIconClick,
  ...props
}) => {
  const inputBaseStyles = 'w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-500';
  const stateStyles = error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:border-primary-500';
  
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-700 tracking-wide flex items-center gap-0.5">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            rows={rows}
            className={`${inputBaseStyles} ${stateStyles} resize-none`}
            {...props}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`${inputBaseStyles} ${stateStyles} appearance-none cursor-pointer`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={`${inputBaseStyles} ${stateStyles} pr-10`}
            {...props}
          />
        )}

        {Icon && (
          <button
            type="button"
            onClick={onIconClick}
            className={`absolute right-3 text-slate-400 hover:text-slate-600 transition-colors ${onIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            <Icon size={18} />
          </button>
        )}
      </div>

      {error ? (
        <span className="text-xs text-rose-500 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-400">{helperText}</span>
      ) : null}
    </div>
  );
};
