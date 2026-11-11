// src/components/AdsterraBanner.jsx
import { useEffect, useRef } from "react";

// Data dari dashboard Adsterra lo bre
const AD_CONFIG = {
  desktop728x90: {
    key: "e47a17bfede0b18129db7164288ac1fa",
    width: 728,
    height: 90,
  },
  mobile320x50: {
    key: "d204ce7bb2c7d0a857e45cf96ba80b7f",
    width: 320,
    height: 50,
  },
  square300x250: {
    key: "5666141388f5058e9a4bf4c4c39dc112",
    width: 300,
    height: 250,
  },
};

export default function AdsterraBanner({
  type = "desktop728x90",
  className = "",
}) {
  const iframeRef = useRef(null);
  const config = AD_CONFIG[type];

  useEffect(() => {
    if (!iframeRef.current || !config) return;

    // Kita tulis script Adsterra langsung ke dalam iframe
    const doc = iframeRef.current.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>body { margin: 0; padding: 0; background: transparent; display: flex; justify-content: center; align-items: center; height: 100%; }</style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${config.key}',
              'format' : 'iframe',
              'height' : ${config.height},
              'width' : ${config.width},
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://bauval.org/22/${config.key}"></script>
        </body>
      </html>
    `);
    doc.close();
  }, [config]);

  return (
    <div
      className={`flex justify-center overflow-hidden ${className}`}
      style={{ maxWidth: "100%" }}>
      <iframe
        ref={iframeRef}
        title="Advertisement"
        width={config?.width}
        height={config?.height}
        frameBorder="0"
        scrolling="no"
        style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
      />
    </div>
  );
}
