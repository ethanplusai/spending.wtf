/**
 * useChartInteraction — Mouse/touch/keyboard tracking for chart crosshair
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface ChartInteraction {
  mouseX: number | null;
  mouseY: number | null;
  isHovering: boolean;
  nearestIndex: number;
}

export function useChartInteraction(
  svgRef: React.RefObject<SVGSVGElement | null>,
  innerWidth: number,
  marginLeft: number,
  dataLength: number
): ChartInteraction {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);
  const touchActiveRef = useRef(false);

  const getPosition = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left - marginLeft;
    const y = clientY - rect.top;
    return { x: Math.max(0, Math.min(innerWidth, x)), y };
  }, [svgRef, innerWidth, marginLeft]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleMouseMove = (e: MouseEvent) => {
      setKeyboardIndex(null);
      const pos = getPosition(e.clientX, e.clientY);
      if (pos) {
        setMouseX(pos.x);
        setMouseY(pos.y);
        setIsHovering(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setMouseX(null);
      setMouseY(null);
    };

    // Touch: only activate crosshair after horizontal movement detected
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchActiveRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);

      // Activate crosshair only if horizontal movement > vertical (prevents scroll hijack)
      if (!touchActiveRef.current) {
        if (dx > 8 && dx > dy * 1.5) {
          touchActiveRef.current = true;
          setKeyboardIndex(null);
        } else if (dy > 8) {
          // Vertical scroll — don't intercept
          return;
        } else {
          return;
        }
      }

      if (touchActiveRef.current) {
        e.preventDefault();
        const pos = getPosition(touch.clientX, touch.clientY);
        if (pos) {
          setMouseX(pos.x);
          setMouseY(pos.y);
          setIsHovering(true);
        }
      }
    };

    const handleTouchEnd = () => {
      touchActiveRef.current = false;
      setIsHovering(false);
      setMouseX(null);
      setMouseY(null);
    };

    // Keyboard: arrow keys move crosshair when chart is focused
    const handleKeyDown = (e: KeyboardEvent) => {
      if (dataLength <= 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setKeyboardIndex(prev => {
          const current = prev ?? 0;
          if (e.key === 'ArrowRight') return Math.min(dataLength - 1, current + 1);
          return Math.max(0, current - 1);
        });
        setIsHovering(true);
      } else if (e.key === 'Escape') {
        setKeyboardIndex(null);
        setIsHovering(false);
        setMouseX(null);
        setMouseY(null);
      }
    };

    const handleFocus = () => {
      // Show crosshair at first point on focus if no keyboard index set
      if (keyboardIndex === null && dataLength > 0) {
        setKeyboardIndex(0);
        setIsHovering(true);
      }
    };

    const handleBlur = () => {
      setKeyboardIndex(null);
      setIsHovering(false);
      setMouseX(null);
      setMouseY(null);
    };

    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', handleMouseLeave);
    svg.addEventListener('touchstart', handleTouchStart, { passive: true });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    svg.addEventListener('keydown', handleKeyDown);
    svg.addEventListener('focus', handleFocus);
    svg.addEventListener('blur', handleBlur);

    return () => {
      svg.removeEventListener('mousemove', handleMouseMove);
      svg.removeEventListener('mouseleave', handleMouseLeave);
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
      svg.removeEventListener('keydown', handleKeyDown);
      svg.removeEventListener('focus', handleFocus);
      svg.removeEventListener('blur', handleBlur);
    };
  }, [svgRef, getPosition, dataLength, keyboardIndex]);

  // Keyboard navigation overrides mouse position
  if (keyboardIndex !== null && dataLength > 1 && innerWidth > 0) {
    const kbX = (keyboardIndex / (dataLength - 1)) * innerWidth;
    return { mouseX: kbX, mouseY: null, isHovering: true, nearestIndex: keyboardIndex };
  }

  // Map pixel position to data index
  let nearestIndex = 0;
  if (mouseX !== null && dataLength > 1 && innerWidth > 0) {
    const ratio = mouseX / innerWidth;
    nearestIndex = Math.round(ratio * (dataLength - 1));
    nearestIndex = Math.max(0, Math.min(dataLength - 1, nearestIndex));
  }

  return { mouseX, mouseY, isHovering, nearestIndex };
}
