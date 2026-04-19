export function Progress({
  value,
  label
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="grid gap-3">
      <div className="h-3 overflow-hidden rounded-full bg-primary-60/15">
        <span
          className="block h-full rounded-full bg-[linear-gradient(90deg,#7795F8_0%,#86D7BC_55%,#B39DDB_100%)] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-sm text-neutral-10/70">{label}</p>
    </div>
  );
}
