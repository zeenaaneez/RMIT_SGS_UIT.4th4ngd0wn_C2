export function authMode(): 'simulation' | 'tidecloak' {
  // Fail closed: a missing or misspelled setting never enables simulated identity.
  return process.env.AUTH_MODE === 'simulation' ? 'simulation' : 'tidecloak';
}
