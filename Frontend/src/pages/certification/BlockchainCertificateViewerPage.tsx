import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { certificationApi } from "../../api/certification.api";
import { Shield, ExternalLink, Download, Copy } from "lucide-react";

export const BlockchainCertificateViewerPage: React.FC = () => {
  const [selectedCert, setSelectedCert] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["blockchainCertificates"],
    queryFn: () => certificationApi.getUserBlockchainCertificates?.(),
  });

  const selected = certificates?.find((c) => c.id === selectedCert);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Blockchain Certificates
            </h1>
          </div>
          <p className="text-gray-600">
            Verify your credentials on the blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificate List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900">
                  Your Certificates
                </h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-600">
                    Loading...
                  </div>
                ) : !certificates?.length ? (
                  <div className="p-4 text-center text-gray-600">
                    No blockchain certificates yet
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <button
                      key={cert.id}
                      onClick={() => setSelectedCert(cert.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        selectedCert === cert.id
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : ""
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {cert.courseName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-600">
                          Verified on Blockchain
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Select a certificate to view details
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Certificate Card */}
                <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg shadow-lg p-8 text-white">
                  <div className="text-center">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-90" />
                    <h3 className="text-2xl font-bold mb-2">
                      Certificate of Completion
                    </h3>
                    <p className="text-green-100 mb-6">
                      Verified on Blockchain
                    </p>
                    <p className="text-3xl font-bold mb-2">
                      {selected.courseName}
                    </p>
                    <p className="text-sm text-green-100">
                      Issued:{" "}
                      {new Date(selected.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Blockchain Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Blockchain Details
                  </h3>
                  <div className="space-y-4">
                    {/* Transaction Hash */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction Hash
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-gray-100 p-3 rounded text-xs text-gray-900 break-all font-mono">
                          {selected.transactionHash}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(selected.transactionHash)
                          }
                          className="px-3 py-2 text-gray-600 hover:text-gray-900"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Contract Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Address
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-gray-100 p-3 rounded text-xs text-gray-900 break-all font-mono">
                          {selected.contractAddress}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(selected.contractAddress)
                          }
                          className="px-3 py-2 text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Token ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Token ID (NFT)
                      </label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-gray-100 p-3 rounded text-xs text-gray-900 break-all font-mono">
                          {selected.tokenId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selected.tokenId)}
                          className="px-3 py-2 text-gray-600 hover:text-gray-900"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Blockchain Network */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blockchain Network
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selected.blockchainNetwork}
                      </p>
                    </div>

                    {/* Verification Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Status
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 font-medium">
                          Verified and Immutable
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient & Issuer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Recipient
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-medium text-gray-900">
                      {selected.recipientName}
                    </p>
                    <p className="text-sm text-gray-600 mt-3 mb-1">Email</p>
                    <p className="font-medium text-gray-900 break-all">
                      {selected.recipientEmail}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Issuer</h4>
                    <p className="text-sm text-gray-600 mb-1">Organization</p>
                    <p className="font-medium text-gray-900">
                      {selected.issuerName}
                    </p>
                    <p className="text-sm text-gray-600 mt-3 mb-1">
                      Wallet Address
                    </p>
                    <p className="font-medium text-gray-900 break-all">
                      {selected.issuerAddress}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <a
                    href={selected.blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" /> View on Blockchain
                    Explorer
                  </a>
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold">
                    <Download className="w-4 h-4" /> Download Certificate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            How Blockchain Certificates Work
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Certificates are minted as NFTs on the blockchain</li>
            <li>
              ✓ Each certificate has a unique transaction hash and token ID
            </li>
            <li>
              ✓ The certificate is immutable and can never be revoked or
              tampered with
            </li>
            <li>
              ✓ Anyone can verify the certificate on the blockchain explorer
            </li>
            <li>✓ You own the NFT and can transfer it to other wallets</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BlockchainCertificateViewerPage;
