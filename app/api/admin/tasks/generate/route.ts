// Keep the legacy admin endpoint on the same implementation as the task
// generator UI. This prevents the two admin paths from drifting apart.
export { POST, maxDuration } from '../override/route';
