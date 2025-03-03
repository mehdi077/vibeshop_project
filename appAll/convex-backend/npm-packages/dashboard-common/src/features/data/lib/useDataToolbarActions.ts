import { Cursor, GenericDocument } from "convex/server";
import { ConvexError } from "convex/values";
import { useMutation } from "convex/react";
import udfs from "@common/udfs";
import { Id } from "system-udfs/convex/_generated/dataModel";
import {
  useInvalidateShapes,
  useDeleteTables,
} from "@common/features/data/lib/api";
import { useNents } from "@common/lib/useNents";
import { toast } from "@common/lib/utils";
import { useContext } from "react";
import { DeploymentInfoContext } from "@common/lib/deploymentContext";

export function useDataToolbarActions({
  handleAddDocuments,
  clearSelectedRows,
  loadMore,
  tableName,
}: {
  handleAddDocuments(): void;
  clearSelectedRows(): void;
  loadMore(): void;
  tableName: string;
}): {
  addDocuments: (
    tableName: string,
    documents: GenericDocument[],
  ) => Promise<void>;
  patchFields: (
    tableName: string,
    rowIds: Set<string> | "all",
    fields: GenericDocument,
  ) => Promise<void>;
  deleteTable: () => Promise<void>;
  clearTable: (
    cursor: Cursor | null,
  ) => Promise<{ continueCursor: Cursor; deleted: number; hasMore: boolean }>;
  deleteRows: (rowIds: Set<string>) => Promise<void>;
} {
  const { captureException } = useContext(DeploymentInfoContext);
  const invalidateShapes = useInvalidateShapes();

  const documentAdd = useMutation(udfs.addDocument.default);
  const { selectedNent } = useNents();
  const addDocuments = async (table: string, documents: GenericDocument[]) => {
    try {
      await documentAdd({
        table,
        documents,
        componentId: selectedNent?.id ?? null,
      });
    } catch (error: any) {
      if (error instanceof ConvexError) {
        throw new Error(error.data);
      }
      throw error;
    }
    handleAddDocuments();
    await invalidateShapes();
  };

  const deleteDocuments = useMutation(udfs.deleteDocuments.default);

  const tableClear = useMutation(udfs.clearTablePage.default);
  const patchDocumentsFields = useMutation(udfs.patchDocumentsFields.default);

  const patchFields = async (
    table: string,
    rowIds: Set<string> | "all",
    fields: GenericDocument,
  ) => {
    try {
      await patchDocumentsFields({
        table,
        fields,
        ids: rowIds === "all" ? undefined : (Array.from(rowIds) as Id<any>[]),
        componentId: selectedNent?.id ?? null,
      });
    } catch (error: any) {
      if (error instanceof ConvexError) {
        throw new Error(error.data);
      }
      throw new Error(
        `Could not bulk edit documents. Try editing less documents or use a migration.\n\n${error.toString()}`,
      );
    }
  };

  const clearTable = async (
    cursor: Cursor | null,
  ): Promise<{ continueCursor: Cursor; deleted: number; hasMore: boolean }> =>
    tableClear({ tableName, cursor, componentId: selectedNent?.id ?? null });

  const tableDelete = useDeleteTables();
  const deleteTable = async () => {
    try {
      const resp = await tableDelete([tableName], selectedNent?.id ?? null);
      if (!resp?.success) {
        toast("error", resp.error);
      } else {
        toast("success", "Table deleted.");
        await invalidateShapes();
      }
    } catch (err: any) {
      captureException(err);
      toast(
        "error",
        "An unknown error occurred. Please try refreshing the page.",
      );
    }
  };
  const deleteRows = async (rowIds: Set<string>) => {
    if (rowIds.size === 0) {
      return;
    }
    try {
      const resp = await deleteDocuments({
        toDelete: Array.from(rowIds).map((id) => ({ tableName, id })),
        componentId: selectedNent?.id ?? null,
      });
      if (!resp?.success) {
        toast("error", resp.error);
      } else {
        toast(
          "success",
          `Deleted ${rowIds.size} ${
            rowIds.size === 1 ? "document" : "documents"
          }.`,
        );
        await invalidateShapes();
        clearSelectedRows();
        loadMore();
      }
    } catch (err: any) {
      captureException(err);
      toast(
        "error",
        "An unknown error occurred. Please try refreshing the page.",
      );
    }
  };

  return {
    addDocuments,
    patchFields,
    deleteTable,
    clearTable,
    deleteRows,
  };
}
