import { Period, UsagePeriodSelector } from "elements/UsagePeriodSelector";
import { Combobox } from "dashboard-common/elements/Combobox";
import { Tooltip } from "dashboard-common/elements/Tooltip";
import { TextInput } from "dashboard-common/elements/TextInput";
import { useRouter } from "next/router";
import { ProjectDetails } from "generatedApi";
import { PuzzlePieceIcon } from "dashboard-common/elements/icons";

export function TeamUsageToolbar({
  shownBillingPeriod,
  setSelectedBillingPeriod,
  currentBillingPeriod,
  projects,
  projectId,
}: {
  shownBillingPeriod: Period;
  projects: ProjectDetails[];
  projectId: number | null;
  setSelectedBillingPeriod: (period: Period) => void;
  currentBillingPeriod: { start: string; end: string };
}) {
  const { query, replace } = useRouter();
  return (
    <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-2 border-b bg-background-primary py-6">
      <UsagePeriodSelector
        period={shownBillingPeriod}
        onChange={setSelectedBillingPeriod}
        currentBillingPeriod={currentBillingPeriod}
      />
      <Combobox
        label="Projects"
        options={[
          { label: "All Projects", value: null },
          ...projects.map((p) => ({ label: p.name, value: p.id })),
        ]}
        allowCustomValue
        selectedOption={projectId}
        setSelectedOption={(o) => {
          const newProject = projects?.find((p) => p.id === o);
          query.projectSlug = newProject?.slug ?? o?.toString();
          void replace({ query }, undefined, { shallow: true });
        }}
      />

      <Tooltip
        className="w-[12rem] animate-fadeInFromLoading"
        tip={
          <div className="flex flex-col gap-1">
            <p>
              Filter usage to only include components whose paths start with
              this string.
            </p>
            <p>Enter "app" to only see results for the root app.</p>
          </div>
        }
      >
        <TextInput
          label="Component Prefix"
          labelHidden
          id="componentPrefix"
          type="search"
          SearchIcon={PuzzlePieceIcon}
          placeholder="Component Prefix"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          onBlur={(e) => {
            const { value } = e.target;
            query.componentPrefix = value;
            void replace({ query }, undefined, { shallow: true });
          }}
        />
      </Tooltip>

      <span className="text-sm text-content-secondary lg:ml-auto">
        All dates are in UTC
      </span>
    </div>
  );
}
