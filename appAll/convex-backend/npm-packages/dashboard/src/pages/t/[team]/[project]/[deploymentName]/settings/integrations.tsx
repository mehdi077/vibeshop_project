import { useQuery } from "convex/react";
import udfs from "dashboard-common/udfs";
import { withAuthenticatedPage } from "lib/withAuthenticatedPage";
import { Integrations } from "components/integrations/Integrations";
import { DeploymentSettingsLayout } from "dashboard-common/layouts/DeploymentSettingsLayout";
import { LoadingTransition } from "dashboard-common/elements/Loading";
import { useCurrentTeam, useTeamEntitlements } from "api/teams";

export { getServerSideProps } from "lib/ssr";

function IntegrationsPage() {
  const team = useCurrentTeam();
  const entitlements = useTeamEntitlements(team?.id);
  const integrations = useQuery(udfs.listConfiguredSinks.default);

  return (
    <DeploymentSettingsLayout page="integrations">
      <LoadingTransition>
        {team && entitlements && integrations !== undefined && (
          <Integrations
            team={team}
            entitlements={entitlements}
            integrations={integrations}
          />
        )}
      </LoadingTransition>
    </DeploymentSettingsLayout>
  );
}

export default withAuthenticatedPage(IntegrationsPage);
