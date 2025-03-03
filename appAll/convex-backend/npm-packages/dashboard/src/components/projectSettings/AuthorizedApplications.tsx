import { AppAccessTokenResponse, ProjectDetails } from "generatedApi";

import { Sheet } from "dashboard-common/elements/Sheet";
import {
  useDeleteAppAccessTokenByName,
  useProjectAppAccessTokens,
} from "api/accessTokens";
import { LoadingTransition } from "dashboard-common/elements/Loading";
import { TimestampDistance } from "dashboard-common/elements/TimestampDistance";
import { Button } from "dashboard-common/elements/Button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Spinner } from "dashboard-common/elements/Spinner";
import { ConfirmationDialog } from "dashboard-common/elements/ConfirmationDialog";

export function AuthorizedApplications({
  project,
}: {
  project: ProjectDetails;
}) {
  const projectAccessTokens = useProjectAppAccessTokens(project.id);

  return (
    <Sheet>
      <h3 className="mb-2">Authorized Applications</h3>
      <p className="text-sm text-content-primary">
        These 3rd-party applications have been authorized to access this project
        on your behalf.
      </p>
      <p className="mb-2 mt-1 text-sm text-content-primary">
        You cannot see applications that other members of your team have
        authorized.
      </p>
      <LoadingTransition
        loadingProps={{ fullHeight: false, className: "h-14 w-full" }}
      >
        {projectAccessTokens !== undefined && (
          <div className="flex w-full flex-col gap-2">
            {projectAccessTokens.length ? (
              projectAccessTokens.map((token, idx) => (
                <AuthorizedApplicationListItem
                  key={idx}
                  token={token}
                  project={project}
                />
              ))
            ) : (
              <div className="my-2 text-content-secondary">
                You have not authorized any applications yet.
              </div>
            )}
          </div>
        )}
      </LoadingTransition>
    </Sheet>
  );
}

function AuthorizedApplicationListItem({
  project,
  token,
}: {
  project: ProjectDetails;
  token: AppAccessTokenResponse;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteAppAccessTokenByName = useDeleteAppAccessTokenByName(project.id);
  return (
    <div className="flex w-full flex-col">
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div>{token.appName}</div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col items-end">
            {token.lastUsedTime !== null && token.lastUsedTime !== undefined ? (
              <TimestampDistance
                prefix="Last used "
                date={new Date(token.lastUsedTime)}
              />
            ) : (
              <div className="text-xs text-content-secondary">Never used</div>
            )}
            <TimestampDistance
              prefix="Created "
              date={new Date(token.creationTime)}
            />
          </div>
          <Button
            variant="danger"
            icon={
              isDeleting ? <Spinner className="opacity-50" /> : <Cross2Icon />
            }
            disabled={isDeleting}
            onClick={() => setShowConfirmation(true)}
          >
            Revoke
          </Button>
        </div>
      </div>
      {showConfirmation && (
        <ConfirmationDialog
          dialogTitle={`Revoke access for ${token.appName}`}
          dialogBody="Are you sure you want to revoke access for this application?"
          confirmText="Revoke"
          onClose={() => setShowConfirmation(false)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await deleteAppAccessTokenByName({ name: token.name });
            } finally {
              setIsDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}
