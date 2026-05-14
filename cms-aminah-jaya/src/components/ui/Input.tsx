import { JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  variant?: "base";
}

export default function Input(props: InputProps) {
  const [local, others] = splitProps(props, ["class", "variant"]);
  return (
    <input
      class={`input-field ${local.class || ""}`}
      {...others}
    />
  );
}

export function TextArea(props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <textarea
      class={`input-field ${local.class || ""}`}
      {...others}
    />
  );
}

export function Select(props: JSX.SelectHTMLAttributes<HTMLSelectElement>) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <select
      class={`input-field ${local.class || ""}`}
      {...others}
    >
      {props.children}
    </select>
  );
}
