import CryptoJS from 'crypto-js';

// 安全配置
export const SECURITY_CONFIG = {
  // 密码配置
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // 登录限制配置
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分钟
  
  // 会话配置
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2小时
  REFRESH_TOKEN_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // JWT配置
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production', // 生产环境应使用环境变量
  
  // 2FA配置
  TOTP_ISSUER: 'TikTok Education Platform',
  TOTP_DIGITS: 6,
  TOTP_PERIOD: 30,
};

// 密码哈希工具
export class PasswordUtils {
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const saltValue = salt || CryptoJS.lib.WordArray.random(128/8).toString();
    const hash = CryptoJS.PBKDF2(password, saltValue, {
      keySize: 256/32,
      iterations: 10000
    }).toString();
    return { hash, salt: saltValue };
  }

  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt);
    return computedHash === hash;
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = 
      SECURITY_CONFIG.PASSWORD_REQUIREMENTS;

    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(`密码长度至少${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}位`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// JWT工具类
export class JWTUtils {
  static generateToken(payload: any, expiresIn: number = SECURITY_CONFIG.SESSION_TIMEOUT): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Date.now();
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: CryptoJS.lib.WordArray.random(128/8).toString(), // Token ID
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(tokenPayload));
    const signature = CryptoJS.HmacSHA256(
      `${encodedHeader}.${encodedPayload}`,
      SECURITY_CONFIG.JWT_SECRET
    ).toString();

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static verifyToken(token: string): { isValid: boolean; payload?: any; error?: string } {
    try {
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return { isValid: false, error: '无效的token格式' };
      }

      // 验证签名
      const expectedSignature = CryptoJS.HmacSHA256(
        `${header}.${payload}`,
        SECURITY_CONFIG.JWT_SECRET
      ).toString();

      if (signature !== expectedSignature) {
        return { isValid: false, error: '无效的token签名' };
      }

      const decodedPayload = JSON.parse(atob(payload));

      // 检查过期时间
      if (Date.now() > decodedPayload.exp) {
        return { isValid: false, error: 'Token已过期' };
      }

      return { isValid: true, payload: decodedPayload };
    } catch (error) {
      return { isValid: false, error: 'Token解析失败' };
    }
  }

  static refreshToken(token: string): { success: boolean; newToken?: string; error?: string } {
    const verification = this.verifyToken(token);
    
    if (!verification.isValid) {
      return { success: false, error: verification.error };
    }

    // 生成新的token
    const newToken = this.generateToken({
      userId: verification.payload!.userId,
      username: verification.payload!.username,
      role: verification.payload!.role,
    });

    return { success: true, newToken };
  }
}

// 登录尝试限制管理
export class LoginAttemptManager {
  private static getAttemptKey(identifier: string): string {
    return `login_attempts_${identifier}`;
  }

  private static getLockoutKey(identifier: string): string {
    return `login_lockout_${identifier}`;
  }

  static recordFailedAttempt(identifier: string): void {
    const key = this.getAttemptKey(identifier);
    const attempts = this.getFailedAttempts(identifier);
    
    const newAttempts = attempts + 1;
    localStorage.setItem(key, JSON.stringify({
      count: newAttempts,
      lastAttempt: Date.now()
    }));

    // 如果达到最大尝试次数，锁定账户
    if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.lockAccount(identifier);
    }
  }

  static getFailedAttempts(identifier: string): number {
    const key = this.getAttemptKey(identifier);
    const data = localStorage.getItem(key);
    
    if (!data) return 0;
    
    try {
      const parsed = JSON.parse(data);
      return parsed.count || 0;
    } catch {
      return 0;
    }
  }

  static isAccountLocked(identifier: string): boolean {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutTime = localStorage.getItem(lockoutKey);
    
    if (!lockoutTime) return false;
    
    const lockoutTimestamp = parseInt(lockoutTime);
    const now = Date.now();
    
    if (now - lockoutTimestamp > SECURITY_CONFIG.LOCKOUT_DURATION) {
      // 锁定时间已过，清除锁定状态
      this.clearFailedAttempts(identifier);
      return false;
    }
    
    return true;
  }

  static getRemainingLockoutTime(identifier: string): number {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutTime = localStorage.getItem(lockoutKey);
    
    if (!lockoutTime) return 0;
    
    const lockoutTimestamp = parseInt(lockoutTime);
    const remaining = SECURITY_CONFIG.LOCKOUT_DURATION - (Date.now() - lockoutTimestamp);
    
    return Math.max(0, remaining);
  }

  static lockAccount(identifier: string): void {
    const lockoutKey = this.getLockoutKey(identifier);
    localStorage.setItem(lockoutKey, Date.now().toString());
  }

  static clearFailedAttempts(identifier: string): void {
    const attemptKey = this.getAttemptKey(identifier);
    const lockoutKey = this.getLockoutKey(identifier);
    
    localStorage.removeItem(attemptKey);
    localStorage.removeItem(lockoutKey);
  }
}

// 审计日志系统
export class AuditLogger {
  private static LOG_KEY = 'admin_audit_logs';
  private static MAX_LOGS = 1000; // 最多保存1000条日志

  static log(event: string, details: any = {}, level: 'info' | 'warning' | 'error' = 'info'): void {
    const logEntry = {
      id: CryptoJS.lib.WordArray.random(64/8).toString(),
      timestamp: Date.now(),
      event,
      details,
      level,
      userAgent: navigator.userAgent,
      ip: 'client-side', // 在实际部署中应从服务端获取
      sessionId: this.getCurrentSessionId(),
    };

    const logs = this.getLogs();
    logs.unshift(logEntry);

    // 保持日志数量在限制内
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }

    localStorage.setItem(this.LOG_KEY, JSON.stringify(logs));
  }

  static getLogs(): any[] {
    try {
      const logs = localStorage.getItem(this.LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  static clearLogs(): void {
    localStorage.removeItem(this.LOG_KEY);
  }

  private static getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('admin_session_id');
    if (!sessionId) {
      sessionId = CryptoJS.lib.WordArray.random(128/8).toString();
      sessionStorage.setItem('admin_session_id', sessionId);
    }
    return sessionId;
  }

  // 搜索日志
  static searchLogs(query: string, fromDate?: Date, toDate?: Date): any[] {
    const logs = this.getLogs();
    
    return logs.filter(log => {
      const matchesQuery = !query || 
        log.event.toLowerCase().includes(query.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(query.toLowerCase());
      
      const matchesDateRange = (!fromDate || log.timestamp >= fromDate.getTime()) &&
        (!toDate || log.timestamp <= toDate.getTime());
      
      return matchesQuery && matchesDateRange;
    });
  }
}

// 会话管理
export class SessionManager {
  private static SESSION_KEY = 'admin_session';
  private static REFRESH_KEY = 'admin_refresh_token';

  static createSession(user: { userId: string; username: string; role: string }): string {
    // 生成访问token
    const accessToken = JWTUtils.generateToken(user, SECURITY_CONFIG.SESSION_TIMEOUT);
    
    // 生成刷新token
    const refreshToken = JWTUtils.generateToken(
      { ...user, type: 'refresh' },
      SECURITY_CONFIG.REFRESH_TOKEN_TIMEOUT
    );

    // 存储tokens
    localStorage.setItem(this.SESSION_KEY, accessToken);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);

    // 记录登录日志
    AuditLogger.log('用户登录', { username: user.username, userId: user.userId });

    return accessToken;
  }

  static getSession(): { isValid: boolean; user?: any; token?: string } {
    const token = localStorage.getItem(this.SESSION_KEY);
    
    if (!token) {
      return { isValid: false };
    }

    const verification = JWTUtils.verifyToken(token);
    
    if (!verification.isValid) {
      // 尝试刷新token
      const refreshResult = this.refreshSession();
      if (refreshResult.success) {
        return { isValid: true, user: refreshResult.user, token: refreshResult.newToken };
      }
      
      this.clearSession();
      return { isValid: false };
    }

    return { isValid: true, user: verification.payload, token };
  }

  static refreshSession(): { success: boolean; user?: any; newToken?: string } {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    
    if (!refreshToken) {
      return { success: false };
    }

    const verification = JWTUtils.verifyToken(refreshToken);
    
    if (!verification.isValid || verification.payload?.type !== 'refresh') {
      this.clearSession();
      return { success: false };
    }

    // 生成新的访问token
    const user = {
      userId: verification.payload.userId,
      username: verification.payload.username,
      role: verification.payload.role,
    };

    const newToken = JWTUtils.generateToken(user, SECURITY_CONFIG.SESSION_TIMEOUT);
    localStorage.setItem(this.SESSION_KEY, newToken);

    AuditLogger.log('会话刷新', { username: user.username });

    return { success: true, user, newToken };
  }

  static clearSession(): void {
    const session = this.getSession();
    if (session.isValid) {
      AuditLogger.log('用户登出', { username: session.user?.username });
    }

    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    
    // 清除其他相关数据
    sessionStorage.clear();
  }

  static isSessionExpiring(): boolean {
    const token = localStorage.getItem(this.SESSION_KEY);
    
    if (!token) return false;

    const verification = JWTUtils.verifyToken(token);
    
    if (!verification.isValid) return true;

    // 检查是否在15分钟内过期
    const expirationTime = verification.payload!.exp;
    const timeToExpiry = expirationTime - Date.now();
    
    return timeToExpiry < 15 * 60 * 1000; // 15分钟
  }
}

// 2FA工具（基础实现）
export class TwoFactorAuth {
  private static generateSecret(): string {
    // 生成20字节随机数据并转换为Base32（简化版本）
    const randomBytes = CryptoJS.lib.WordArray.random(160/8);
    return randomBytes.toString().toUpperCase().slice(0, 32);
  }

  static setupTOTP(username: string): { secret: string; qrCodeUrl: string } {
    const secret = this.generateSecret();
    const issuer = encodeURIComponent(SECURITY_CONFIG.TOTP_ISSUER);
    const account = encodeURIComponent(username);
    
    const qrCodeUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=${SECURITY_CONFIG.TOTP_DIGITS}&period=${SECURITY_CONFIG.TOTP_PERIOD}`;
    
    return { secret, qrCodeUrl };
  }

  static generateTOTP(secret: string): string {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / SECURITY_CONFIG.TOTP_PERIOD);
    
    // 简化的TOTP实现 - 生产环境应使用专门的库
    const hash = CryptoJS.HmacSHA1(timeStep.toString(), secret);
    const offset = parseInt(hash.toString().slice(-1), 16);
    const code = (parseInt(hash.toString().slice(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) % Math.pow(10, SECURITY_CONFIG.TOTP_DIGITS);
    
    return code.toString().padStart(SECURITY_CONFIG.TOTP_DIGITS, '0');
  }

  static verifyTOTP(secret: string, token: string): boolean {
    const currentCode = this.generateTOTP(secret);
    return currentCode === token;
  }
}

// 安全工具集合
export class SecurityUtils {
  // 生成安全的随机字符串
  static generateSecureRandom(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  // 加密敏感数据
  static encryptData(data: string, key?: string): string {
    const encryptionKey = key || SECURITY_CONFIG.JWT_SECRET;
    return CryptoJS.AES.encrypt(data, encryptionKey).toString();
  }

  // 解密数据
  static decryptData(encryptedData: string, key?: string): string {
    const encryptionKey = key || SECURITY_CONFIG.JWT_SECRET;
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // 检查输入是否包含潜在的XSS攻击
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // 验证IP地址格式
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // 生成安全的cookie设置
  static getSecureCookieOptions(): any {
    return {
      httpOnly: true,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      maxAge: SECURITY_CONFIG.SESSION_TIMEOUT / 1000,
    };
  }
}
