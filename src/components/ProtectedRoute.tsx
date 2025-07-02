import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthService } from '../lib/adminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateSession = () => {
      try {
        const validation = AdminAuthService.validateSession();
        
        if (validation.isValid) {
          setIsAuthenticated(true);
          
          // 如果会话即将过期，提示用户
          if (validation.needsRenewal) {
            console.log('会话即将过期，建议刷新页面延长会话');
            // 可以在这里显示通知组件
          }
        } else {
          setIsAuthenticated(false);
          // 清除所有本地状态
          AdminAuthService.logout();
        }
      } catch (error) {
        console.error('会话验证失败:', error);
        setIsAuthenticated(false);
        AdminAuthService.logout();
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();

    // 定期检查会话状态（每5分钟）
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 显示加载状态
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">验证会话状态...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
