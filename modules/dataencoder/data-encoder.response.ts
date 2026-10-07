const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeId = (value: unknown): string => {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
        return String(value);
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
        const id = Number(value.trim());
        if (Number.isSafeInteger(id) && id > 0) return value.trim();
    }
    return "";
};

export const readJsonResponse = async (response: Response): Promise<unknown> => {
    const text = await response.text();
    if (!text.trim()) return null;

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
};

export const readCreatedServiceId = (value: unknown): string => {
    const pending: unknown[] = [value];
    const visited = new Set<object>();
    const nestedKeys = ["response", "data", "payload", "result", "service", "shipment", "record"];

    while (pending.length) {
        const current = pending.shift();
        const directId = normalizeId(current);
        if (directId) return directId;
        if (Array.isArray(current)) {
            if (visited.has(current)) continue;
            visited.add(current);
            pending.push(...current);
            continue;
        }
        if (!isRecord(current) || visited.has(current)) continue;
        visited.add(current);

        for (const key of Object.keys(current)) {
            if (["serviceid", "shipmentid", "id"].includes(key.toLowerCase())) {
                const id = normalizeId(current[key]);
                if (id) return id;
            }
        }

        for (const key of Object.keys(current)) {
            if (nestedKeys.includes(key.toLowerCase())) pending.push(current[key]);
        }
    }

    return "";
};

export const readCreatedServiceStageId = (value: unknown): string => {
    const pending: unknown[] = [value];
    const visited = new Set<object>();
    const nestedKeys = ["response", "data", "payload", "result", "service", "shipment", "record", "stage", "servicestage"];

    while (pending.length) {
        const current = pending.shift();
        const directId = normalizeId(current);
        if (directId) return directId;
        if (Array.isArray(current)) {
            if (visited.has(current)) continue;
            visited.add(current);
            pending.push(...current);
            continue;
        }
        if (!isRecord(current) || visited.has(current)) continue;
        visited.add(current);

        for (const key of Object.keys(current)) {
            if (["servicestagestageid", "servicestageid", "stageid"].includes(key.toLowerCase())) {
                const id = normalizeId(current[key]);
                if (id) return id;
            }
        }

        for (const key of Object.keys(current)) {
            if (nestedKeys.includes(key.toLowerCase())) pending.push(current[key]);
        }
    }

    return "";
};

export const readCreatedServiceIdFromLocation = (location: string | null): string => {
    if (!location) return "";
    try {
        const url = new URL(location, "https://local.invalid");
        const queryId = normalizeId(
            url.searchParams.get("serviceId") ?? url.searchParams.get("id"),
        );
        if (queryId) return queryId;
        const segments = url.pathname.split("/").filter(Boolean);
        return normalizeId(segments[segments.length - 1]);
    } catch {
        return "";
    }
};