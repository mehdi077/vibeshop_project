import { Tooltip } from "dashboard-common/elements/Tooltip";
import { TimestampDistance } from "dashboard-common/elements/TimestampDistance";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  LogIntegration,
  ExceptionReportingIntegration,
  integrationUsingLegacyFormat,
} from "dashboard-common/lib/integrationHelpers";
import { HealthIndicator } from "./HealthIndicator";

export function IntegrationStatus({
  integration,
}: {
  integration: LogIntegration | ExceptionReportingIntegration;
}) {
  return !integration.existing ? null : (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col items-center">
        <div className="ml-auto flex gap-2">
          <HealthIndicator status={integration.existing.status} />
          {integrationUsingLegacyFormat(integration.existing.config) && (
            <Tooltip
              className="text-left text-xs text-content-warning"
              tip="This integration is using the legacy event format. Re-configure this integration to update the event format."
            >
              <ExclamationTriangleIcon className="inline" />
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-content-secondary">
          Created{" "}
          <TimestampDistance
            date={new Date(integration.existing._creationTime)}
          />
        </p>
      </div>
    </div>
  );
}
