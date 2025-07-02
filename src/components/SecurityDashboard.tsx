import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Lock, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Download,
  Search,
  Calendar,
  Trash2,
  RefreshCw,
  UserCheck,
  Globe,
  Clock,
  TrendingUp
} from 'lucide-react';
import { AdminAuthService } from '../lib/adminAuth';
import { AuditLogger } from '../lib/security';
import { useOnlineUsers } from '../hooks/useOnlineUsers';

const SecurityDashboard: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 在线用户统计
  const { stats, activeSessions, refreshStats, simulateUserJoin, simulateUserLeave, isInitialized } = useOnlineUsers();

  // 加载安全状态
  useEffect(() => {
    loadSecurityStatus();
    loadAuditLogs();
  }, []);

  // 搜索日志
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = auditLogs.filter(log =>
        log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(auditLogs);
    }
  }, [searchQuery, auditLogs]);

  const loadSecurityStatus = () => {
    const status = AdminAuthService.getSecurityStatus();
    setSecurityStatus(status);
  };

  const loadAuditLogs = () => {
    const logData = AdminAuthService.getAuditLogs(1, 100);
    setAuditLogs(logData.logs);
    setFilteredLogs(logData.logs);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setMessage({ type: 'error', text: '新密码确认不匹配' });
        return;
      }

      const session = AdminAuthService.validateSession();
      if (!session.isValid) {
        setMessage({ type: 'error', text: '会话已过期，请重新登录' });
        return;
      }

      const result = await AdminAuthService.changePassword(
        session.user.userId,
        passwordForm.oldPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setMessage({ type: 'success', text: '密码更改成功' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
      } else {
        setMessage({ type: 'error', text: result.error || '密码更改失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '密码更改过程中发生错误' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuditLogs = () => {
    if (window.confirm('确定要清除所有审计日志吗？此操作不可恢复。')) {
      const session = AdminAuthService.validateSession();
      if (session.isValid) {
        const success = AdminAuthService.clearAuditLogs(session.user.userId);
        if (success) {
          setMessage({ type: 'success', text: '审计日志已清除' });
          loadAuditLogs();
        } else {
          setMessage({ type: 'error', text: '权限不足，无法清除日志' });
        }
      }
    }
  };

  const exportLogs = () => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  if (!securityStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
          message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
          'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* 安全状态概览 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">安全状态概览</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-green-300 text-2xl font-bold">{securityStatus.enabledUsers}</p>
                <p className="text-gray-400 text-sm">活跃用户</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-red-300 text-2xl font-bold">{securityStatus.lockedUsers}</p>
                <p className="text-gray-400 text-sm">锁定账户</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-300 text-2xl font-bold">{securityStatus.totalLogs}</p>
                <p className="text-gray-400 text-sm">审计日志</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-yellow-300 text-2xl font-bold">{securityStatus.recentFailedLogins}</p>
                <p className="text-gray-400 text-sm">今日失败登录</p>
              </div>
            </div>
          </div>
        </div>

        {/* 最后活动时间 */}
        {securityStatus.lastActivity > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
            <p className="text-blue-300 text-sm">
              最后活动: {formatTimestamp(securityStatus.lastActivity)}
            </p>
          </div>
        )}
      </div>

      {/* 在线用户统计 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">在线用户统计</h2>
          </div>
          <button
            onClick={refreshStats}
            className="px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2"
            disabled={!isInitialized}
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>

        {isInitialized ? (
          <>
            {/* 主要统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Globe className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-green-300 text-3xl font-bold">{stats.currentOnline}</p>
                    <p className="text-gray-400 text-sm">当前在线</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-blue-300 text-2xl font-bold">{stats.peakToday}</p>
                    <p className="text-gray-400 text-sm">今日峰值</p>
                    {stats.peakTime && (
                      <p className="text-gray-500 text-xs">{stats.peakTime}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-purple-300 text-2xl font-bold">{stats.totalVisitsToday}</p>
                    <p className="text-gray-400 text-sm">今日访问</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Activity className="w-8 h-8 text-orange-400" />
                  <div>
                    <p className="text-orange-300 text-2xl font-bold">{stats.averageOnlineToday}</p>
                    <p className="text-gray-400 text-sm">平均在线</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 活跃会话详情 */}
            {activeSessions.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-medium text-white">活跃会话 ({activeSessions.length})</h3>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {activeSessions.slice(0, 10).map((session, index) => (
                    <div key={session.sessionId} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {session.location || '未知位置'} - {session.userAgent}
                          </p>
                          <p className="text-gray-400 text-xs">
                            在线 {session.duration} 分钟
                            {session.activeTime > 0 && `, ${session.activeTime} 分钟前活跃`}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        #{session.sessionId.split('_')[1]}
                      </div>
                    </div>
                  ))}
                  {activeSessions.length > 10 && (
                    <div className="text-center text-gray-400 text-sm py-2">
                      还有 {activeSessions.length - 10} 个活跃会话...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 模拟操作按钮 */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={simulateUserJoin}
                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                模拟用户加入
              </button>
              <button
                onClick={simulateUserLeave}
                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                disabled={activeSessions.length === 0}
              >
                模拟用户离开
              </button>
            </div>

            {/* 最后更新时间 */}
            <div className="mt-4 text-right">
              <p className="text-gray-400 text-sm">
                最后更新: {stats.lastUpdated}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>正在加载在线用户统计...</span>
            </div>
          </div>
        )}
      </div>

      {/* 安全操作 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">安全操作</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            更改密码
          </button>
          <button
            onClick={loadSecurityStatus}
            className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新状态</span>
          </button>
        </div>

        {/* 更改密码表单 */}
        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">当前密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">新密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">确认新密码</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? '更新中...' : '更新密码'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 审计日志 */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">审计日志</h3>
          <div className="flex space-x-2">
            <button
              onClick={exportLogs}
              className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-1 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
            <button
              onClick={clearAuditLogs}
              className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-1 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>清除</span>
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索日志..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 日志列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">没有找到日志记录</p>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={log.id || index} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs ${getLogLevelColor(log.level)}`}>
                        {log.level?.toUpperCase() || 'INFO'}
                      </span>
                      <span className="text-white font-medium">{log.event}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{formatTimestamp(log.timestamp)}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
