import { ConvexProvider } from "convex/react";
import { act, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import udfs from "@common/udfs";
import { Id } from "system-udfs/convex/_generated/dataModel";
import * as nextRouter from "next/router";
import {
  FileStorageView,
  Uploader,
  useUploadFiles,
} from "@common/features/files/components/FileStorageView";
import { mockConvexReactClient } from "@common/lib/mockConvexReactClient";
import { DeploymentInfoContext } from "@common/lib/deploymentContext";
import { mockDeploymentInfo } from "@common/lib/mockDeploymentInfo";

const mockRouter = jest
  .fn()
  .mockImplementation(() => ({ route: "/", query: {} }));
(nextRouter as any).useRouter = mockRouter;

// @ts-expect-error
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ storageId: "storageID1" }),
  }),
);

const generateUploadUrl = () => "https://upload/url";

const mockClient = mockConvexReactClient()
  .registerQueryFake(udfs.fileStorageV2.fileMetadata, () => ({
    isDone: true,
    page: [
      {
        _id: "someId" as Id<"_storage">,
        _creationTime: 5,
        sha256: "123",
        size: 55,
        contentType: undefined,
        url: "https://url/to/file",
      },
    ],
    continueCursor: "",
  }))
  .registerQueryFake(udfs.fileStorageV2.numFiles, () => 1)
  .registerMutationFake(udfs.fileStorageV2.generateUploadUrl, generateUploadUrl)
  .registerQueryFake(udfs.components.list, () => []);

// TODO(react-18-upgrade) some race with act() here
describe("FileStorageContent", () => {
  beforeEach(jest.clearAllMocks);

  describe("Files", () => {
    const setup = () =>
      act(() =>
        render(
          <DeploymentInfoContext.Provider value={mockDeploymentInfo}>
            <ConvexProvider client={mockClient}>
              <FileStorageView />
            </ConvexProvider>
          </DeploymentInfoContext.Provider>,
        ),
      );

    it("should show number of files in header", async () => {
      const { getByTestId } = await setup();
      expect(getByTestId("fileCount")).toHaveTextContent("Total Files");
      expect(getByTestId("fileCount")).toHaveTextContent("1");
    });

    it("should have a row", async () => {
      const { getByText } = await setup();
      getByText("someId");
      getByText("55 B");
    });

    it("should have a download button with good url", async () => {
      const { getAllByTestId } = await setup();
      const rows = getAllByTestId("filerow");
      expect(rows.length).toEqual(1);
      const row = rows[0];
      const downloadButton = within(row).getByLabelText("Download File");
      expect(downloadButton).toHaveAttribute("download");
      expect(downloadButton).toHaveAttribute("href", "https://url/to/file");
    });
  });

  describe("Uploader", () => {
    function UploaderWithLogic() {
      const useUploadFilesResult = useUploadFiles();
      return <Uploader useUploadFilesResult={useUploadFilesResult} />;
    }

    const setup = () =>
      act(() =>
        render(
          <DeploymentInfoContext.Provider value={mockDeploymentInfo}>
            <ConvexProvider client={mockClient}>
              <UploaderWithLogic />
            </ConvexProvider>
          </DeploymentInfoContext.Provider>,
        ),
      );

    it("should upload", async () => {
      const { getByTestId } = await setup();
      const user = userEvent.setup();
      const uploader = getByTestId("uploader");
      const file = new File(["hello"], "filename");
      await user.upload(uploader, file);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("https://upload/url", {
        body: file,
        headers: undefined,
        method: "POST",
      });
    });
  });
});
