import { Component } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Route-level error boundary — isolates crashes to a single page so the
 * layout (sidebar, bottom nav) stays interactive and the user can navigate away.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("RouteErrorBoundary caught:", error, info);
  }

  componentDidUpdate(prevProps) {
    // Reset error when navigating to a different page
    if (this.state.hasError && prevProps.pageKey !== this.props.pageKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-5 py-8 sm:py-12 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center border border-[#E2E8F0]">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="text-base font-bold text-[#1A1A1A] mb-2">Halaman ini bermasalah</h2>
            <p className="text-xs text-[#8FA4C8] mb-5">
              Coba muat ulang halaman ini, atau kembali ke Dashboard.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
              >
                Coba Lagi
              </button>
              <Link
                to={createPageUrl("Dashboard")}
                onClick={this.handleRetry}
                className="block w-full py-3 bg-[#F2F4F7] text-[#1A1A1A] rounded-xl font-semibold text-sm hover:bg-[#E2E8F0] transition-colors"
              >
                Ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}