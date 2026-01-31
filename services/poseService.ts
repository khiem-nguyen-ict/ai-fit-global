
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

// Squat Logic Constants (knee angle at hip-knee-ankle)
// More lenient thresholds for easier detection
export const SQUAT_DOWN_THRESHOLD = 120;  // Increased from 95 - detects squat earlier
export const SQUAT_UP_THRESHOLD = 145;    // Decreased from 160 - detects standing earlier

// Push-up Logic Constants (Elbow angle at shoulder-elbow-wrist)
export const PUSHUP_DOWN_THRESHOLD = 110; // Increased from 90 - detects down position easier
export const PUSHUP_UP_THRESHOLD = 150;   // Decreased from 160 - detects up position easier

// Lunge Logic Constants (Knee angle)
export const LUNGE_DOWN_THRESHOLD = 120;  // Increased from 100 - detects lunge easier
export const LUNGE_UP_THRESHOLD = 150;    // Decreased from 160 - detects standing easier
