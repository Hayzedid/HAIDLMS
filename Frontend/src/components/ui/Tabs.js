import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../../lib/utils';
export const Tabs = ({ tabs, activeTab, onChange, variant = 'default', size = 'md', fullWidth = false, className, }) => {
    const sizes = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-5 py-2.5',
    };
    const variants = {
        default: {
            container: 'border-b border-gray-200',
            tab: 'border-b-2 border-transparent hover:border-gray-300 transition-colors',
            active: 'border-primary-600 text-primary-600 font-semibold',
            inactive: 'text-gray-600 hover:text-gray-800',
        },
        pills: {
            container: 'bg-gray-100 p-1 rounded-lg',
            tab: 'rounded-md transition-all',
            active: 'bg-white text-primary-600 font-semibold shadow-sm',
            inactive: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
        },
        underline: {
            container: 'space-x-8 border-b border-gray-200',
            tab: 'border-b-2 border-transparent relative pb-2 transition-colors',
            active: 'border-primary-600 text-primary-600 font-semibold',
            inactive: 'text-gray-500 hover:text-gray-700 hover:border-gray-300',
        },
    };
    const variantStyles = variants[variant];
    return (_jsx("div", { className: cn('flex', variant === 'pills' ? 'gap-1' : 'gap-0', fullWidth && 'w-full', variantStyles.container, className), children: tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (_jsxs("button", { onClick: () => !tab.disabled && onChange(tab.id), disabled: tab.disabled, className: cn('inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap', sizes[size], variantStyles.tab, isActive ? variantStyles.active : variantStyles.inactive, tab.disabled && 'opacity-50 cursor-not-allowed', fullWidth && 'flex-1'), children: [tab.icon && _jsx("span", { children: tab.icon }), tab.label, tab.badge !== undefined && (_jsx("span", { className: cn('inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold rounded-full', isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-200 text-gray-700'), children: tab.badge }))] }, tab.id));
        }) }));
};
Tabs.displayName = 'Tabs';
