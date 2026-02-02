
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

// Body Position Validation Constants
export const BODY_TOO_CLOSE_THRESHOLD = 0.85;  // If body height > 85% of frame, user is too close
export const BODY_MARGIN = 0.05;  // 5% margin from edges

/**
 * Check if user is too close to camera (body doesn't fit in frame)
 * Returns true if user is too close, false if position is good
 */
export const isUserTooClose = (poseLandmarks: any[], frameWidth: number, frameHeight: number): boolean => {
  if (!poseLandmarks || poseLandmarks.length === 0) return false;

  // Key landmarks to check for full body visibility
  // MediaPipe Pose landmarks: 0=nose, 11=left_shoulder, 12=right_shoulder
  // 23=left_hip, 24=right_hip, 27=left_ankle, 28=right_ankle

  const nose = poseLandmarks[0];
  const leftAnkle = poseLandmarks[27];
  const rightAnkle = poseLandmarks[28];
  const leftShoulder = poseLandmarks[11];
  const rightShoulder = poseLandmarks[12];

  // Check if essential landmarks are visible (confidence > 0.5)
  if (!nose || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) {
    return true; // Assume too close if landmarks missing
  }

  const minConfidence = 0.5;
  if (nose.visibility < minConfidence || 
      leftAnkle.visibility < minConfidence || 
      rightAnkle.visibility < minConfidence ||
      leftShoulder.visibility < minConfidence || 
      rightShoulder.visibility < minConfidence) {
    return true;
  }

  // Calculate body bounding box
  const minX = Math.min(leftShoulder.x, rightShoulder.x, leftAnkle.x, rightAnkle.x);
  const maxX = Math.max(leftShoulder.x, rightShoulder.x, leftAnkle.x, rightAnkle.x);
  const minY = Math.min(nose.y, leftShoulder.y, rightShoulder.y);
  const maxY = Math.max(leftAnkle.y, rightAnkle.y);

  // Check if body is within margins
  const margin = BODY_MARGIN;
  const withinHorizontalBounds = minX >= margin && maxX <= (1 - margin);
  const withinVerticalBounds = minY >= margin && maxY <= (1 - margin);

  if (!withinHorizontalBounds || !withinVerticalBounds) {
    return true; // Body is too close to edges
  }

  // Calculate body height as percentage of frame
  const bodyHeight = maxY - minY;
  
  // If body height > threshold, user is too close
  if (bodyHeight > BODY_TOO_CLOSE_THRESHOLD) {
    return true;
  }

  return false;
};
