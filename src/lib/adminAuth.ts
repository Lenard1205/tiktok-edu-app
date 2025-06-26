import { PasswordUtils, LoginAttemptManager, SessionManager, AuditLogger } from './security';

// 安全的管理员认证系统
export interface AdminUser {
  id: string;
  username: string;
  role: string;
  passwordHash: string;
  passwordSalt: string;
  isEnabled: boolean;
  lastLogin?: number;
  failedAttempts: number;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
}

// 生产环境配置 - 这些应该来自环境变量
const PRODUCTION_CONFIG = {
  // 默认管理员账户配置
  DEFAULT_ADMIN: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'TikTokEdu@2024!',
  },
  // 安全设置
  REQUIRE_STRONG_PASSWORD: true,
  ENABLE_ACCOUNT_LOCKOUT: true,
  ENABLE_AUDIT_LOGGING: true,
  // 会话安全
  FORCE_SESSION_RENEWAL: true,
  ENABLE_CONCURRENT_SESSION_LIMIT: true,
  MAX_CONCURRENT_SESSIONS: 3,
};

export class AdminAuthService {
  private static USERS_KEY = 'admin_users_v2';
  private static SESSIONS_KEY = 'admin_active_sessions';

  // 初始化默认管理员账户
  static initializeDefaultAdmin(): void {
    const users = this.getAllUsers();
    
    // 检查是否已存在管理员
    const adminExists = users.some(user => user.username === PRODUCTION_CONFIG.DEFAULT_ADMIN.username);
    
    if (!adminExists) {
      const { hash, salt } = PasswordUtils.hashPassword(PRODUCTION_CONFIG.DEFAULT_ADMIN.password);
      
      const defaultAdmin: AdminUser = {
        id: 'admin-' + Date.now(),
        username: PRODUCTION_CONFIG.DEFAULT_ADMIN.username,
        role: 'super_admin',
        passwordHash: hash,
        passwordSalt: salt,
        isEnabled: true,
        failedAttempts: 0,
        locked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        twoFactorEnabled: false,
      };

      users.push(defaultAdmin);
      this.saveUsers(users);
      
      AuditLogger.log('默认管理员账户初始化', { username: defaultAdmin.username });
    }
  }

  // 管理员登录
  static async authenticateAdmin(username: string, password: string, totpCode?: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
    requiresTwoFactor?: boolean;
    lockoutRemaining?: number;
  }> {
    try {
      // 输入验证
      if (!username || !password) {
        AuditLogger.log('登录失败 - 缺少凭据', { username }, 'warning');
        return { success: false, error: '请输入用户名和密码' };
      }

      // 检查账户锁定状态
      if (LoginAttemptManager.isAccountLocked(username)) {
        const remaining = LoginAttemptManager.getRemainingLockoutTime(username);
        AuditLogger.log('登录失败 - 账户锁定', { username, remaining }, 'warning');
        return { 
          success: false, 
          error: '账户已被锁定，请稍后再试',
          lockoutRemaining: remaining
        };
      }

      // 查找用户
      const user = this.getUserByUsername(username);
      if (!user) {
        LoginAttemptManager.recordFailedAttempt(username);
        AuditLogger.log('登录失败 - 用户不存在', { username }, 'warning');
        return { success: false, error: '用户名或密码错误' };
      }

      // 检查用户状态
      if (!user.isEnabled || user.locked) {
        AuditLogger.log('登录失败 - 账户禁用', { username: user.username }, 'warning');
        return { success: false, error: '账户已禁用，请联系管理员' };
      }

      // 验证密码
      const isPasswordValid = PasswordUtils.verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isPasswordValid) {
        LoginAttemptManager.recordFailedAttempt(username);
        this.updateUserFailedAttempts(user.id, user.failedAttempts + 1);
        AuditLogger.log('登录失败 - 密码错误', { username: user.username }, 'warning');
        return { success: false, error: '用户名或密码错误' };
      }

      // 检查是否需要二级验证
      if (user.twoFactorEnabled) {
        if (!totpCode) {
          return { success: false, requiresTwoFactor: true };
        }

        // 这里应该验证TOTP代码，暂时跳过
        // const isTotpValid = TwoFactorAuth.verifyTOTP(user.twoFactorSecret!, totpCode);
        // if (!isTotpValid) {
        //   AuditLogger.log('登录失败 - 2FA验证失败', { username: user.username }, 'warning');
        //   return { success: false, error: '二级验证码错误' };
        // }
      }

      // 登录成功
      LoginAttemptManager.clearFailedAttempts(username);
      this.updateUserLastLogin(user.id);
      
      // 创建会话
      const token = SessionManager.createSession({
        userId: user.id,
        username: user.username,
        role: user.role,
      });

      // 记录成功登录
      AuditLogger.log('登录成功', { 
        username: user.username, 
        userId: user.id,
        role: user.role 
      });

      return { success: true, token };

    } catch (error) {
      AuditLogger.log('登录异常', { username, error: String(error) }, 'error');
      return { success: false, error: '登录过程中发生错误' };
    }
  }

  // 验证会话
  static validateSession(): { isValid: boolean; user?: any; needsRenewal?: boolean } {
    const session = SessionManager.getSession();
    
    if (!session.isValid) {
      return { isValid: false };
    }

    // 检查用户是否仍然有效
    const user = this.getUserById(session.user.userId);
    if (!user || !user.isEnabled || user.locked) {
      SessionManager.clearSession();
      AuditLogger.log('会话失效 - 用户状态变更', { userId: session.user.userId }, 'warning');
      return { isValid: false };
    }

    // 检查是否需要续期
    const needsRenewal = SessionManager.isSessionExpiring();

    return { isValid: true, user: session.user, needsRenewal };
  }

  // 登出
  static logout(): void {
    const session = SessionManager.getSession();
    if (session.isValid) {
      AuditLogger.log('用户登出', { username: session.user?.username });
    }
    SessionManager.clearSession();
  }

  // 更改密码
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const user = this.getUserById(userId);
      if (!user) {
        return { success: false, error: '用户不存在' };
      }

      // 验证旧密码
      const isOldPasswordValid = PasswordUtils.verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
      if (!isOldPasswordValid) {
        AuditLogger.log('密码更改失败 - 旧密码错误', { userId }, 'warning');
        return { success: false, error: '旧密码错误' };
      }

      // 验证新密码强度
      const validation = PasswordUtils.validatePassword(newPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // 更新密码
      const { hash, salt } = PasswordUtils.hashPassword(newPassword);
      this.updateUserPassword(userId, hash, salt);

      AuditLogger.log('密码更改成功', { userId });
      return { success: true };

    } catch (error) {
      AuditLogger.log('密码更改异常', { userId, error: String(error) }, 'error');
      return { success: false, error: '密码更改过程中发生错误' };
    }
  }

  // 获取所有用户
  private static getAllUsers(): AdminUser[] {
    try {
      const usersData = localStorage.getItem(this.USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch {
      return [];
    }
  }

  // 保存用户数据
  private static saveUsers(users: AdminUser[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // 根据用户名查找用户
  private static getUserByUsername(username: string): AdminUser | null {
    const users = this.getAllUsers();
    return users.find(user => user.username === username) || null;
  }

  // 根据ID查找用户
  private static getUserById(id: string): AdminUser | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }

  // 更新用户最后登录时间
  private static updateUserLastLogin(userId: string): void {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].lastLogin = Date.now();
      users[userIndex].updatedAt = Date.now();
      users[userIndex].failedAttempts = 0; // 重置失败次数
      this.saveUsers(users);
    }
  }

  // 更新用户失败尝试次数
  private static updateUserFailedAttempts(userId: string, attempts: number): void {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].failedAttempts = attempts;
      users[userIndex].updatedAt = Date.now();
      
      // 如果达到最大失败次数，锁定账户
      if (attempts >= 5) {
        users[userIndex].locked = true;
        AuditLogger.log('账户自动锁定', { userId, attempts }, 'warning');
      }
      
      this.saveUsers(users);
    }
  }

  // 更新用户密码
  private static updateUserPassword(userId: string, passwordHash: string, passwordSalt: string): void {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex].passwordHash = passwordHash;
      users[userIndex].passwordSalt = passwordSalt;
      users[userIndex].updatedAt = Date.now();
      this.saveUsers(users);
    }
  }

  // 获取审计日志
  static getAuditLogs(page: number = 1, pageSize: number = 50) {
    const logs = AuditLogger.getLogs();
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      logs: logs.slice(startIndex, endIndex),
      total: logs.length,
      page,
      pageSize,
      totalPages: Math.ceil(logs.length / pageSize),
    };
  }

  // 搜索审计日志
  static searchAuditLogs(query: string, fromDate?: Date, toDate?: Date) {
    return AuditLogger.searchLogs(query, fromDate, toDate);
  }

  // 清除审计日志（需要超级管理员权限）
  static clearAuditLogs(adminUserId: string): boolean {
    const user = this.getUserById(adminUserId);
    if (user?.role === 'super_admin') {
      AuditLogger.clearLogs();
      AuditLogger.log('审计日志已清除', { adminUserId });
      return true;
    }
    return false;
  }

  // 系统初始化
  static initialize(): void {
    this.initializeDefaultAdmin();
    AuditLogger.log('管理员认证系统初始化', {}, 'info');
  }

  // 获取系统安全状态
  static getSecurityStatus() {
    const users = this.getAllUsers();
    const logs = AuditLogger.getLogs();
    
    return {
      totalUsers: users.length,
      enabledUsers: users.filter(u => u.isEnabled).length,
      lockedUsers: users.filter(u => u.locked).length,
      usersWithTwoFactor: users.filter(u => u.twoFactorEnabled).length,
      totalLogs: logs.length,
      recentFailedLogins: logs.filter(log => 
        log.event.includes('登录失败') && 
        Date.now() - log.timestamp < 24 * 60 * 60 * 1000
      ).length,
      lastActivity: Math.max(...logs.map(log => log.timestamp), 0),
    };
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  AdminAuthService.initialize();
}
