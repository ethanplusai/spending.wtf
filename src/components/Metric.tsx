import { ArrowUpRight, CircleHelp } from "lucide-react";

function Metric({
  label,
  value,
  note,
  red = false,
  trend = false,
}: {
  label: string;
  value: string;
  note: string;
  red?: boolean;
  trend?: boolean;
}) {
  return (
    <div className="metric">
      <span title="See Sources & methodology for the definition and accounting basis of this measure.">
        {label} <CircleHelp size={12} aria-hidden="true" />
      </span>
      <strong className={red ? "red-text" : ""}>{value}</strong>
      <small>
        {trend && <ArrowUpRight size={12} />} {note}
      </small>
    </div>
  );
}

export default Metric;
