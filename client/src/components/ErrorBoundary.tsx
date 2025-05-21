import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">
            {isRouteErrorResponse(error) 
              ? `${error.status} ${error.statusText}`
              : "Beklenmeyen Bir Hata Oluştu"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {isRouteErrorResponse(error)
              ? error.data?.message || "Sayfa bulunamadı."
              : "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."}
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Geri Dön
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex justify-center py-2 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-transparent hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Ana Sayfaya Git
          </button>
        </div>
      </div>
    </div>
  );
} 