import { A, AnchorProps, useNavigate } from "@solidjs/router";
import { splitProps } from "solid-js";

export default function TransitionLink(props: AnchorProps) {
  const [local, others] = splitProps(props, ["onClick", "href", "state"]);
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent) => {
    if (typeof local.onClick === "function") {
      (local.onClick as any)(e as any);
    }

    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    e.preventDefault();
    const targetPath = local.href || "";

    if (!document.startViewTransition) {
      navigate(targetPath, { state: local.state });
      return;
    }

    document.startViewTransition(() => {
      navigate(targetPath, { state: local.state });
    });
  };

  return (
    <A href={local.href || ""} onClick={handleClick} state={local.state} {...others}>
      {props.children}
    </A>
  );
}
