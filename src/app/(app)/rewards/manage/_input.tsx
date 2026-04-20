"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

/**
 * Text input matching the manage-screen mockup's RMInput: FAFAFA background,
 * transparent border at rest, solid var(--ink) border when focused.
 */
export const RewardManageInput = forwardRef<HTMLInputElement, Props>(
  function RewardManageInput({ style, onFocus, onBlur, ...rest }, ref) {
    const [focus, setFocus] = useState(false);
    return (
      <input
        ref={ref}
        {...rest}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={{
          height: 48,
          padding: "0 14px",
          borderRadius: 10,
          background: "var(--surface-raised)",
          border: `1px solid ${focus ? "var(--ink)" : "transparent"}`,
          outline: "none",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          transition: "border-color 160ms ease",
          ...(style || {}),
        }}
      />
    );
  },
);
