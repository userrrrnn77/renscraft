import { FileCodeIcon, FileTextIcon, FolderOpenIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const buildTree = (paths) => {
  const root = [];
  for (const filePath of paths.sort()) {
    const parts = filePath.split("/").filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = "/" + parts.slice(0, i + 1).join("/");
      let existing = current.find((n) => n.name === name);

      if (!existing) {
        existing = {
          name,
          path: fullPath,
          isDir: !isLast,
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
};

const getFileIcon = (name) => {
  if (name.endsWith(".css"))
    return <FileTextIcon size={14} className="text-sky-500 shrink-0" />;
  if (name.endsWith(".jsx") || name.endsWith(".js"))
    return <FileCodeIcon size={14} className="text-amber-500 shrink-0" />;
  if (name.endsWith(".json"))
    return <FileTextIcon size={14} className="text-emerald-500 shrink-0" />;
  return (
    <FileTextIcon
      size={14}
      className="text-zinc-500 dark:text-zinc-400 shrink-0"
    />
  );
};

const TreeItem = ({ node, activeFile, onFileSelect, depth = 0 }) => {
  const isActive = node.path === activeFile;

  if (node.isDir) {
    return (
      <div>
        <div
          className="flex items-center gap-2 py-1 px-2 text-xs text-zinc-400 select-none dark:text-zinc-500"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}>
          <FolderOpenIcon
            size={14}
            className="text-zinc-600 opacity-60 dark:text-zinc-400"
          />
          <span>{node.name}</span>
        </div>
        {node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`w-full flex items-center gap-2 py-1.5 px-2 text-xs transition-colors rounded-md cursor-pointer ${
        isActive
          ? "bg-zinc-100 text-zinc-950 font-medium dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}>
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  );
};

const FileExplorer = ({ files, activeFile, onFileSelect }) => {
  const { t } = useTranslation();
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);

  return (
    <div className="py-2 overflow-y-auto hide-scrollbar">
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {t("files.filesLabel")}
      </p>
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          activeFile={activeFile}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
};

export default FileExplorer;
