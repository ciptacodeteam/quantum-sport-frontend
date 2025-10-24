import { Spinner } from '../ui/spinner';

const ScreenLoading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-3 p-4"
      >
        <Spinner className="text-primary size-9" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
};
export default ScreenLoading;
