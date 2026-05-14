import { JSX } from "solid-js";

export function SettingsSection(props: { icon: any; title: string; description: string; children: JSX.Element }) {
  return (
    <div class="settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon">
          <props.icon size={18} />
        </div>
        <div>
          <h3 class="settings-section-title">{props.title}</h3>
          <p class="settings-section-desc">{props.description}</p>
        </div>
      </div>
      <div class="settings-section-content">{props.children}</div>
    </div>
  );
}

export function SettingsField(props: { label: string; hint?: string; children: JSX.Element }) {
  return (
    <div class="settings-field">
      <div class="settings-field-label-group">
        <p class="settings-field-label">{props.label}</p>
        {props.hint && <p class="settings-field-hint">{props.hint}</p>}
      </div>
      <div class="settings-field-content">{props.children}</div>
    </div>
  );
}
