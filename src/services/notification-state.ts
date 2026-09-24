type Listener = () => void;

const listeners = new Set<Listener>();

export function requestNotificationStateRefresh() {
  for (const listener of listeners) listener();
}

export function subscribeToNotificationState(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
