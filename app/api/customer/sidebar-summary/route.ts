import { NextResponse } from "next/server";
import { CustomerContextError, getCustomerRequestContext } from "../_shared";

type BackendRecord = Record<string, unknown>;

class BackendRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

export interface SidebarIssue {
  id: string;
  shipmentId: string | number | null;
  isBlocked: boolean;
  requiresCustomerAction: boolean;
  stageName: string | null;
  description: string | null;
}

interface SidebarSummaryResult {
  servicesCount: number;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  issuesCount: number | null;
  issuesAvailable: boolean;
  issuesError: string | null;
  issues: SidebarIssue[];
}

const readField = (record: BackendRecord, fieldName: string): unknown => {
  const key = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === fieldName.toLowerCase(),
  );

  return key ? record[key] : undefined;
};

const toBoolean = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }

  throw new Error("The backend returned an invalid SQLite boolean flag.");
};

const unwrapRecords = (
  value: unknown,
  collectionNames: string[],
): BackendRecord[] | null => {
  let candidate = value;

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(candidate)) {
      if (
        !candidate.every(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item),
        )
      ) {
        return null;
      }

      return candidate.filter(
        (item): item is BackendRecord =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      );
    }

    if (typeof candidate !== "object" || candidate === null) {
      return null;
    }

    const record = candidate as BackendRecord;
    const collectionKey = Object.keys(record).find((key) =>
      collectionNames.some((name) => key.toLowerCase() === name.toLowerCase()),
    );

    if (collectionKey) {
      candidate = record[collectionKey];
      continue;
    }

    const wrapperKey = Object.keys(record).find((key) =>
      ["data", "payload", "response", "result", "items"].includes(key.toLowerCase()),
    );

    if (!wrapperKey) {
      return null;
    }

    candidate = record[wrapperKey];
  }

  return null;
};

const requireRecords = (
  value: unknown,
  collectionNames: string[],
  sourceName: string,
): BackendRecord[] => {
  const records = unwrapRecords(value, collectionNames);
  if (!records) {
    throw new Error(`The ${sourceName} endpoint returned an invalid response.`);
  }

  return records;
};

const requireUnreadCount = (value: unknown, sourceName: string): number => {
  let candidate = value;

  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
      break;
    }

    const record = candidate as BackendRecord;
    const unreadCount = readField(record, "unreadCount");
    if (
      typeof unreadCount === "number" &&
      Number.isInteger(unreadCount) &&
      unreadCount >= 0
    ) {
      return unreadCount;
    }

    const wrapperKey = Object.keys(record).find((key) =>
      ["data", "payload", "response", "result", "items"].includes(key.toLowerCase()),
    );
    if (!wrapperKey) break;
    candidate = record[wrapperKey];
  }

  throw new Error(`The ${sourceName} endpoint returned an invalid unread count.`);
};

const readText = (record: BackendRecord, ...fieldNames: string[]): string | null => {
  for (const fieldName of fieldNames) {
    const value = readField(record, fieldName);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }

  return null;
};

const belongsToUser = (
  record: BackendRecord,
  userId: string,
  ...userIdFields: string[]
): boolean =>
  userIdFields.some((fieldName) => {
    const value = readField(record, fieldName);
    return (
      (typeof value === "string" || typeof value === "number") &&
      String(value) === userId
    );
  });

const countActiveShipments = (shipments: BackendRecord[]): number =>
  shipments.filter((shipment) => {
    const recordStatus = readField(shipment, "recordStatus");
    if (recordStatus === undefined) return true;
    if (recordStatus === null) return false;
    if (typeof recordStatus === "number") return recordStatus !== 0;
    if (typeof recordStatus === "string") {
      return !["0", "false"].includes(recordStatus.trim().toLowerCase());
    }
    return recordStatus !== false;
  }).length;

export async function GET() {
  try {
    const { accessToken, backendUrl, customerUserId: currentUserId } =
      await getCustomerRequestContext();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
    const requests = [
      ["shipments", `${backendUrl}/Shipments/GetByImporter/${currentUserId}`],
      [
        "notification count",
        `${backendUrl}/Notification/GetUnreadCount?userId=${encodeURIComponent(currentUserId)}`,
      ],
      ["message count", `${backendUrl}/Messaging/GetUnreadCount`],
    ] as const;
    const responses = await Promise.all(
      requests.map(async ([name, url]) => {
        const response = await fetch(url, {
          headers,
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          throw new BackendRequestError(
            `${name} request failed with status ${response.status}.`,
            response.status,
          );
        }

        return response.json() as Promise<unknown>;
      }),
    );
    const [shipmentData, notificationCountData, messageCountData] = responses;
    const shipments = requireRecords(shipmentData, ["shipments"], "shipments").filter((shipment) =>
      belongsToUser(shipment, currentUserId, "importerId"),
    );
    const shipmentIds = [...new Set(
      shipments
        .map((shipment) => readField(shipment, "id"))
        .filter((id): id is string | number => typeof id === "string" || typeof id === "number")
        .map(String),
    )];
    const stageResponses = await Promise.all(
      shipmentIds.map(async (shipmentId) => {
        const response = await fetch(
          `${backendUrl}/Shipments/GetStages?shipmentId=${encodeURIComponent(shipmentId)}`,
          {
            headers,
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok) {
          return {
            data: null,
            error: `Stage executions request failed with status ${response.status}.`,
          };
        }
        return { data: (await response.json()) as unknown, error: null };
      }),
    ).catch((error: unknown) => [{
      data: null,
      error: error instanceof Error
        ? `Unable to load stage executions: ${error.message}`
        : "Unable to load stage executions.",
    }]);
    const stageData = stageResponses.flatMap((result) =>
      result.data === null ? [] : [result.data],
    );
    const stageError =
      stageResponses.find((result) => result.error)?.error ?? null;
    const unreadNotificationsCount = requireUnreadCount(
      notificationCountData,
      "notifications",
    );
    const unreadMessagesCount = requireUnreadCount(messageCountData, "messages");
    let issuesError = stageError;
    let issues: SidebarIssue[] = [];
    if (stageData.length && !issuesError) {
      try {
        const stages = stageData.flatMap((value) =>
          requireRecords(
            value,
            ["stages", "executions", "serviceStageExecutions"],
            "stage executions",
          ),
        );

        issues = stages
          .map((stage, index) => {
            const isBlocked = toBoolean(readField(stage, "isBlocked"));
            const requiresCustomerAction = toBoolean(
              readField(stage, "requiresCustomerAction"),
            );

            if (!isBlocked && !requiresCustomerAction) return null;

            const shipmentIdValue = readField(stage, "shipmentId");
            const shipmentId =
              typeof shipmentIdValue === "string" || typeof shipmentIdValue === "number"
                ? shipmentIdValue
                : null;

            return {
              id: String(readField(stage, "id") ?? `issue-${index + 1}`),
              shipmentId,
              isBlocked,
              requiresCustomerAction,
              stageName: readText(stage, "stageName", "stepName", "taskName", "stage", "name", "title"),
              description: readText(stage, "description", "notes", "comments"),
            };
          })
          .filter((issue): issue is SidebarIssue => issue !== null);
      } catch (error: unknown) {
        issuesError =
          error instanceof Error
            ? error.message
            : "Unable to interpret stage execution records.";
      }
    }

    const result: SidebarSummaryResult = {
      servicesCount: countActiveShipments(shipments),
      unreadNotificationsCount,
      unreadMessagesCount,
      issuesCount: issuesError ? null : issues.length,
      issuesAvailable: issuesError === null,
      issuesError,
      issues,
    };
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: unknown) {
    console.error("Unable to load customer sidebar summary:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load customer sidebar summary.",
      },
      {
        status:
          error instanceof CustomerContextError || error instanceof BackendRequestError
            ? error.status
            : 502,
      },
    );
  }
}
