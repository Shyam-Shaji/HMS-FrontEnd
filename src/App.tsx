import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "./lib/query-client";
import { AuthProvider } from "./context/auth-context";
import { AppRouter } from "./routes/router";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
        <AppRouter />
        </BrowserRouter>
        {/* Single toast host for the whole app - every page just calls
            toast.success()/toast.error() from 'sonner', no provider wiring
            needed at the call site. */}
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App;
