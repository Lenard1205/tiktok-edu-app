import { useState, useEffect, useCallback } from 'react';

interface OnlineUserStats {
  currentOnline: number;
  peakToday: number;
  peakTime: string;
  totalVisitsToday: number;
  averageOnlineToday: number;
  lastUpdated: string;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActive: number;
  userAgent: string;
  location?: string;
}

// 生成随机用户代理
const generateRandomUserAgent = () => {
  const userAgents = [
    'Chrome/119.0 Windows',
    'Chrome/118.0 macOS', 
    'Safari/17.0 iPhone',
    'Chrome/119.0 Android',
    'Firefox/120.0 Windows',
    'Edge/119.0 Windows',
    'Safari/17.0 macOS',
    'Chrome/119.0 Linux'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// 生成随机位置
const generateRandomLocation = () => {
  const locations = [
    '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都',
    '西安', '重庆', '天津', '青岛', '大连', '厦门', '苏州', '无锡'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
};

export const useOnlineUsers = () => {
  const [stats, setStats] = useState<OnlineUserStats>({
    currentOnline: 0,
    peakToday: 0,
    peakTime: '',
    totalVisitsToday: 0,
    averageOnlineToday: 0,
    lastUpdated: new Date().toLocaleString('zh-CN')
  });

  const [activeSessions, setActiveSessions] = useState<Map<string, UserSession>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // 生成会话ID
  const generateSessionId = useCallback(() => {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }, []);

  // 初始化统计数据
  const initializeStats = useCallback(() => {
    const today = new Date().toDateString();
    const savedStats = localStorage.getItem('onlineUserStats');
    const savedStatsDate = localStorage.getItem('onlineUserStatsDate');
    
    if (savedStats && savedStatsDate === today) {
      // 如果是今天的数据，加载已保存的统计
      const parsedStats = JSON.parse(savedStats);
      setStats(parsedStats);
    } else {
      // 新的一天，重置统计数据
      const initialStats = {
        currentOnline: Math.floor(Math.random() * 20) + 5, // 5-25人在线
        peakToday: 0,
        peakTime: '',
        totalVisitsToday: Math.floor(Math.random() * 100) + 50, // 50-150次访问
        averageOnlineToday: 0,
        lastUpdated: new Date().toLocaleString('zh-CN')
      };
      setStats(initialStats);
      localStorage.setItem('onlineUserStats', JSON.stringify(initialStats));
      localStorage.setItem('onlineUserStatsDate', today);
    }
  }, []);

  // 模拟用户进入
  const simulateUserJoin = useCallback(() => {
    const sessionId = generateSessionId();
    const newSession: UserSession = {
      sessionId,
      startTime: Date.now(),
      lastActive: Date.now(),
      userAgent: generateRandomUserAgent(),
      location: generateRandomLocation()
    };

    setActiveSessions(prev => new Map(prev.set(sessionId, newSession)));
    
    setStats(prev => {
      const newCurrentOnline = prev.currentOnline + 1;
      const newPeakToday = Math.max(prev.peakToday, newCurrentOnline);
      const newPeakTime = newPeakToday > prev.peakToday ? new Date().toLocaleTimeString('zh-CN') : prev.peakTime;
      
      const updatedStats = {
        ...prev,
        currentOnline: newCurrentOnline,
        peakToday: newPeakToday,
        peakTime: newPeakTime,
        totalVisitsToday: prev.totalVisitsToday + 1,
        lastUpdated: new Date().toLocaleString('zh-CN')
      };

      // 保存到localStorage
      localStorage.setItem('onlineUserStats', JSON.stringify(updatedStats));
      
      return updatedStats;
    });

    console.log(`用户加入: ${sessionId} (${newSession.location})`);
  }, [generateSessionId]);

  // 模拟用户离开
  const simulateUserLeave = useCallback(() => {
    const sessionIds = Array.from(activeSessions.keys());
    if (sessionIds.length === 0) return;

    const randomSessionId = sessionIds[Math.floor(Math.random() * sessionIds.length)];
    const session = activeSessions.get(randomSessionId);
    
    if (session) {
      setActiveSessions(prev => {
        const newSessions = new Map(prev);
        newSessions.delete(randomSessionId);
        return newSessions;
      });

      setStats(prev => {
        const newCurrentOnline = Math.max(0, prev.currentOnline - 1);
        const updatedStats = {
          ...prev,
          currentOnline: newCurrentOnline,
          lastUpdated: new Date().toLocaleString('zh-CN')
        };

        localStorage.setItem('onlineUserStats', JSON.stringify(updatedStats));
        return updatedStats;
      });

      console.log(`用户离开: ${randomSessionId} (${session.location})`);
    }
  }, [activeSessions]);

  // 更新平均在线人数
  const updateAverageOnline = useCallback(() => {
    setStats(prev => {
      const hour = new Date().getHours();
      // 简单的平均计算，实际应用中应该基于历史数据
      const estimatedAverage = Math.round((prev.peakToday + prev.currentOnline) / 2);
      
      const updatedStats = {
        ...prev,
        averageOnlineToday: estimatedAverage,
        lastUpdated: new Date().toLocaleString('zh-CN')
      };

      localStorage.setItem('onlineUserStats', JSON.stringify(updatedStats));
      return updatedStats;
    });
  }, []);

  // 获取活跃会话列表
  const getActiveSessions = useCallback(() => {
    return Array.from(activeSessions.values()).map(session => ({
      ...session,
      duration: Math.round((Date.now() - session.startTime) / 1000 / 60), // 分钟
      activeTime: Math.round((Date.now() - session.lastActive) / 1000 / 60) // 分钟前活跃
    }));
  }, [activeSessions]);

  // 手动刷新统计
  const refreshStats = useCallback(() => {
    // 模拟一些用户活动
    const randomAction = Math.random();
    if (randomAction < 0.3) {
      simulateUserJoin();
    } else if (randomAction < 0.6 && activeSessions.size > 0) {
      simulateUserLeave();
    }
    
    updateAverageOnline();
  }, [simulateUserJoin, simulateUserLeave, updateAverageOnline, activeSessions.size]);

  // 初始化和定时更新
  useEffect(() => {
    if (!isInitialized) {
      initializeStats();
      setIsInitialized(true);
    }
  }, [isInitialized, initializeStats]);

  // 模拟用户活动的定时器
  useEffect(() => {
    if (!isInitialized) return;

    const activityInterval = setInterval(() => {
      const randomAction = Math.random();
      
      if (randomAction < 0.1) { // 10% 概率有用户加入
        simulateUserJoin();
      } else if (randomAction < 0.15 && activeSessions.size > 0) { // 5% 概率有用户离开
        simulateUserLeave();
      }
    }, 10000); // 每10秒检查一次

    // 每分钟更新平均在线人数
    const averageInterval = setInterval(() => {
      updateAverageOnline();
    }, 60000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(averageInterval);
    };
  }, [isInitialized, simulateUserJoin, simulateUserLeave, updateAverageOnline, activeSessions.size]);

  return {
    stats,
    activeSessions: getActiveSessions(),
    refreshStats,
    simulateUserJoin,
    simulateUserLeave,
    isInitialized
  };
};
