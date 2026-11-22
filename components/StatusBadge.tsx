import Icon from "@/components/Icon";
import { STATUSES } from "@/lib/reports";
import type { Status } from "@/lib/types";

/* "Reported", "Acknowledged" or "Fixed", with an icon and a colour (never the colour alone) */
const ICONS = { reported: "warn", acknowledged: "clock", fixed: "check" } as const;

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="badge" data-status={status}>
      <Icon name={ICONS[status]} className="h-3.5 w-3.5" />
      {STATUSES[status].label}
    </span>
  );
}
