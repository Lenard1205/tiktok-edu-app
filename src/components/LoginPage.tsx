import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, User, Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { AdminAuthService } from '../lib/adminAuth';
import { LoginAttemptManager } from '../lib/security';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // 检查账户锁定状态
  useEffect(() => {
    const checkLockoutStatus = () => {
      const locked = LoginAttemptManager.isAccountLocked(username);
      setIsLocked(locked);
      
      if (locked) {
        const remaining = LoginAttemptManager.getRemainingLockoutTime(username);
        setLockoutRemaining(remaining);
      }
      
      const attempts = LoginAttemptManager.getFailedAttempts(username);
      setFailedAttempts(attempts);
    };

    if (username) {
      checkLockoutStatus();
      const interval = setInterval(checkLockoutStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [username]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 输入验证
      if (!username.trim() || !password.trim()) {
        setError('请输入用户名和密码');
        setIsLoading(false);
        return;
      }

      if (requiresTwoFactor && !totpCode.trim()) {
        setError('请输入双重验证码');
        setIsLoading(false);
        return;
      }

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      // 使用安全认证服务
      const result = await AdminAuthService.authenticateAdmin(
        username.trim(),
        password,
        totpCode || undefined
      );

      if (result.success && result.token) {
        // 登录成功
        navigate('/admin');
      } else if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('请输入双重验证码');
      } else if (result.lockoutRemaining) {
        setIsLocked(true);
        setLockoutRemaining(result.lockoutRemaining);
        const minutes = Math.ceil(result.lockoutRemaining / (60 * 1000));
        setError(`账户已被锁定，请在 ${minutes} 分钟后重试`);
      } else {
        setError(result.error || '登录失败');
        setFailedAttempts(LoginAttemptManager.getFailedAttempts(username));
      }
    } catch (error) {
      setError('登录过程中发生错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化倒计时
  const formatLockoutTime = (ms: number): string => {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 获取安全状态指示器
  const getSecurityIndicator = () => {
    if (isLocked) {
      return { icon: Lock, color: 'text-red-500', text: '账户锁定' };
    }
    if (failedAttempts > 0) {
      return { icon: AlertTriangle, color: 'text-yellow-500', text: `失败尝试: ${failedAttempts}/5` };
    }
    return { icon: Shield, color: 'text-green-500', text: '安全状态正常' };
  };

  const securityIndicator = getSecurityIndicator();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-16 left-0 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* 登录卡片 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">安全管理登录</h1>
            <p className="text-gray-400">企业级安全认证系统</p>
            
            {/* 安全状态指示器 */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <securityIndicator.icon className={`w-4 h-4 ${securityIndicator.color}`} />
              <span className={`text-sm ${securityIndicator.color}`}>
                {securityIndicator.text}
              </span>
            </div>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入安全密码"
                  required
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 双重验证码 */}
            {requiresTwoFactor && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  双重验证码
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center tracking-wider"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  请输入您的认证器应用中显示的6位数字
                </p>
              </div>
            )}

            {/* 锁定倒计时 */}
            {isLocked && lockoutRemaining > 0 && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">账户已被锁定</span>
                </div>
                <p className="text-red-200 text-sm mb-2">
                  由于多次登录失败，账户已被临时锁定
                </p>
                <div className="text-center">
                  <span className="text-red-300 text-lg font-mono">
                    {formatLockoutTime(lockoutRemaining)}
                  </span>
                  <p className="text-red-200 text-xs">剩余解锁时间</p>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {error && !isLocked && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
                {failedAttempts > 0 && (
                  <p className="text-red-200 text-xs mt-1">
                    失败尝试: {failedAttempts}/5 次，{5 - failedAttempts} 次后账户将被锁定
                  </p>
                )}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>验证中...</span>
                </div>
              ) : isLocked ? (
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>账户已锁定</span>
                </div>
              ) : requiresTwoFactor ? (
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>验证双重认证</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>安全登录</span>
                </div>
              )}
            </button>
          </form>

          {/* 安全特性说明 */}
          <div className="mt-6 space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="text-center">
                <h3 className="text-green-300 text-sm font-medium mb-2">安全特性</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-200">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>密码加密存储</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>登录限制保护</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>会话安全管理</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>操作审计日志</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 联系信息 */}
            <div className="text-center">
              <p className="text-gray-400 text-xs">
                如需重置密码或技术支持，请联系系统管理员
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
