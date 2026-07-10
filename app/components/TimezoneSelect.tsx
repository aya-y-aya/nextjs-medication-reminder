"use client";

interface TimezoneSelectProps {
  name: string;
  id: string;
  defaultValue?: string;
}

const timezones = Intl.supportedValuesOf("timeZone");

const groupedTimezones = timezones.reduce<Record<string, string[]>>(
  (groups, tz) => {
    const slashIndex = tz.indexOf("/");
    const region = slashIndex !== -1 ? tz.substring(0, slashIndex) : "Other";
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(tz);
    return groups;
  },
  {}
);

const sortedRegions = Object.keys(groupedTimezones).sort();

function getDefaultTimezone(defaultValue?: string): string {
  if (defaultValue) {
    return defaultValue;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

export default function TimezoneSelect({
  name,
  id,
  defaultValue,
}: TimezoneSelectProps) {
  const initialValue = getDefaultTimezone(defaultValue);

  return (
    <select
      id={id}
      name={name}
      defaultValue={initialValue}
      className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
    >
      {sortedRegions.map((region) => (
        <optgroup key={region} label={region}>
          {groupedTimezones[region].map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
