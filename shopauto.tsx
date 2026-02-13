import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { io } from "socket.io-client";
import { 
  ShoppingBag, 
  MessageSquare, 
  BookOpen, 
  Power, 
  Save, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Cpu,
  Send,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ShopAuto() {
  const { user, userProfile, cleanupSupabase } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // AI Engine State
  const [aiProviderType, setAiProviderType] = useState<"system" | "custom">("system");
  const [aiEngine, setAiEngine] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [isAiTesting, setIsAiTesting] = useState(false);

  // Test Chat State
  const [testChatMessage, setTestChatMessage] = useState("");
  const [testChatHistory, setTestChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Shopee Connection State
  const [isShopeeConnected, setIsShopeeConnected] = useState(false);
  const [shopeStoreName, setShopeStoreName] = useState("");
  const [shopeShopId, setShopeShopId] = useState("");
  const [shopePartnerId, setShopePartnerId] = useState("");
  const [shopePartnerKey, setShopePartnerKey] = useState("");

  // Auto Chat & AI Settings
  const [autoChatEnabled, setAutoChatEnabled] = useState(false);
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false);
  
  // Knowledge Base State
  const [aiKnowledgeEssay, setAiKnowledgeEssay] = useState("");

  // WhatsApp Notification State
  const [whatsappDestination, setWhatsappDestination] = useState(""); 

  // Admin Identities
  const [waAdminType, setWaAdminType] = useState<"system" | "custom">("system");
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [waAccount, setWaAccount] = useState("");
  
  // Real WhatsApp Connection State
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [, setWaStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [waBackendUrl, setWaBackendUrl] = useState("https://endpoint.elvisiongroup.com:3000");
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);
  const [testWaMessage, setTestWaMessage] = useState("");
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedRef = React.useRef<string | null>(null);

  // Reset all state when user changes or logs out
  useEffect(() => {
    if (!user) {
      setAiProviderType("system");
      setAiEngine("openai");
      setApiKey("");
      setIsShopeeConnected(false);
      setShopeStoreName("");
      setShopeShopId("");
      setShopePartnerId("");
      setShopePartnerKey("");
      setAutoChatEnabled(false);
      setAutoOrderEnabled(false);
      setAiKnowledgeEssay("");
      setWhatsappDestination("");
      setWaAdminType("system");
      setIsWaConnected(false);
      setWaAccount("");
      setTestChatHistory([]);
      setAvailableGroups([]);
      hasLoadedRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Welcome Back!",
        description: "You have successfully authenticated.",
      });
      // Clear the param
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAuthRedirect = () => {
    navigate('/auth');
  };

  // --- SAVE LOGIC ---
  const saveSettings = async (overrides: any = {}, silent = true) => {
    if (!user) {
      handleAuthRedirect();
      return;
    }
    setIsSaving(true);
    
    try {
      const currentSettings = userProfile?.shopauto_settings || {};
      const finalApiKey = apiKey === "********" ? currentSettings.apiKey : apiKey;

      // Determine values, prioritizing overrides then local state
      const settings = {
        aiProviderType: overrides.aiProviderType ?? aiProviderType,
        aiEngine: overrides.aiEngine ?? aiEngine,
        apiKey: overrides.apiKey ?? finalApiKey,
        isShopeeConnected: overrides.isShopeeConnected ?? isShopeeConnected,
        shopeStoreName: overrides.shopeStoreName ?? shopeStoreName,
        shopeShopId: overrides.shopeShopId ?? shopeShopId,
        shopePartnerId: overrides.shopePartnerId ?? shopePartnerId,
        shopePartnerKey: overrides.shopePartnerKey ?? shopePartnerKey,
        autoChatEnabled: overrides.autoChatEnabled ?? autoChatEnabled,
        autoOrderEnabled: overrides.autoOrderEnabled ?? autoOrderEnabled,
        aiKnowledgeEssay: overrides.aiKnowledgeEssay ?? aiKnowledgeEssay,
        whatsappDestination: overrides.whatsappDestination ?? whatsappDestination,
        whatsappForwardEnabled: overrides.whatsappDestination !== undefined 
          ? !!overrides.whatsappDestination.trim() 
          : (whatsappDestination ? !!whatsappDestination.trim() : false),
        waAdminType: overrides.waAdminType ?? waAdminType,
        isWaConnected: overrides.isWaConnected ?? isWaConnected,
        waAccount: overrides.waAccount ?? waAccount,
        waBackendUrl: overrides.waBackendUrl ?? waBackendUrl,
      };

      // Use upsert to handle cases where the profile row doesn't exist yet
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          user_email: user.email,
          shopauto_settings: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      if (!silent) toast({ title: "Berhasil", description: "Pengaturan telah disimpan ke Cloud." });
    } catch (err: any) {
      console.error("Save error:", err.message);
      toast({ title: "Error", description: "Gagal menyimpan: " + err.message, variant: "destructive" });
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const handleToggle = (key: string, value: any) => {
    if (key === "autoChatEnabled") setAutoChatEnabled(value);
    if (key === "autoOrderEnabled") setAutoOrderEnabled(value);
    if (key === "aiProviderType") setAiProviderType(value);
    if (key === "aiEngine") setAiEngine(value);
    if (key === "waAdminType") setWaAdminType(value);
    
    // Pass the new value directly to saveSettings to avoid async state lag
    saveSettings({ [key]: value }, true);
  };

  // Auto-Save Debounce for text inputs
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const timer = setTimeout(() => {
      if (user && !isSaving) saveSettings({}, true);
    }, 2000); 
    return () => clearTimeout(timer);
  }, [whatsappDestination, aiKnowledgeEssay, apiKey, waBackendUrl]);

  // --- WA LOGIC ---
  useEffect(() => {
    if (waAdminType !== "custom") return;

    const normalizedUrl = waBackendUrl.replace(/\/$/, '');
    const socket = io(normalizedUrl);

    socket.on("qr-user", (url) => {
      console.log("[WA-SOCKET] User QR Received (Length:", url?.length, ")");
      setWaQrCode(url);
      setWaStatus("connecting");
    });

    socket.on("status-user", (status) => {
      console.log("[WA-SOCKET] User Status Received:", status);
      if (status === "READY" || status === "AUTHENTICATED") {
        setIsWaConnected(true);
        setWaStatus("connected");
        setWaQrCode(null);
        if (status === "READY") handleToggle("isWaConnected", true);
      } else if (status === "QR_READY") {
        setWaStatus("connecting");
      } else if (status === "INITIALIZING") {
        setIsWaConnected(false);
        setWaQrCode(prev => {
          if (!prev) {
            setWaStatus("disconnected");
            return null;
          }
          return prev;
        });
      }
    });

    // Polling as fallback for QR/Status
    const pollInterval = setInterval(async () => {
      if (!isWaConnected) {
        try {
          const response = await fetch(`${normalizedUrl}/status`);
          const data = await response.json();
          const userStatus = data.user || { status: "INITIALIZING", qr: null };
          
          console.log(`[WA-POLL] Status: ${userStatus.status} | QR Present: ${!!userStatus.qr}`);

          if (userStatus.status === "READY" || userStatus.status === "AUTHENTICATED") {
            console.log("[WA-POLL] Account Connected:", data.number);
            setIsWaConnected(true);
            setWaStatus("connected");
            setWaQrCode(null);
            setWaAccount(data.number || "Connected WA");
          } else if (userStatus.qr) {
            if (waQrCode !== userStatus.qr) {
              console.log("[WA-POLL] New QR code found in polling");
              setWaQrCode(userStatus.qr);
            }
            setWaStatus("connecting");
          }
        } catch (err: any) {
          console.error("[WA-POLL] Error fetching status:", err.message);
        }
      }
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [waBackendUrl, waAdminType, isWaConnected]);

  // Initial Status Check
  useEffect(() => {
    if (waAdminType !== "custom") return;
    
    const checkInitialStatus = async () => {
      try {
        const normalizedUrl = waBackendUrl.replace(/\/$/, '');
        const response = await fetch(`${normalizedUrl}/status`);
        const data = await response.json();
        const userStatus = data.user || { status: "INITIALIZING", qr: null };
        
        if (userStatus.status === "READY" || userStatus.status === "AUTHENTICATED") {
          setIsWaConnected(true);
          setWaStatus("connected");
          setWaAccount(data.number || "Connected WA");
        } else if (userStatus.qr) {
          setWaQrCode(userStatus.qr);
          setWaStatus("connecting");
        }
      } catch (err) {
        console.error("Initial WA Status Error", err);
      }
    };
    
    checkInitialStatus();
  }, [waBackendUrl, waAdminType]);

  // --- FETCH SETTINGS ---
  useEffect(() => {
    // loading guard based on specific user ID to prevent stale loads
    if (!user || hasLoadedRef.current === user.id) {
      if (!user) {
        hasLoadedRef.current = null;
      }
      return;
    }

    if (userProfile?.shopauto_settings) {
      console.log("📂 Loading settings for user:", user.email);
      const settings = userProfile.shopauto_settings;
      setAiProviderType(settings.aiProviderType || "system");
      setAiEngine(settings.aiEngine || "openai");
      setApiKey(settings.apiKey ? "********" : "");
      setIsShopeeConnected(settings.isShopeeConnected || false);
      setShopeStoreName(settings.shopeStoreName || "");
      setShopeShopId(settings.shopeShopId || "");
      setShopePartnerId(settings.shopePartnerId || "");
      setShopePartnerKey(settings.shopePartnerKey || "");
      setAutoChatEnabled(settings.autoChatEnabled || false);
      setAutoOrderEnabled(settings.autoOrderEnabled || false);
      setAiKnowledgeEssay(settings.aiKnowledgeEssay || "");
      setWhatsappDestination(settings.whatsappDestination || "");
      setWaAdminType(settings.waAdminType || "system");
      setIsWaConnected(settings.isWaConnected || false);
      setWaAccount(settings.waAccount || "");
      
      // Auto-migrate localhost to VPS IP
      const savedUrl = settings.waBackendUrl;
      const finalUrl = (savedUrl === "http://localhost:3000" || savedUrl === "http://localhost:8080" || !savedUrl) 
        ? "http://148.230.101.96:3000" 
        : savedUrl;
      
      setWaBackendUrl(finalUrl);
      hasLoadedRef.current = user.id;
    } else if (userProfile) {
      // User has a profile but no shopauto_settings yet - stop loading
      hasLoadedRef.current = user.id;
    }
  }, [user, userProfile]);

  // --- ACTIONS ---
  const handleTestChat = async () => {
    let realKey = apiKey === "********" ? userProfile?.shopauto_settings?.apiKey : apiKey;
    
    if (aiProviderType === "system") {
      toast({ title: "Secure Mode", description: "System AI is managed via Cloud. Key is hidden for safety." });
      // In production, this should call a Supabase Edge Function that has the key stored in secrets.
      return;
    }

    if (!realKey) {
      toast({ title: "Error", description: "Masukkan API Key terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (!testChatMessage.trim()) return;
    const userMsg = testChatMessage;
    setTestChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setTestChatMessage("");
    setIsSendingTest(true);
    try {
      const prompt = `You are a Shopee Sales Assistant.\nKnowledge Base: ${aiKnowledgeEssay || "Answer helpfully."}\nUser: ${userMsg}\nAssistant:`;
      const currentEngine = aiEngine;
      let aiResponse = "";
      if (currentEngine === "openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${realKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] })
        });
        const data = await resp.json();
        aiResponse = data.choices?.[0]?.message?.content || "No response.";
      } else {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${realKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
      }
      setTestChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (err: any) {
      toast({ title: "Chat Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const testAiConnection = async () => {
    let realKey = apiKey === "********" ? userProfile?.shopauto_settings?.apiKey : apiKey;
    if (!realKey) {
      toast({ title: "Error", description: "Masukkan API Key terlebih dahulu.", variant: "destructive" });
      return;
    }

    setIsAiTesting(true);
    try {
      const currentEngine = aiEngine;
      if (currentEngine === "openai") {
        const resp = await fetch("https://api.openai.com/v1/models", {
          headers: { "Authorization": `Bearer ${realKey}` }
        });
        if (resp.ok) toast({ title: "Sukses", description: "Koneksi OpenAI berhasil!" });
        else throw new Error("API Key tidak valid");
      } else {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${realKey}`);
        if (resp.ok) toast({ title: "Sukses", description: "Koneksi Gemini berhasil!" });
        else throw new Error("API Key tidak valid");
      }
    } catch (err: any) {
      toast({ title: "Koneksi Gagal", description: err.message, variant: "destructive" });
    } finally {
      setIsAiTesting(false);
    }
  };

  const handleTestWaMessage = async () => {
    if (!whatsappDestination) {
      toast({ title: "Error", description: "Tentukan nomor tujuan atau ID grup WA.", variant: "destructive" });
      return;
    }
    setIsSendingWaTest(true);
    const testText = testWaMessage.trim() || "🚀 *ShopAuto Test Message*\n\nWhatsApp Forwarding berhasil terhubung!";
    
    console.log("DEBUG: Sending Test WA", { 
      type: waAdminType, 
      dest: whatsappDestination, 
      url: waBackendUrl,
      message: testText 
    });

    try {
      const targetUrl = `${waBackendUrl.replace(/\/$/, '')}/send-message`;
      
      const payload: any = { 
        number: whatsappDestination, 
        message: testText 
      };
      
      if (waAdminType === "system") {
        payload.sender = "admin";
      }

      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_WA_API_KEY
        },
        body: JSON.stringify(payload)
      });
      
      const data = await resp.json();
      if (data.success) {
        toast({ title: "Berhasil terkirim" });
      } else {
        throw new Error(data.error || "Gagal mengirim via VPS.");
      }
    } catch (err: any) {
      console.error("DEBUG: WA Test Failed", err);
      toast({ title: "WA Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingWaTest(false);
    }
  };

  const fetchAvailableGroups = async () => {
    const sender = waAdminType === "system" ? "admin" : "user";
    
    // Restriction: Only authorized admins can fetch from 'admin' sender
    if (sender === "admin" && user?.email && !['elvisiondragon@gmail.com', 'dragon@gmail.com', 'deliamutia2001@gmail.com'].includes(user.email)) {
      toast({
        title: "Akses Ditolak",
        description: "Hanya Admin yang dapat mencari ID Grup menggunakan Admin Sender. Silakan ganti ke User Sender.",
        variant: "destructive"
      });
      return;
    }

    setIsFetchingGroups(true);
    try {
      // Securely fetch groups via Supabase Edge Function proxy
      const { data, error: invokeError } = await supabase.functions.invoke('shopauto-handler', {
        body: { 
          action: "get_groups",
          sender: sender,
          waBackendUrl: waBackendUrl
        }
      });

      if (invokeError) throw invokeError;
      
      console.log("List of Groups:", data);
      
      if (Array.isArray(data)) {
        setAvailableGroups(data);
        if (data.length === 0) {
          toast({ 
            title: "Tidak Ada Grup", 
            description: "Pastikan WhatsApp sudah terhubung dan Anda memiliki grup.",
          });
        } else {
          toast({ 
            title: "Grup Ditemukan", 
            description: `Berhasil mengambil ${data.length} grup.`,
          });
        }
      } else {
        throw new Error(data?.error || "Format data grup tidak valid.");
      }
    } catch (err: any) {
      console.error("Error fetching groups:", err);
      toast({ 
        title: "Gagal Mengambil Grup", 
        description: err.message || "Terjadi kesalahan saat menghubungi server WA.", 
        variant: "destructive" 
      });
    } finally {
      setIsFetchingGroups(false);
    }
  };

  const connectShopee = () => {
    window.open("https://partner.shopeemobile.com/api/v1/shop/auth_partner", "_blank");
    setIsShopeeConnected(true);
    setShopeStoreName("My Store");
    setShopeShopId("12345678");
    saveSettings({ isShopeeConnected: true, shopeStoreName: "My Store", shopeShopId: "12345678" });
  };

  const resetWaSession = async () => {
    try {
      const { data: _data, error } = await supabase.functions.invoke('shopauto-handler', {
        body: { 
          action: "reset_client",
          sender: "user",
          waBackendUrl: waBackendUrl
        }
      });
      if (error) throw error;
      toast({ title: "Sesi Direset", description: "Silakan tunggu QR baru muncul." });
      setWaQrCode(null);
      setIsWaConnected(false);
      setWaStatus("connecting");
    } catch (err: any) {
      toast({ title: "Gagal Reset", description: err.message, variant: "destructive" });
    }
  };

  const disconnectWa = async () => {
    try {
      await fetch(waBackendUrl + "/disconnect", { 
        method: 'POST',
        headers: { 'x-api-key': import.meta.env.VITE_WA_API_KEY }
      });
      setIsWaConnected(false); setWaStatus("disconnected"); setWaAccount(""); setWaQrCode(null);
      handleToggle("isWaConnected", false);
    } catch (err) { console.error(err); }
  };

  const onLogout = async () => { 
    try { 
      await cleanupSupabase();
      await supabase.auth.signOut(); 
      navigate('/'); 
    } catch (err) { 
      console.error(err); 
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 pb-20 font-sans">
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <img src="/shopauto.png" alt="ShopAuto Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent tracking-tighter italic">ShopAuto</h1>
              <p className="text-slate-500 mt-1 font-medium">Otomatiskan Toko Online</p>
            </div>
            {isSaving ? (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                <RefreshCw size={12} className="mr-2" /> SAVING
              </Badge>
            ) : (autoChatEnabled || autoOrderEnabled) ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 size={12} className="mr-2" /> SYNCED
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                <Power size={12} className="mr-2" /> DISCONNECTED
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {!user ? (
              <Button onClick={handleAuthRedirect} className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20">Login to Get Started</Button>
            ) : (
              <>
                <Button onClick={() => saveSettings({}, false)} className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"><Save className="w-4 h-4 mr-2" /> Simpan Cloud</Button>
                <Button variant="destructive" onClick={onLogout} className="bg-red-600/10 text-red-600 border border-red-600/20 hover:bg-red-600 hover:text-white transition-all"><Power className="w-4 h-4 mr-2" /> Logout</Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="bg-slate-200/50 border border-slate-200 p-1 mb-8 h-auto flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="ai-engine" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">AI Engine</TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Knowledge Base</TabsTrigger>
            <TabsTrigger value="forward" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Nomor Gudang</TabsTrigger>
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6 outline-none">
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200 text-slate-900">
              <CardHeader><CardTitle className="text-2xl flex items-center gap-2 font-bold"><Zap className="text-orange-500 fill-orange-500" /> Kenapa ShopAuto?</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed text-slate-700 italic font-bold">"Kami berfokus hanya ke 2 hal saja: Kecepatan dan Presisi."</p>
                <div className="space-y-3 text-slate-600 text-sm">
                  <p className="leading-relaxed"><span className="text-orange-600 font-bold">1. Respon Chat Customer:</span> <span className="font-bold text-slate-900 text-base">Customer sering lari ke kompetitor karena admin kamu lama balas nya?</span> Ingin balasan custom sesuai produk? Kami menyediakan AI yang canggih. Cukup tulis semua pengetahuan tiap produk.</p>
                  <p className="leading-relaxed"><span className="text-orange-600 font-bold">2. Order Capture:</span> <span className="font-bold text-slate-900 text-base">Sering pesanan batal karena lupa ada orderan?</span> AI kami akan capture orderan dari toko Anda dan post ke gudang/supplier Anda di WhatsApp. Tidak ada pesanan batal karena lupa proses lagi!</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-slate-200 text-slate-900">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><ShoppingBag size={14} className="text-orange-500" /> Shopee Status</CardTitle></CardHeader>
                <CardContent>{isShopeeConnected ? <div className="flex items-center justify-between"><span className="font-bold">{shopeStoreName}</span><Badge className="bg-green-600">CONNECTED</Badge></div> : <Button onClick={connectShopee} size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-sm">Connect Store</Button>}</CardContent>
              </Card>
              <Card className="bg-white border-slate-200 text-slate-900">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Cpu size={14} className="text-purple-600" /> AI Auto Chat</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-between"><span className="font-bold">{aiProviderType.toUpperCase()}</span><Badge variant="outline" className={autoChatEnabled ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}>{autoChatEnabled ? "ON" : "OFF"}</Badge></div></CardContent>
              </Card>
              <Card className="bg-white border-slate-200 text-slate-900">
                <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><Smartphone size={14} className="text-green-600" /> Order Capture</CardTitle></CardHeader>
                <CardContent><div className="flex items-center justify-between"><span className="font-bold truncate max-w-[100px]">{whatsappDestination || "Not Set"}</span><Badge variant="outline" className={autoOrderEnabled ? "border-green-600 text-green-600" : "border-red-600 text-red-600"}>{autoOrderEnabled ? "ON" : "OFF"}</Badge></div></CardContent>
              </Card>
            </div>

            {user?.email && ['elvisiondragon@gmail.com', 'tester123@gmail.com', 'dragon@gmail.com', 'deliamutia2001@gmail.com'].includes(user.email) && (
              <Card className="bg-white border-slate-200 text-slate-900">
                <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600 font-bold"><ExternalLink size={18} /> Integration Setup</CardTitle><CardDescription className="text-slate-500">Salin URL di bawah ini ke Shopee Seller Centre &gt; Webhook Settings.</CardDescription></CardHeader>
                <CardContent><div className="space-y-2"><Label className="text-xs text-slate-500 uppercase font-bold">Webhook Push URL</Label><div className="flex gap-2"><Input readOnly value="https://nlrgdhpmsittuwiiindq.supabase.co/functions/v1/shopauto-handler" className="bg-slate-50 border-slate-200 text-xs font-mono text-blue-600" /><Button variant="outline" size="icon" className="hover:bg-blue-600 hover:text-white" onClick={() => {navigator.clipboard.writeText("https://nlrgdhpmsittuwiiindq.supabase.co/functions/v1/shopauto-handler"); toast({title: "Copied"});}}><Copy size={14} /></Button></div></div></CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI ENGINE TAB */}
          <TabsContent value="ai-engine" className="space-y-6 outline-none">
            <Card className="bg-white border-slate-200 text-slate-900 shadow-xl">
              <CardHeader>
                <CardTitle className="font-bold text-xl">Otomatisasi Chat</CardTitle>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${autoChatEnabled ? 'bg-green-500/10 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-slate-200 text-slate-400'}`}><MessageSquare size={20} /></div>
                    <div><p className="font-bold">Aktifkan Auto Chat AI</p><p className="text-xs text-slate-500">AI akan secara cerdas membalas chat pembeli berdasarkan esai anda.</p></div>
                  </div>
                  <Switch checked={autoChatEnabled} onCheckedChange={(v) => handleToggle("autoChatEnabled", v)} />
                </div>
              </CardHeader>
              <CardContent className={`space-y-6 transition-all duration-500 ${!autoChatEnabled ? "opacity-30 pointer-events-none blur-[0.5px]" : "opacity-100"}`}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-500">PILIH PROVIDER AI</Label>
                    <Select value={aiProviderType} onValueChange={(v: any) => handleToggle("aiProviderType", v)}>
                      <SelectTrigger className="bg-white border-slate-200 h-12 text-lg"><SelectValue placeholder="Pilih Provider" /></SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900">
                        <SelectItem value="system">API Kami (FREE)</SelectItem>
                        <SelectItem value="custom">API Kamu (Gunakan Key Sendiri)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {aiProviderType === "system" ? (
                    <div className="p-6 bg-purple-50 border border-purple-100 rounded-xl space-y-3 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Zap className="text-purple-600 fill-purple-600" /><p className="font-bold text-purple-900 text-lg">Server API Kami (FREE)</p></div>
                        <Badge className="bg-green-600 px-3 py-1 text-white">ACTIVE</Badge>
                      </div>
                      <p className="text-sm text-purple-800 leading-relaxed">Sistem menggunakan infrastruktur eL Vision Group dengan OpenAI High-Speed secara gratis untuk anda. Tidak ada kuota terbatas.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 border-t border-slate-200 pt-6 mt-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase">Engine & API Key</Label>
                        <Select value={aiEngine} onValueChange={(v) => handleToggle("aiEngine", v)}>
                          <SelectTrigger className="bg-white border-slate-200 h-12"><SelectValue placeholder="Pilih Engine" /></SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="openai">OpenAI (GPT-4o / mini)</SelectItem>
                            <SelectItem value="gemini">Gemini 2.5 Flash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Input type="password" placeholder="Masukkan API Key Anda" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-white border-slate-200 h-12" />
                        <Button onClick={testAiConnection} disabled={isAiTesting} variant="outline" className="border-purple-600 text-purple-600 h-12 px-6 hover:bg-purple-600 hover:text-white transition-all">{isAiTesting ? <RefreshCw className="animate-spin w-4 h-4" /> : "Test Connection"}</Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={() => saveSettings({}, false)} className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-bold text-lg shadow-lg shadow-purple-600/20 mt-4"><Save className="w-5 h-5 mr-2" /> Simpan AI Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KNOWLEDGE TAB */}
          <TabsContent value="knowledge" className="space-y-6 outline-none">
            <Card className="bg-white border-slate-200 text-slate-900">
              <CardHeader><CardTitle className="flex items-center gap-2 text-orange-600 font-bold text-xl"><BookOpen /> AI Knowledge (The Essay)</CardTitle><CardDescription className="text-slate-500">Jelaskan segalanya tentang toko anda di sini. AI akan mempelajari esai ini untuk menjawab pelanggan secara natural.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <Textarea placeholder="Contoh: Toko saya menjual sepatu sport original. Kami buka jam 8 pagi - 9 malam. Jika stok habis, tawarkan model lain yang serupa. Ongkir Jakarta flat 10rb..." value={aiKnowledgeEssay} onChange={(e) => setAiKnowledgeEssay(e.target.value)} className="bg-slate-50 border-slate-200 min-h-[400px] leading-relaxed text-lg focus:ring-orange-500/50" />
                <Button onClick={() => saveSettings({}, false)} className="w-full bg-orange-600 hover:bg-orange-700 h-12 font-bold text-lg shadow-lg shadow-orange-600/20"><Save className="w-5 h-5 mr-2" /> Simpan AI Knowledge</Button>
                
                {/* TEST CHAT AREA */}
                <div className="mt-12 space-y-4 border-t border-slate-200 pt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-green-600"><MessageSquare size={20} /> TEST CHAT WITH AI</h3>
                    <Button variant="ghost" size="sm" onClick={() => setTestChatHistory([])} className="text-[10px] uppercase font-bold text-slate-400">Reset Chat</Button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 min-h-[300px] max-h-[450px] overflow-y-auto space-y-4 shadow-inner">
                    {testChatHistory.length === 0 && <div className="flex flex-col items-center justify-center h-full opacity-30 mt-20 text-slate-400"><MessageSquare size={48} className="mb-2" /><p className="font-medium">Belum ada percakapan. Sapa AI anda!</p></div>}
                    {testChatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${chat.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}><p className="text-sm leading-relaxed">{chat.content}</p></div>
                      </div>
                    ))}
                    {isSendingTest && <div className="flex justify-start"><div className="bg-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-1"><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div></div></div>}
                  </div>
                  <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xl focus-within:border-orange-500/50 transition-all">
                    <Input placeholder="Tanya seputar toko anda ke AI..." value={testChatMessage} onChange={(e) => setTestChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTestChat()} className="bg-transparent border-none h-12 focus-visible:ring-0 text-lg" />
                    <Button onClick={handleTestChat} disabled={isSendingTest} className="bg-green-600 hover:bg-green-700 h-12 w-12 rounded-xl shrink-0"><Send size={20} className="text-white" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORWARD TAB */}
          <TabsContent value="forward" className="space-y-6 outline-none">
            <Card className="bg-white border-slate-200 text-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${autoOrderEnabled ? 'bg-orange-500/10 text-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-slate-200 text-slate-400'}`}><ShoppingBag size={20} /></div>
                    <div><p className="font-bold">Aktifkan Auto Order Capture</p><p className="text-xs text-slate-500 italic">Capture detail order Shopee (Resi, Kurir, Produk) ke WhatsApp.</p></div>
                  </div>
                  <Switch checked={autoOrderEnabled} onCheckedChange={(v) => handleToggle("autoOrderEnabled", v)} />
                </div>
              </CardHeader>
              <CardContent className={`space-y-6 transition-all duration-500 ${!autoOrderEnabled ? "opacity-30 pointer-events-none blur-[0.5px]" : "opacity-100"}`}>
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">- Pengirim</Label>
                  <Select value={waAdminType} onValueChange={(v: any) => handleToggle("waAdminType", v)}>
                    <SelectTrigger className="bg-white border-slate-200 h-14 text-lg font-bold"><SelectValue placeholder="Pilih Provider" /></SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      <SelectItem value="system">- Admin Sender (free)</SelectItem>
                      <SelectItem value="custom">User Sender</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {waAdminType === "system" ? (
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><CheckCircle2 className="text-blue-600" /><p className="font-bold text-blue-900">Infrastruktur eL Vision</p></div>
                        <Badge className="bg-green-600 text-[10px] text-white">GRATIS</Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">AI akan menggunakan nomor official kami untuk mengirim detail order ke Gudang anda secara otomatis.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-orange-600 shrink-0 mt-1" size={16} />
                        <div><p className="text-xs text-orange-900 font-bold">Premium Branding</p><p className="text-[10px] text-orange-800/70">Hubungkan nomor pribadi anda agar nama toko anda muncul di WhatsApp Gudang.</p></div>
                      </div>
                      
                      {isWaConnected ? (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3"><div className="p-2 bg-green-600 rounded-full"><Smartphone className="text-white" size={18} /></div><div><p className="font-bold text-sm text-slate-900">{waAccount}</p><p className="text-[10px] text-green-600 font-bold uppercase">Ready</p></div></div>
                          <Button variant="ghost" size="sm" className="text-red-600 text-xs" onClick={disconnectWa}>Putuskan</Button>
                        </div>
                      ) : waQrCode ? (
                        <div className="flex flex-col items-center py-6 border-2 border-dashed border-orange-200 rounded-2xl bg-slate-50 space-y-4">
                          <div className="bg-white p-2 rounded-xl shadow-md"><img src={waQrCode} alt="QR" className="w-40 h-40" /></div>
                          <p className="text-sm text-slate-600 font-medium">Scan with WhatsApp</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="xs" className="text-slate-400 text-[10px]" onClick={() => { setWaQrCode(null); setWaStatus("disconnected"); }}>Reset View</Button>
                            <Button variant="destructive" size="xs" className="text-white text-[10px]" onClick={resetWaSession}>Reset Sesi (Logout)</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-6 border-2 border-dashed border-orange-200 rounded-2xl bg-slate-50 space-y-4">
                          <div className="flex flex-col items-center gap-2"><RefreshCw className="text-orange-500 animate-spin" size={24} /><p className="text-xs text-slate-400">Menghubungkan ke WhatsApp VPS...</p></div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="xs" className="text-slate-400 text-[10px]" onClick={() => setWaStatus("connecting")}>Retry</Button>
                            <Button variant="ghost" size="xs" className="text-red-500 text-[10px]" onClick={resetWaSession}>Reset Sesi</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Button onClick={() => saveSettings({}, false)} className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12 shadow-lg shadow-blue-600/20 mt-2 text-white"><Save className="w-4 h-4 mr-2" /> Simpan Konfigurasi Admin</Button>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2"><Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nomor Penerima: Gudang / Suplier</Label><Button variant="link" size="sm" onClick={fetchAvailableGroups} disabled={isFetchingGroups} className="text-orange-600 p-0 h-auto font-bold text-xs hover:text-orange-500">{isFetchingGroups ? <RefreshCw className="animate-spin mr-2" size={12} /> : null}CARI ID GRUP SAYA</Button></div>
                  <div className="flex gap-2">
                    <Input placeholder="contoh 62812345678 atau 12345213@g.us" value={whatsappDestination} onChange={(e) => setWhatsappDestination(e.target.value)} className="bg-slate-50 border-slate-200 h-14 text-lg font-bold text-green-600 tracking-tight text-center" />
                    <Button variant="outline" size="icon" className="h-14 w-14 hover:bg-slate-100" onClick={() => {navigator.clipboard.writeText(whatsappDestination); toast({title: "Copied"});}}><Copy size={24} /></Button>
                  </div>
                  <p className="text-xs text-slate-400 text-center italic">Tip: Gunakan "Cari ID Grup" untuk mendapatkan ID grup gudang anda secara otomatis.</p>
                  <Button onClick={() => saveSettings({}, false)} className="w-full bg-green-600 hover:bg-green-700 h-14 font-bold text-lg shadow-lg shadow-green-600/20 mt-2"><Save className="w-5 h-5 mr-2" /> Simpan Nomor Gudang</Button>
                </div>
                {availableGroups.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 max-h-[250px] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2"><p className="text-xs font-bold text-orange-600 uppercase">Grup Ditemukan</p><Button variant="ghost" size="sm" onClick={() => setAvailableGroups([])} className="h-6 text-[10px] hover:bg-red-500/10 hover:text-red-500">Tutup</Button></div>
                    {availableGroups.map(g => (
                      <div key={g.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-orange-500/50 transition-all group/item">
                        <div className="overflow-hidden"><p className="text-sm font-bold truncate group-hover/item:text-orange-600">{g.name}</p><p className="text-[10px] text-slate-400 font-mono truncate">{g.id}</p></div>
                        <Button variant="secondary" size="sm" onClick={() => {setWhatsappDestination(g.id); setAvailableGroups([]); toast({title: "Grup Dipilih"});}} className="h-8 px-4 font-bold bg-orange-600/10 text-orange-600 border border-orange-600/20 hover:bg-orange-600 hover:text-white transition-all">Pilih</Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <Label className="text-xs font-bold text-slate-400 uppercase">Test Message (Optional)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Tulis pesan test di sini..." 
                      value={testWaMessage} 
                      onChange={(e) => setTestWaMessage(e.target.value)} 
                      className="bg-white border-slate-200 h-14"
                    />
                    <Button onClick={handleTestWaMessage} disabled={isSendingWaTest} variant="outline" className="border-green-600 text-green-600 h-14 px-8 hover:bg-green-600 hover:text-white transition-all">{isSendingWaTest ? <RefreshCw className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5 mr-2" />} Test Kirim</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
