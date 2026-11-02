"use client";

import { useId, useMemo, useRef, useState } from "react";
import { PAKISTAN_CITIES, filterCities, isPakistanCity } from "@/lib/cities";

export default function CitySelect({
  id,
  name = "city",
  label = "City",
  required = false,
  defaultValue = "",
  helpText = "Start typing to search the Pakistan city list.",
  hideHelp = false,
}) {
  const listId = useId();
  const inputRef = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const options = useMemo(() => filterCities(value, 14), [value]);

  function choose(city) {
    setValue(city);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(event) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      if (options[highlight]) {
        event.preventDefault();
        choose(options[highlight]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const describedBy = [
    hideHelp ? null : `${id}-help`,
    value && !isPakistanCity(value) ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="city-combobox">
      <label className="form-label fw-semibold" htmlFor={id}>
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        className="form-control"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required}
        aria-describedby={describedBy}
        aria-invalid={Boolean(value) && !isPakistanCity(value)}
        placeholder="Search Karachi, Lahore, Peshawar…"
        value={value}
        required={required}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />
      {hideHelp ? null : (
        <div id={`${id}-help`} className="form-text">
          {helpText}
        </div>
      )}
      {value && !isPakistanCity(value) ? (
        <div id={`${id}-error`} className="invalid-feedback d-block">
          Choose a city from the standardized Pakistan list.
        </div>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="city-listbox list-unstyled mb-0"
          aria-label="Pakistan cities"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-muted">No matching city</li>
          ) : (
            options.map((city, index) => (
              <li key={city} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="city-option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(city)}
                >
                  {city}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
      <datalist id={`${id}-all`}>
        {PAKISTAN_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </div>
  );
}
