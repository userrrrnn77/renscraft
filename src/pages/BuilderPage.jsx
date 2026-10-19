import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BuilderHeader from "../components/BuilderHeader";
import {
  FolderTreeIcon,
  ImageIcon,
  MessageSquareIcon,
  MonitorPlayIcon,
  MenuIcon,
} from "lucide-react";
import ChatPanel from "../components/ChatPanel";
import FileExplorer from "../components/FileExplorer";
import PreviewPanel from "../components/PreviewPanel";
import AgentProgressDashboard from "../components/AgentProgressDashboard";
import PublishModal from "../components/PublishModal";
import BuilderImageUploader from "../components/BuilderImageUploader";
import api from "../api/api";
import toast from "react-hot-toast";
import { exportProjectZip } from "../utils/exportProject";

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [letfTab, setLeftTab] = useState("chat");
  const [mobileView, setMobileView] = useState("chat"); // "chat" atau "preview"

  // STATE BARU: Buat nampilin/nyembunyiin sidebar di desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [publishing, setPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState(null);

  const {
    activeProject,
    loadingActiveProject,
    credits,
    activeFile,
    showCode,
    setActiveFile,
    setShowCode,
    loadProject,
    chatLoading,
    handleChat,
    getLatestFiles,
    createFromPrompt,
  } = useAppContext();

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id]);

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank");
  };

  const handlePublish = async () => {
    if (!id) return;

    setPublishing(true);
    try {
      const { data } = await api.post(`/api/projects/${id}/publish`);
      const key = data?.slug ?? data?.name ?? activeProject?.name ?? id;
      const url = `${window.location.origin}/publish/${encodeURIComponent(key)}`;
      setPublishUrl(url);
      toast.success("Website publish successfully");
    } catch (err) {
      console.error("Publish Failed: ", err);
      toast.error(err?.response?.data?.error || "Publish Failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleDownload = () => {
    if (!activeProject) return;
    exportProjectZip({ ...activeProject, files: getLatestFiles() });
  };

  const handleRetryWithSamePrompt = async () => {
    if (!activeProject) return;
    const prompt = activeProject.description;
    if (!prompt) {
      toast.error("Original prompt is missing, please start fresh.");
      navigate("/chat");
      return;
    }
    await api.delete(`/api/projects/${activeProject._id}`).catch(() => {});
    await createFromPrompt(prompt);
  };

  const handleRetryWithNewPrompt = () => {
    navigate("/chat");
  };

  if (loadingActiveProject || !activeProject) {
    return <Loading />;
  }

  const isFailed = activeProject.status === "failed";
  const showProgress =
    activeProject.status === "pending" ||
    activeProject.status === "generating" ||
    isFailed;

  const TABS = [
    { id: "chat", label: "Chat", Icon: MessageSquareIcon },
    { id: "files", label: "Files", Icon: FolderTreeIcon },
    { id: "images", label: "Images", Icon: ImageIcon },
  ];

  return (
    <div className="h-dvh flex flex-col bg-white overflow-hidden text-zinc-900 relative dark:bg-zinc-950 dark:text-zinc-50">
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        credits={credits}
        showCode={showCode}
        publishing={publishing}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDonwload={handleDownload}
        onBack={() => navigate("/chat")}
        onProfile={() => navigate("/profile")}
        onMyProjects={() => navigate("/my-projects")}
      />

      <div className="md:hidden flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 z-10">
        <button
          onClick={() => setMobileView("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors ${
            mobileView === "chat"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}>
          <MenuIcon size={14} /> Chat & Files
        </button>
        <button
          onClick={() => setMobileView("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors ${
            mobileView === "preview"
              ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}>
          <MonitorPlayIcon size={14} /> Preview
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar (Chat/Files/Images) */}
        <div
          className={`shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ease-in-out ${
            // Di Mobile: pakai logika tab. Di Desktop: pakai state isSidebarOpen
            mobileView === "chat" ? "flex w-full" : "hidden md:flex"
          } ${
            isSidebarOpen
              ? "md:w-[320px] opacity-100"
              : "md:w-0 md:opacity-0 md:border-none md:overflow-hidden"
          } h-full`}>
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 shrink-0 w-full md:w-[320px]">
            {TABS.map(({ id: tabId, label, Icon }) => {
              const active = letfTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => setLeftTab(tabId)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer transition-colors ${
                    active
                      ? "text-zinc-900 border-b-2 border-zinc-900 dark:text-zinc-50 dark:border-zinc-50"
                      : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-hidden w-full md:w-[320px]">
            {letfTab === "chat" ? (
              <ChatPanel
                messages={activeProject.messages}
                onSend={handleChat}
                loading={chatLoading}
                disabled={isFailed}
                // Bisa ditutup dari dalam ChatPanel (khusus desktop)
                onClose={() => setIsSidebarOpen(false)}
              />
            ) : letfTab === "files" ? (
              <FileExplorer
                files={activeProject.files}
                activeFile={activeFile}
                onFileSelect={(path) => {
                  setActiveFile(path);
                  setShowCode(true);
                  if (window.innerWidth < 768) setMobileView("preview");
                }}
              />
            ) : (
              <BuilderImageUploader
                projectId={activeProject._id}
                initialImages={activeProject.uploadedImages || []}
                onChange={() => {
                  loadProject(activeProject._id, true);
                }}
              />
            )}
          </div>
        </div>

        {/* Right content (Preview / Progress) */}
        <div
          className={`flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-900 ${
            mobileView === "preview"
              ? "flex flex-col"
              : "hidden md:flex md:flex-col"
          } h-full`}>
          {showProgress ? (
            <AgentProgressDashboard
              project={activeProject}
              onBack={() => navigate("/chat")}
              onRetry={handleRetryWithSamePrompt}
              onRetryNew={handleRetryWithNewPrompt}
            />
          ) : (
            <PreviewPanel
              activeFile={activeFile}
              project={activeProject}
              showCode={showCode}
            />
          )}
        </div>
      </div>

      {publishUrl && (
        <PublishModal
          publishUrl={publishUrl}
          onClose={() => setPublishUrl(null)}
        />
      )}
    </div>
  );
};

export default BuilderPage;
