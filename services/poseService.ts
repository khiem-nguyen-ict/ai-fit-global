
import { Point } from '../types';

/**
 * Calculate angle between three points
 * B is the vertex point
 */
export const calculateAngle = (a: Point, b: Point, c: Point): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

// Squat Logic Constants
export const SQUAT_DOWN_THRESHOLD = 95;
export const SQUAT_UP_THRESHOLD = 160;

// Push-up Logic Constants (Elbow angle)
export const PUSHUP_DOWN_THRESHOLD = 90;
export const PUSHUP_UP_THRESHOLD = 160;

// Lunge Logic Constants (Knee angle)
export const LUNGE_DOWN_THRESHOLD = 100;
export const LUNGE_UP_THRESHOLD = 160;
