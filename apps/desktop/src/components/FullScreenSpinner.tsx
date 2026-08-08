export function FullScreenSpinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-canvas">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accentScale-500" />
    </div>
  );
}
