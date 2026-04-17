import { clsx } from 'clsx';
/**
 * Utility function to merge Tailwind CSS classes
 * Handles conditional classes and resolves conflicts
 */
export function cn(...inputs) {
    return clsx(inputs);
}
/**
 * Format number with commas
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}
/**
 * Format percentage
 */
export function formatPercentage(num, decimals = 1) {
    return `${num.toFixed(decimals)}%`;
}
/**
 * Format date relative to now (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60)
        return 'just now';
    if (diffMin < 60)
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24)
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7)
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
}
/**
 * Truncate text to specified length
 */
export function truncate(text, length, suffix = '...') {
    if (text.length <= length)
        return text;
    return text.substring(0, length) + suffix;
}
/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Sleep/delay function
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Get initials from name
 */
export function getInitials(name) {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}
/**
 * Generate random ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value) {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Clamp number between min and max
 */
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}
/**
 * Calculate percentage
 */
export function percentage(value, total) {
    if (total === 0)
        return 0;
    return (value / total) * 100;
}
