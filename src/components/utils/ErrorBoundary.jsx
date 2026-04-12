import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🔌</div>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-[#8FA4C8] mb-6">
              Koneksi bermasalah atau ada error tak terduga. Periksa internet kamu dan coba lagi.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-bold text-sm hover:bg-[#E55A00] transition-colors"
            >
              Coba Lagi
            </button>

          </div>
        </div>
      );
    }
    return this.props.children;
  }
}