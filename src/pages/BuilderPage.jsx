// src/pages/BuilderPage.jsx

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
import BuilderImageUploader from "../components/BuilderImageUploader";
import BuilderDataTab from "../components/BuilderDataTab";
import SubdomainModal from "../components/SubdomainModal";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import { exportProjectZip } from "../utils/exportProject";
import api, { errorMessage, isInsufficientCredits } from "../api/api";
import toast from "react-hot-toast";

const DEFAULT_EXPORT_COST = 30;

const BuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [letfTab, setLeftTab] = useState("chat");
  const [mobileView, setMobileView] = useState("chat");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSubdomainModal, setShowSubdomainModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

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
    refreshCredits, //
  } = useAppContext();

  const exportCost = activeProject?.exportCost ?? DEFAULT_EXPORT_COST;

  useEffect(() => {
    if (!id) return;
    loadProject(id);
  }, [id]);

  const handleOpenPreview = () => {
    if (!id) return;
    window.open(`/preview/${id}`, "_blank");
  };

  // Ganti nama fungsi jadi handleOpenSubdomain
  const handleOpenSubdomain = () => {
    if (!id) return;
    setShowSubdomainModal(true);
  };

  const openExportModal = () => {
    if (!activeProject || exporting) return;
    setShowExportModal(true);
  };

  const handleDownload = async () => {
    if (!activeProject || exporting) return;
    setExporting(true);
    try {
      await api.post(`/api/projects/${activeProject._id}/export`);
      await refreshCredits();
      exportProjectZip({ ...activeProject, files: getLatestFiles() });
      toast.success("Export berhasil!");
      setShowExportModal(false);
    } catch (err) {
      if (isInsufficientCredits(err)) {
        toast.error(errorMessage(err, "Kredit tidak cukup untuk export."));
      } else {
        toast.error(errorMessage(err, "Gagal export project."));
      }
      setShowExportModal(false);
    } finally {
      setExporting(false);
    }
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

  // Karena fitur dynamic app di-hold, tab data kita sembunyiin dulu
  const showDataTab = false; // dynamicAppsEnabled && activeProject.status === "completed";

  const TABS = [
    { id: "chat", label: "Chat", Icon: MessageSquareIcon },
    { id: "files", label: "Files", Icon: FolderTreeIcon },
    { id: "images", label: "Images", Icon: ImageIcon },
    ...(showDataTab ? [{ id: "data", label: "Data", Icon: DatabaseIcon }] : []),
  ];

  return (
    <div className="h-dvh flex flex-col bg-white overflow-hidden text-zinc-900 relative dark:bg-zinc-950 dark:text-zinc-50">
      <BuilderHeader
        projectName={activeProject.name}
        version={activeProject.version}
        credits={credits}
        showCode={showCode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onToggleShowCode={() => setShowCode(!showCode)}
        onOpenPreview={handleOpenPreview}
        onPublish={handleOpenSubdomain}
        publishing={false}
        onDonwload={openExportModal}
        exporting={exporting}
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
        <div
          className={`shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ease-in-out ${
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
            ) : letfTab === "data" ? (
              <BuilderDataTab project={activeProject} />
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

      {/* TAMPILIN MODAL SUBDOMAIN */}
      {showSubdomainModal && (
        <SubdomainModal
          project={activeProject}
          onClose={() => setShowSubdomainModal(false)}
          onSuccess={() => {
            // Refresh project biar data customSubdomain-nya keupdate
            loadProject(id, true);
          }}
        />
      )}
      <ConfirmModal
        open={showExportModal}
        title={t("builder.exportConfirmTitle")}
        description={t("builder.exportConfirmBody", { cost: exportCost })}
        confirmLabel={t("builder.exportConfirmButton")}
        cancelLabel={t("common.cancel")}
        busyLabel={t("builder.exporting")}
        busy={exporting}
        onConfirm={handleDownload}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};

export default BuilderPage;
