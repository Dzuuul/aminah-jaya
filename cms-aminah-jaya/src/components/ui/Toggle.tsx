interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle(props: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={props.checked}
      onClick={() => !props.disabled && props.onChange(!props.checked)}
      disabled={props.disabled}
      class={`settings-toggle ${props.checked ? 'checked' : ''}`}
      style={{ 
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer"
      }}
    >
      <span class="settings-toggle-dot" />
    </button>
  );
}
