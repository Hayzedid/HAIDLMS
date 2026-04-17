import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blockchainApi } from '../../api';
import { Wallet, Plus, Check, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
export const WalletManager = ({ userId }) => {
    const queryClient = useQueryClient();
    const [isAddingWallet, setIsAddingWallet] = useState(false);
    const [newWalletAddress, setNewWalletAddress] = useState('');
    const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
    // Fetch user wallets
    const { data: walletsData, isLoading, error } = useQuery({
        queryKey: ['wallets', userId],
        queryFn: async () => {
            const response = await blockchainApi.getWallets(userId);
            return response.data;
        },
        enabled: !!userId,
    });
    // Create wallet mutation
    const createWalletMutation = useMutation({
        mutationFn: async (data) => {
            const response = await blockchainApi.createWallet({
                user_id: userId,
                wallet_address: data.wallet_address,
                blockchain_network: data.blockchain_network,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallets', userId] });
            toast.success('Wallet added successfully!');
            setIsAddingWallet(false);
            setNewWalletAddress('');
        },
        onError: (error) => {
            const message = error.response?.data?.error || 'Failed to add wallet';
            toast.error(message);
        },
    });
    // Verify wallet ownership mutation
    const verifyWalletMutation = useMutation({
        mutationFn: async (walletAddress) => {
            const response = await blockchainApi.verifyWalletOwnership(walletAddress, userId);
            return response.data;
        },
        onSuccess: (data) => {
            if (data.is_owner) {
                toast.success('Wallet ownership verified!');
            }
            else {
                toast.error('Wallet ownership verification failed');
            }
        },
    });
    const handleAddWallet = () => {
        if (!newWalletAddress.trim()) {
            toast.error('Please enter a wallet address');
            return;
        }
        if (newWalletAddress.length < 26 || newWalletAddress.length > 255) {
            toast.error('Invalid wallet address length');
            return;
        }
        createWalletMutation.mutate({
            wallet_address: newWalletAddress.trim(),
            blockchain_network: selectedNetwork,
        });
    };
    const networkDisplayNames = {
        ethereum: 'Ethereum',
        polygon: 'Polygon',
        binance_smart_chain: 'Binance Smart Chain',
        solana: 'Solana',
        avalanche: 'Avalanche',
    };
    const getExplorerUrl = (wallet) => {
        const explorers = {
            ethereum: `https://etherscan.io/address/${wallet.wallet_address}`,
            polygon: `https://polygonscan.com/address/${wallet.wallet_address}`,
            binance_smart_chain: `https://bscscan.com/address/${wallet.wallet_address}`,
            solana: `https://explorer.solana.com/address/${wallet.wallet_address}`,
            avalanche: `https://snowtrace.io/address/${wallet.wallet_address}`,
        };
        return explorers[wallet.blockchain_network] || '#';
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center gap-2 text-red-800", children: [_jsx(AlertCircle, { className: "w-5 h-5" }), _jsx("span", { children: "Failed to load wallets. Please try again." })] }) }));
    }
    const wallets = walletsData?.wallets || [];
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Wallet, { className: "w-6 h-6 text-blue-600" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "My Wallets" })] }), !isAddingWallet && (_jsxs("button", { onClick: () => setIsAddingWallet(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Wallet"] }))] }), isAddingWallet && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Add New Wallet" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Blockchain Network" }), _jsx("select", { value: selectedNetwork, onChange: (e) => setSelectedNetwork(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: Object.entries(networkDisplayNames).map(([value, label]) => (_jsx("option", { value: value, children: label }, value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Wallet Address" }), _jsx("input", { type: "text", value: newWalletAddress, onChange: (e) => setNewWalletAddress(e.target.value), placeholder: "0x... or blockchain-specific address", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleAddWallet, disabled: createWalletMutation.isPending, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: createWalletMutation.isPending ? 'Adding...' : 'Add Wallet' }), _jsx("button", { onClick: () => {
                                            setIsAddingWallet(false);
                                            setNewWalletAddress('');
                                        }, disabled: createWalletMutation.isPending, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors", children: "Cancel" })] })] })] })), wallets.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Wallet, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 mb-2", children: "No wallets registered" }), _jsx("p", { className: "text-sm text-gray-500", children: "Add your blockchain wallet to receive NFT certificates and credentials" })] })) : (_jsx("div", { className: "space-y-4", children: wallets.map((wallet) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "flex items-center gap-2 mb-2", children: _jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: networkDisplayNames[wallet.blockchain_network] }) }), _jsx("div", { className: "font-mono text-sm text-gray-900 break-all mb-3", children: wallet.wallet_address }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Check, { className: "w-4 h-4 text-green-600" }), _jsxs("span", { children: [wallet.credential_count || 0, " Credentials"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Check, { className: "w-4 h-4 text-purple-600" }), _jsxs("span", { children: [wallet.nft_count || 0, " NFTs"] })] })] })] }), _jsxs("div", { className: "flex flex-col gap-2 ml-4", children: [_jsx("button", { onClick: () => verifyWalletMutation.mutate(wallet.wallet_address), disabled: verifyWalletMutation.isPending, className: "px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 transition-colors", children: "Verify" }), _jsxs("a", { href: getExplorerUrl(wallet), target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors", children: [_jsx("span", { children: "Explorer" }), _jsx(ExternalLink, { className: "w-3 h-3" })] })] })] }), _jsx("div", { className: "mt-3 pt-3 border-t border-gray-100", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Added ", new Date(wallet.created_at).toLocaleDateString()] }) })] }, wallet.id))) }))] }));
};
