import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BuilderHeader from "../components/BuilderHeader";
import { FolderTreeIcon, ImageIcon, MessageSquareIcon } from "lucide-react";
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

  // Tab config biar nggak nulis 3x conditional
  const TABS = [
    { id: "chat", label: "Chat", Icon: MessageSquareIcon },
    { id: "files", label: "Files", Icon: FolderTreeIcon },
    { id: "images", label: "Images", Icon: ImageIcon },
  ];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-zinc-900 relative dark:bg-zinc-950 dark:text-zinc-50">
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        credits={credits}
        showCode={showCode}
        publishing={publishing}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handlePublish}
        onDonwload={handleDownload}
        onBack={() => navigate("/chat")}
        onProfile={() => navigate("/profile")}
        onMyProjects={() => navigate("/my-projects")}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* left sidebar */}
        <div className="w-[320px] shrink-0 flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex border-b border-zinc-100 dark:border-zinc-800">
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

          <div className="flex-1 overflow-hidden">
            {letfTab === "chat" ? (
              <ChatPanel
                messages={activeProject.messages}
                onSend={handleChat}
                loading={chatLoading}
                disabled={isFailed}
              />
            ) : letfTab === "files" ? (
              <FileExplorer
                files={activeProject.files}
                activeFile={activeFile}
                onFileSelect={(path) => {
                  setActiveFile(path);
                  setShowCode(true);
                }}
              />
            ) : (
              <BuilderImageUploader
                projectId={activeProject._id}
                initialImages={activeProject.uploadedImages || []}
                onChange={() => {
                  // Silent refresh biar aktif project sinkron sama server
                  // (yang udah punya list terbaru). Nggak toast, biar nggak
                  // ganggu kerjaan user.
                  loadProject(activeProject._id, true);
                }}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
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
