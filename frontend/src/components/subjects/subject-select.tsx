"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubjects } from "@/hooks/use-subjects";

export function SubjectSelect({
  value,
  onChange,
  placeholder = "No subject",
  allowNone = true,
}: {
  value: string | null;
  onChange: (subjectId: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
}) {
  const { data: subjects = [] } = useSubjects();

  return (
    <Select value={value ?? "__none__"} onValueChange={(v) => onChange(v === "__none__" ? null : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="__none__">No subject</SelectItem>}
        {subjects.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
