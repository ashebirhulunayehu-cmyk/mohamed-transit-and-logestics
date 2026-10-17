import type { CaseExecutorServiceRecord } from "./case-Executer.type";

const readValue = (record: CaseExecutorServiceRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

export const getCaseExecutorServiceCategory = (record: CaseExecutorServiceRecord): string => {
  const category = readValue(record, "routeCategory", "serviceCategory", "category");
  if (typeof category === "string" && category.trim()) return category.trim();
  if (category && typeof category === "object" && !Array.isArray(category)) {
    const label = readValue(
      category as CaseExecutorServiceRecord,
      "name",
      "label",
      "displayName",
      "value",
    );
    if (typeof label === "string" && label.trim()) return label.trim();
  }

  const modeValue = readValue(record, "serviceType", "mode", "transportMode");
  const rawMode =
    modeValue && typeof modeValue === "object" && !Array.isArray(modeValue)
      ? readValue(modeValue as CaseExecutorServiceRecord, "value", "id", "code", "name", "label")
      : modeValue;
  if (rawMode === 1 || rawMode === "1") return "Multimodal";
  if (rawMode === 2 || rawMode === "2") return "Unimodal";
  if (typeof rawMode === "string") {
    const mode = rawMode.trim();
    if (mode.toLowerCase().includes("multi")) return "Multimodal";
    if (mode.toLowerCase().includes("uni")) return "Unimodal";
    if (mode) return mode;
  }
  return "Uncategorized";
};
