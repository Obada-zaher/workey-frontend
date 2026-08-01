import { get } from "./client";
import type { GuestHome } from "./types";
export function getGuestHome(signal?: AbortSignal): Promise<GuestHome> { return get<GuestHome>("/home", { signal }); }
