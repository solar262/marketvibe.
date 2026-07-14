export type AllRounderAction =
  | "health"
  | "autopilot"
  | "buyer-pipeline"
  | "opportunity-discovery"
  | "stale-replacement"
  | "delivery"
  | "unsupported";

export type AllRounderCommandPlan = {
  action: AllRounderAction;
  label: string;
  mutatesData: boolean;
  sendsEmail: boolean;
  requiresApproval: boolean;
};

export const supportedMarketVibeCommands = [
  "Show live health",
  "Run full autopilot",
  "Recover buyer pipeline",
  "Find and verify opportunities",
  "Replace stale opportunities",
  "Publish due deliveries",
] as const;

export function classifyMarketVibeCommand(command: string): AllRounderCommandPlan {
  const normalized = command.trim().toLowerCase();

  if (!normalized) {
    return {
      action: "unsupported",
      label: "Empty command",
      mutatesData: false,
      sendsEmail: false,
      requiresApproval: false,
    };
  }

  if (/(health|status|summary|what needs attention|check operations)/.test(normalized)) {
    return {
      action: "health",
      label: "Read live MarketVibe health",
      mutatesData: false,
      sendsEmail: false,
      requiresApproval: false,
    };
  }

  if (/(full autopilot|run autopilot|run all operations|recover everything)/.test(normalized)) {
    return {
      action: "autopilot",
      label: "Run the complete MarketVibe recovery loop",
      mutatesData: true,
      sendsEmail: true,
      requiresApproval: true,
    };
  }

  if (/(buyer pipeline|recover buyers|process buyers|buyer recovery)/.test(normalized)) {
    return {
      action: "buyer-pipeline",
      label: "Recover and process the buyer pipeline",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(find opportunities|discover opportunities|verify opportunities|opportunity discovery)/.test(normalized)) {
    return {
      action: "opportunity-discovery",
      label: "Discover and verify opportunities",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(replace stale|stale opportunities|refresh stale|replacement)/.test(normalized)) {
    return {
      action: "stale-replacement",
      label: "Replace stale opportunities",
      mutatesData: true,
      sendsEmail: false,
      requiresApproval: true,
    };
  }

  if (/(publish due|deliveries|send pending|delivery emails|publish deliveries)/.test(normalized)) {
    return {
      action: "delivery",
      label: "Publish due deliveries and send pending delivery emails",
      mutatesData: true,
      sendsEmail: true,
      requiresApproval: true,
    };
  }

  return {
    action: "unsupported",
    label: "Unsupported command",
    mutatesData: false,
    sendsEmail: false,
    requiresApproval: false,
  };
}
