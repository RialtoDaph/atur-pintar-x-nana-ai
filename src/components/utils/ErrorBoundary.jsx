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

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] bg-[#F2F4F7] flex items-center justify-center p-6 rounded-2xl">
          <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="text-base font-bold text-[#1A1A1A] mb-2">Terjadi kesalahan, coba lagi</h2>
            <p className="text-xs text-[#8FA4C8] mb-5">
              Ada yang tidak beres di bagian ini. Coba tap tombol di bawah untuk memuat ulang.
            </p>
            <button
              onClick={this.handleRetry}
              className="w-full py-3 bg-[#FF6A00] text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
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