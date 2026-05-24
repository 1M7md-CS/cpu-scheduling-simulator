import { Injectable, signal } from '@angular/core';
import * as bcrypt from 'bcryptjs';
import type { User, AuthResult } from '../models/authenticate.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticateService {
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_TIME = 60 * 1000;

  currentUser = signal<User | null>(null);

  private getUsers(): User[] {
    return JSON.parse(localStorage.getItem('users') || '[]');
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  private fail(message: string): AuthResult {
    return {
      success: false,
      message,
    };
  }

  private success(message: string): AuthResult {
    return {
      success: true,
      message,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizePassword(password: string): string {
    return password.trim();
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPassword = this.normalizePassword(password);

    if (!normalizedEmail || !normalizedPassword) {
      return this.fail('Email and password are required.');
    }

    if (!this.EMAIL_REGEX.test(normalizedEmail)) {
      return this.fail('Please enter a valid email address.');
    }

    if (normalizedPassword.length < 6) {
      return this.fail('Password must be at least 6 characters.');
    }

    const users = this.getUsers();

    const emailExists = users.some((user) => user.email === normalizedEmail);

    if (emailExists) {
      return this.fail('Email already registered.');
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    users.push({
      email: normalizedEmail,
      passwordHash,
      createdAt: Date.now(),
      attempts: 0,
      blockedUntil: null,
    });

    this.saveUsers(users);

    return this.success('Registration successful!');
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPassword = this.normalizePassword(password);

    if (!normalizedEmail || !normalizedPassword) {
      return this.fail('Email and password are required.');
    }

    const users = this.getUsers();

    const user = users.find((user) => user.email === normalizedEmail);

    if (!user) {
      return this.fail('Invalid email or password.');
    }

    const now = Date.now();

    if (user.blockedUntil && now < user.blockedUntil) {
      const seconds = Math.ceil((user.blockedUntil - now) / 1000);
      return this.fail(`Too many attempts. Try again in ${seconds} seconds.`);
    }

    const passwordIsValid = await bcrypt.compare(normalizedPassword, user.passwordHash);

    if (!passwordIsValid) {
      user.attempts++;

      if (user.attempts >= this.MAX_ATTEMPTS) {
        user.attempts = 0;
        user.blockedUntil = now + this.BLOCK_TIME;
      }

      this.saveUsers(users);

      return this.fail('Invalid email or password.');
    }

    user.attempts = 0;
    user.blockedUntil = null;

    this.saveUsers(users);

    this.currentUser.set(user);

    return this.success('Login successful!');
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
