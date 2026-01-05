import { useEffect, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useClickRef } from "@make-software/csprclick-ui";
import {
  sendSessionToExtension,
  WalletSession,
} from "@/services/extensionAuthBridge";
import { WalletImageIcon } from "@/components/AppIcons";

/**
 * Auth Page
 *
 * This page is opened by the Chrome extension when the user clicks "Connect Wallet".
 * It handles the wallet connection using CSPR.click SDK (which works on localhost),
 * then sends the session back to the extension.
 */
export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get extensionId from either searchParams or by parsing the hash manually
  // HashRouter URL format: http://localhost:5173/#/auth?extensionId=xxx
  const getExtensionId = () => {
    // Try standard searchParams first
    const fromParams = searchParams.get("extensionId");
    if (fromParams) return fromParams;

    // Parse from location.search (works with HashRouter)
    const params = new URLSearchParams(location.search);
    return params.get("extensionId");
  };

  const extensionId = getExtensionId();
  const clickRef = useClickRef();

  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "sent" | "error"
  >("idle");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug log
  useEffect(() => {
    console.log("[AuthPage] Location:", location);
    console.log("[AuthPage] ExtensionId:", extensionId);
    console.log("[AuthPage] ClickRef available:", !!clickRef);
  }, [location, extensionId, clickRef]);

  useEffect(() => {
    if (!clickRef) return;

    const handleSignedIn = async (evt: any) => {
      const account = evt.account || evt.detail?.account || evt.detail;
      if (account) {
        const address =
          account.public_key || account.publicKey || account.activeKey;
        const walletSession: WalletSession = {
          address,
          publicKey: address,
          network: "casper-test",
          provider: account.provider || "unknown",
          connectedAt: Date.now(),
        };

        setSession(walletSession);
        setStatus("connected");

        // If we have an extension ID, send the session to it
        if (extensionId) {
          try {
            const sent = await sendSessionToExtension(
              extensionId,
              walletSession
            );
            if (sent) {
              setStatus("sent");
              // Auto-close after success
              setTimeout(() => {
                window.close();
              }, 2000);
            } else {
              setError(
                "Failed to send session to extension. Please try again."
              );
            }
          } catch (err) {
            console.error("Error sending session:", err);
            setError("Error communicating with extension.");
          }
        }
      }
    };

    const handleDisconnected = () => {
      setSession(null);
      setStatus("idle");
    };

    clickRef.on("csprclick:signed_in", handleSignedIn);
    clickRef.on("csprclick:signed_out", handleDisconnected);
    clickRef.on("csprclick:disconnected", handleDisconnected);

    // Check existing connection
    const checkConnection = async () => {
      try {
        const activeAccount = clickRef.getActiveAccount?.();
        if (activeAccount?.public_key) {
          handleSignedIn({ account: activeAccount });
        }
      } catch (err) {
        console.log("No active connection");
      }
    };
    checkConnection();

    return () => {
      clickRef.off?.("csprclick:signed_in", handleSignedIn);
      clickRef.off?.("csprclick:signed_out", handleDisconnected);
      clickRef.off?.("csprclick:disconnected", handleDisconnected);
    };
  }, [clickRef, extensionId]);

  const handleConnect = async () => {
    if (!clickRef) return;
    setStatus("connecting");
    setError(null);
    try {
      await clickRef.signIn();
    } catch (err) {
      console.error("Connection failed:", err);
      setError("Failed to connect wallet. Please try again.");
      setStatus("error");
    }
  };

  const handleDisconnect = async () => {
    if (!clickRef) return;
    try {
      await clickRef.signOut();
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <div className="card-glass p-8 max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <WalletImageIcon width={100} height={75} />
          <h1 className="text-2xl font-bold text-white">Connect Wallet</h1>
          {extensionId && (
            <p className="text-gray-400 text-sm">
              Connecting wallet for Trex Extension
            </p>
          )}
        </div>

        {status === "idle" && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Click below to connect your Casper wallet.
              {extensionId &&
                " Your session will be securely shared with the extension."}
            </p>
            <button onClick={handleConnect} className="btn-primary w-full py-3">
              Connect Wallet
            </button>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            <p className="text-gray-300">Connecting...</p>
          </div>
        )}

        {status === "connected" && session && (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-400 font-semibold">Wallet Connected!</p>
              <p className="text-gray-300 text-sm mt-2 break-all">
                {session.address.slice(0, 16)}...{session.address.slice(-12)}
              </p>
            </div>
            {extensionId ? (
              <p className="text-gray-400 text-sm">
                Sending session to extension...
              </p>
            ) : (
              <button
                onClick={handleDisconnect}
                className="btn-secondary w-full py-2"
              >
                Disconnect
              </button>
            )}
          </div>
        )}

        {status === "sent" && (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-400 font-semibold">✓ Success!</p>
              <p className="text-gray-300 text-sm mt-2">
                Wallet connected and session sent to extension. This window will
                close automatically.
              </p>
            </div>
          </div>
        )}

        {(status === "error" || error) && (
          <div className="space-y-4">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 font-semibold">Error</p>
              <p className="text-gray-300 text-sm mt-2">{error}</p>
            </div>
            <button onClick={handleConnect} className="btn-primary w-full py-3">
              Try Again
            </button>
          </div>
        )}

        {!extensionId && status === "idle" && (
          <p className="text-gray-500 text-xs mt-4">
            No extension ID detected. If you opened this page manually, please
            use the Connect Wallet button in the extension.
          </p>
        )}
      </div>
    </div>
  );
}
