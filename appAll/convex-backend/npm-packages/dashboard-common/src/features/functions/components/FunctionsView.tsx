import { useContext } from "react";
import { CodeIcon } from "@radix-ui/react-icons";
import {
  useCurrentOpenFunction,
  useModuleFunctions,
} from "@common/lib/functions/FunctionsProvider";
import { DirectorySidebar } from "@common/features/functions/components/DirectorySidebar";
import { FileEditor } from "@common/features/functions/components/FileEditor";
import { FunctionSummary } from "@common/features/functions/components/FunctionSummary";
import { PerformanceGraphs } from "@common/features/functions/components/PerformanceGraphs";
import { DeploymentInfoContext } from "@common/lib/deploymentContext";
import { SidebarDetailLayout } from "@common/layouts/SidebarDetailLayout";
import { EmptySection } from "@common/elements/EmptySection";
import { DeploymentPageTitle } from "@common/elements/DeploymentPageTitle";

export function FunctionsView() {
  return (
    <>
      <DeploymentPageTitle title="Functions" />
      <Functions />
    </>
  );
}
function Functions() {
  const { useCurrentDeployment } = useContext(DeploymentInfoContext);
  const deploymentId = useCurrentDeployment()?.id;
  const currentOpenFunction = useCurrentOpenFunction();
  const modules = useModuleFunctions();

  if (modules.length === 0) {
    return <EmptyFunctions />;
  }

  let content: React.ReactNode;
  if (!currentOpenFunction) {
    content = (
      <span className="grid h-full w-full place-content-center">
        Select a function on the left to open it.
      </span>
    );
  } else {
    content = (
      <div className="flex h-fit max-w-[110rem] flex-col gap-3 p-6 py-4">
        <div className="flex-none">
          <FunctionSummary currentOpenFunction={currentOpenFunction} />
        </div>
        <div className="flex-none">
          <PerformanceGraphs />
        </div>
        <div>
          <FileEditor moduleFunction={currentOpenFunction} />
        </div>
      </div>
    );
  }

  return (
    <SidebarDetailLayout
      panelSizeKey={`${deploymentId}/functions`}
      sidebarComponent={<DirectorySidebar onChangeFunction={() => {}} />}
      contentComponent={content}
    />
  );
}

function EmptyFunctions() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <EmptySection
        Icon={CodeIcon}
        color="yellow"
        header="No functions in this deployment, yet."
        body="Deploy some functions to get started."
        learnMoreButton={{
          href: "https://docs.convex.dev/quickstarts",
          children: "Follow a quickstart guide for your favorite framework.",
        }}
        sheet={false}
      />
    </div>
  );
}
