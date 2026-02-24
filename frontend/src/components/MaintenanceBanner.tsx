import { useTranslation } from "react-i18next";

export function MaintenanceBanner(): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="maintenance-banner">
      <p>{t("maintenance.banner")}</p>
    </div>
  );
}
