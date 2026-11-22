import Icon from "@/components/Icon";
import { STATUS_IDS, STATUSES } from "@/lib/reports";
import type { Status } from "@/lib/types";

/* The three stops of a report: Reported → Acknowledged → Fixed, with the current one marked */
export default function StatusStepper({ status }: { status: Status }) {
  const at = STATUSES[status].step;
  return (
    <ol className="flex items-start" aria-label="Progress of this report">
      {STATUS_IDS.map((id, i) => {
        const done = i < at || (id === "fixed" && status === "fixed");
        const current = i === at;
        return (
          <li key={id} className="relative flex-1 text-center" aria-current={current ? "step" : undefined}>
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 ${i <= at ? "bg-ink" : "bg-line"}`} />}
            <span
              className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border-2 ${
                done ? "border-asphalt bg-brand text-on-brand" : current ? "border-asphalt bg-brand text-on-brand" : "border-edge bg-card text-ink-soft"
              }`}
            >
              {done ? <Icon name="check" className="h-4 w-4" /> : <span className="text-sm font-bold">{i + 1}</span>}
            </span>
            <span className={`mt-1 block text-sm ${current ? "font-bold" : "text-ink-soft"}`}>
              {STATUSES[id].label}
              {current && <span className="sr-only"> (now)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
