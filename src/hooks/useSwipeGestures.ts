import { useRef, useEffect, RefObject } from 'react';

interface SwipeGesturesOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  threshold?: number;
}

export const useSwipeGestures = (
  elementRef: RefObject<HTMLElement>,
  options: SwipeGesturesOptions
) => {
  const startY = useRef(0);
  const startX = useRef(0);
  const startTime = useRef(0);
  const threshold = options.threshold || 50;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStartHandler: (e: TouchEvent) => void;
    let touchEndHandler: (e: TouchEvent) => void;
    let mouseDownHandler: (e: MouseEvent) => void;
    let mouseUpHandler: (e: MouseEvent) => void;

    // 触摸事件处理
    touchStartHandler = (e: TouchEvent) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      startX.current = touch.clientX;
      startTime.current = Date.now();
      
      // 只在特定条件下阻止默认行为，避免干扰其他元素点击
      // 不阻止默认行为，让事件正常冒泡
    };

    touchEndHandler = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endY = touch.clientY;
      const endX = touch.clientX;
      const endTime = Date.now();
      
      const deltaY = endY - startY.current;
      const deltaX = endX - startX.current;
      const deltaTime = endTime - startTime.current;

      // 判断是否为快速手势 (小于300ms)
      const isFastGesture = deltaTime < 300;
      
      // 判断是否为点击 (只有提供了onTap回调时才检测点击)
      if (options.onTap && Math.abs(deltaY) < 20 && Math.abs(deltaX) < 20 && deltaTime < 300) {
        options.onTap();
        return;
      }

      // 垂直滑动
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          options.onSwipeDown?.();
        } else {
          options.onSwipeUp?.();
        }
      }
      // 水平滑动
      else if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      }
    };

    // 鼠标事件处理 (用于桌面端测试)
    mouseDownHandler = (e: MouseEvent) => {
      startY.current = e.clientY;
      startX.current = e.clientX;
      startTime.current = Date.now();
    };

    mouseUpHandler = (e: MouseEvent) => {
      const endY = e.clientY;
      const endX = e.clientX;
      const endTime = Date.now();
      
      const deltaY = endY - startY.current;
      const deltaX = endX - startX.current;
      const deltaTime = endTime - startTime.current;

      // 判断是否为点击 (只有提供了onTap回调时才检测点击)
      if (options.onTap && Math.abs(deltaY) < 20 && Math.abs(deltaX) < 20 && deltaTime < 300) {
        options.onTap();
        return;
      }

      // 垂直滑动
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          options.onSwipeDown?.();
        } else {
          options.onSwipeUp?.();
        }
      }
      // 水平滑动
      else if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      }
    };

    // 添加事件监听器
    element.addEventListener('touchstart', touchStartHandler, { passive: true });
    element.addEventListener('touchend', touchEndHandler, { passive: true });
    element.addEventListener('mousedown', mouseDownHandler);
    element.addEventListener('mouseup', mouseUpHandler);

    // 清理事件监听器
    return () => {
      element.removeEventListener('touchstart', touchStartHandler);
      element.removeEventListener('touchend', touchEndHandler);
      element.removeEventListener('mousedown', mouseDownHandler);
      element.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [options, threshold]);
};
