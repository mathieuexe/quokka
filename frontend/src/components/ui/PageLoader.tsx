import "./PageLoader.css";

export function PageLoader(): JSX.Element {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-spinner"></div>
    </div>
  );
}

export default PageLoader;