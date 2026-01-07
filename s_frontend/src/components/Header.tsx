import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { useClickRef } from "@make-software/csprclick-ui";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { WalletImageIcon } from "./AppIcons";

export function Header() {
  const clickRef = useClickRef();
  const {
    isConnected,
    currentAccount,
    setLoading,
    setConnected,
    setCurrentAccount,
    addToast,
    logout,
  } = useAppStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Listen for CSPR Click SDK events
  useEffect(() => {
    if (!clickRef) return;

    // Use a ref to track if we've already shown toast for this session
    let hasShownConnectToast = false;
    let hasShownDisconnectToast = false;

    const handleSignedIn = async (evt: any) => {
      console.log("CSPR Click signed in event:", evt);
      const account = evt.account || evt.detail?.account || evt.detail;

      if (account && !hasShownConnectToast) {
        hasShownConnectToast = true;
        // Extract account info from event
        const address =
          account.public_key || account.publicKey || account.activeKey;

        setCurrentAccount({
          address: address,
          network: "casper-test",
        });
        setConnected(true);
        setLoading(false);

        addToast({
          type: "success",
          message: "Wallet connected successfully",
        });

        // Reset disconnect flag when connected
        hasShownDisconnectToast = false;
      }
    };

    const handleDisconnected = async () => {
      console.log("CSPR Click disconnected event");
      if (!hasShownDisconnectToast) {
        hasShownDisconnectToast = true;
        logout();
        addToast({
          type: "info",
          message: "Wallet disconnected",
        });
        // Reset connect flag when disconnected
        hasShownConnectToast = false;
      }
    };

    // Use clickRef.on() for React SDK event listeners
    clickRef.on("csprclick:signed_in", handleSignedIn);
    clickRef.on("csprclick:signed_out", handleDisconnected);
    // Don't listen to disconnected - signed_out is enough
    // clickRef.on("csprclick:disconnected", handleDisconnected);

    // Check if already connected on mount
    const checkConnection = async () => {
      try {
        const activeAccount = clickRef.getActiveAccount?.();
        if (activeAccount && activeAccount.public_key && !isConnected) {
          setCurrentAccount({
            address: activeAccount.public_key,
            network: "casper-test",
          });
          setConnected(true);
        }
      } catch (err) {
        console.log("No active connection on mount");
      }
    };

    checkConnection();

    // Cleanup listeners
    return () => {
      clickRef.off?.("csprclick:signed_in", handleSignedIn);
      clickRef.off?.("csprclick:signed_out", handleDisconnected);
    };
  }, [
    clickRef,
    setConnected,
    setCurrentAccount,
    setLoading,
    addToast,
    logout,
    isConnected,
  ]);

  const handleConnect = async () => {
    try {
      // Use CSPR Click SDK to initiate wallet connection
      if (!clickRef) {
        addToast({
          type: "info",
          message: "Initializing wallet connection...",
        });
        return;
      }
      await clickRef.signIn();
      // Toast will be shown by event listener when connection succeeds
    } catch (error) {
      console.error("Connection error:", error);
      addToast({
        type: "error",
        message: "Failed to connect wallet. Please try again.",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect from CSPR Click SDK
      // The event listener will handle state cleanup and toast
      if (clickRef) {
        await clickRef.signOut();
      } else {
        // If no clickRef, manually logout
        logout();
        addToast({
          type: "info",
          message: "Disconnected",
        });
      }
      setShowDropdown(false);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const copyToClipboard = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-dark-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="relative">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/icons/icon.svg"
                alt="Trex Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold gradient-text">
              Trex
            </h1>
            <p className="text-[10px] text-dark-400 -mt-0.5">
              Media Achievements
            </p>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 bg-main-gradient 
                   rounded-xl font-medium text-white text-sm
                   hover:shadow-neon-coral 
                   transition-all duration-200 shadow-lg shadow-coral/25"
            >
              <WalletImageIcon size={18} inverted={false} />
              <span>Connect</span>
            </motion.button>
          ) : (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 
                     rounded-xl text-sm hover:border-coral/50 transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-lg bg-main-gradient" />
                <span className="text-dark-200 font-medium">
                  {currentAccount
                    ? truncateAddress(currentAccount.address)
                    : "Connected"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-dark-400 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />
              </motion.button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-xl border border-dark-700 
                         shadow-xl shadow-black/20 z-50 overflow-hidden"
                  >
                    {/* Account Info */}
                    <div className="p-4 border-b border-dark-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-main-gradient" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-dark-400 mb-1">
                            Casper Wallet
                          </p>
                          <p className="text-sm text-white font-medium truncate">
                            {currentAccount?.address
                              ? truncateAddress(currentAccount.address)
                              : "Not connected"}
                          </p>
                        </div>
                      </div>

                      {/* Copy Address */}
                      {currentAccount?.address && (
                        <button
                          onClick={copyToClipboard}
                          className="w-full flex items-start justify-start gap-2 px-3 py-2 
                               bg-dark-800 hover:bg-dark-700 rounded-lg text-sm text-dark-200 
                               transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Disconnect */}
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 
                           hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
