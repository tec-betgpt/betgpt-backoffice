export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function methodClass(method: string): string {
  switch (method) {
    case "GET":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "POST":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "PUT":
    case "PATCH":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "DELETE":
      return "bg-red-500/15 text-red-700 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}
