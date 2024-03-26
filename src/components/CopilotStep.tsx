import React, { useEffect, useMemo, useRef } from "react";
import { type NativeMethods } from "react-native";

import { useCopilot } from "../contexts/CopilotProvider";

interface Props {
  active?: boolean;
  children: React.ReactElement<any>;
  name: string;
  order: number;
  text: string;
  verticalOffset?: number;
}

export const CopilotStep = ({
  active = true,
  children,
  name,
  order,
  text,
  verticalOffset,
}: Props) => {
  const registeredName = useRef<string | null>(null);
  const { registerStep, unregisterStep } = useCopilot();
  const wrapperRef = React.useRef<NativeMethods | null>(null);

  const measure = async () => {
    return await new Promise<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>((resolve) => {
      const measure = () => {
        // Wait until the wrapper element appears
        if (wrapperRef.current != null && "measure" in wrapperRef.current) {
          wrapperRef.current.measure((_ox, _oy, width, height, x, y) => {
            resolve({
              x,
              y,
              width,
              height,
            });
          });
        } else {
          requestAnimationFrame(measure);
        }
      };

      measure();
    });
  };

  useEffect(() => {
    if (active) {
      if (registeredName.current && registeredName.current !== name) {
        unregisterStep(registeredName.current);
      }
      registerStep({
        measure,
        name,
        order,
        text,
        verticalOffset,
        visible: true,
        wrapperRef,
      });
      registeredName.current = name;
    }
  }, [active, name, order, registerStep, text, unregisterStep, verticalOffset]);

  useEffect(() => {
    if (active) {
      return () => {
        if (registeredName.current) {
          unregisterStep(registeredName.current);
        }
      };
    }
  }, [name, unregisterStep, active]);

  const copilotProps = useMemo(
    () => ({
      ref: wrapperRef,
      onLayout: () => {}, // Android hack
    }),
    []
  );

  return React.cloneElement(children, { copilot: copilotProps });
};
