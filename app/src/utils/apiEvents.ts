export function invalidate(){window.dispatchEvent(new Event('dentiq:data'));}
export function reportError(error:unknown){window.dispatchEvent(new CustomEvent('dentiq:error',{detail:error instanceof Error?error.message:'Request failed'}));}
