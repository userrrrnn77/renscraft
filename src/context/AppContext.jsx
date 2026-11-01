// FILE: client/src/context/AppContext.jsx
//
// Fase 6: fasad. Logika sudah dipecah ke AuthContext, ProjectContext, dan
// BriefContext. File ini hanya menyusun ketiganya dan menggabungkan nilainya
// supaya `useAppContext()` dan `AppContextProvider` tetap bisa dipakai
// komponen lama tanpa perubahan.
//
// Urutan provider penting: Auth (paling luar) -> Project -> Brief.
//   - ProjectContext memakai AuthContext (user, kredit).
//   - BriefContext memakai AuthContext dan ProjectContext (createFromPrompt).

import { createContext, useContext } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ProjectProvider, useProject } from "./ProjectContext";
import { BriefProvider, useBrief } from "./BriefContext";

const AppContext = createContext(undefined);

function AppContextBridge({ children }) {
  const auth = useAuth();
  const project = useProject();
  const brief = useBrief();

  return (
    <AppContext.Provider value={{ ...auth, ...project, ...brief }}>
      {children}
    </AppContext.Provider>
  );
}

export function AppContextProvider({ children }) {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BriefProvider>
          <AppContextBridge>{children}</AppContextBridge>
        </BriefProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
}
