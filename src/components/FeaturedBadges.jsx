import React from "react";
import { useTranslation } from "react-i18next";

const FeaturedBadges = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-center">
        {t("landing.featuredOn", "Featured On")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 px-4">
        {/* NxGn Tools */}
        <a
          href="https://www.nxgntools.com/tools/renscraft?utm_source=renscraft"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform duration-200 hover:scale-105">
          <img
            src="https://www.nxgntools.com/api/embed/renscraft?type=FEATURED_ON"
            alt="Featured on NxGn Tools"
            className="h-10 sm:h-12 w-auto"
          />
        </a>

        {/* LaunchBuff */}
        <a
          href="https://launchbuff.com/products/renscraft-5gwz1l"
          target="_blank"
          rel="noopener noreferrer"
          title="Featured on LaunchBuff"
          className="transition-transform duration-200 hover:scale-105">
          <img
            src="https://launchbuff.com/badge-featured-light.svg"
            alt="Featured on LaunchBuff"
            className="block dark:hidden h-10 sm:h-12 w-auto"
          />
          <img
            src="https://launchbuff.com/badge-featured-dark.svg"
            alt="Featured on LaunchBuff"
            className="hidden dark:block h-10 sm:h-12 w-auto"
          />
        </a>

        {/* LaunchNest */}
        <a
          href="https://launchnest.io/p/renscraft"
          target="_blank"
          rel="noopener noreferrer"
          title="Renscraft on LaunchNest"
          className="transition-transform duration-200 hover:scale-105">
          <img
            src="https://launchnest.io/badge/renscraft.svg?variant=featured&theme=light"
            alt="Renscraft on LaunchNest"
            className="block dark:hidden h-10 sm:h-12 w-auto"
          />
          <img
            src="https://launchnest.io/badge/renscraft.svg?variant=featured"
            alt="Renscraft on LaunchNest"
            className="hidden dark:block h-10 sm:h-12 w-auto"
          />
        </a>

        {/* Launchstag */}
        <a
          href="https://launchstag.com/p/renscraft"
          target="_blank"
          rel="noopener noreferrer"
          title="Featured on Launchstag"
          className="transition-transform duration-200 hover:scale-105">
          <img
            src="https://launchstag.com/badge-light.svg"
            alt="Featured on Launchstag"
            className="block dark:hidden h-10 sm:h-12 w-auto"
          />
          <img
            src="https://launchstag.com/badge-dark.svg"
            alt="Featured on Launchstag"
            className="hidden dark:block h-10 sm:h-12 w-auto"
          />
        </a>
      </div>
    </div>
  );
};

export default FeaturedBadges;
