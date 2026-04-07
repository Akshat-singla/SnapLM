type NavigateFn = (path: string) => void;

let impl: NavigateFn | null = null;

export function registerSpaNavigation(fn: NavigateFn | null) {
  impl = fn;
}

export function spaNavigate(path: string) {
  impl?.(path);
}
