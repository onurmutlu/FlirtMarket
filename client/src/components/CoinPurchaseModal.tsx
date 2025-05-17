import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { CoinPackage } from "@/types";

interface CoinPurchaseModalProps {
  onClose: () => void;
}

// Predefined coin packages
const COIN_PACKAGES: CoinPackage[] = [
  { amount: 100, price: 280, discount: 0 },
  { amount: 300, price: 750, discount: 10, isPopular: true },
  { amount: 500, price: 1200, discount: 15 },
  { amount: 1000, price: 2200, discount: 20 },
];

export default function CoinPurchaseModal({ onClose }: CoinPurchaseModalProps) {
  const { addCoins } = useUser();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(COIN_PACKAGES[1]); // Default to the popular option
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");

  // Calculate price per coin
  const getPricePerCoin = (pack: CoinPackage) => {
    return (pack.price / pack.amount).toFixed(1);
  };

  // Handle custom amount change
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    setCustomAmount(value);
    
    if (typeof value === 'number' && !isNaN(value)) {
      // Calculate price based on standard rate (about 2.8 TL per coin)
      const calculatedPrice = Math.round(value * 2.8);
      setCustomPrice(calculatedPrice);
    } else {
      setCustomPrice("");
    }
  };

  // Handle custom price change
  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    setCustomPrice(value);
    
    if (typeof value === 'number' && !isNaN(value)) {
      // Calculate coins based on standard rate (about 2.8 TL per coin)
      const calculatedAmount = Math.round(value / 2.8);
      setCustomAmount(calculatedAmount);
    } else {
      setCustomAmount("");
    }
  };

  // Mutation for purchasing coins
  const purchaseMutation = useMutation({
    mutationFn: async (data: { amount: number, paymentMethod: string }) => {
      const response = await apiRequest('POST', '/api/coins/purchase', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // Update user's coin balance
        addCoins(data.user.coins - (data.previousCoins || 0));
        
        // Show success toast
        toast({
          title: "Satın alma başarılı!",
          description: data.message || `${selectedPackage?.amount || customAmount} coin hesabınıza eklendi.`,
        });
        
        // Close modal
        onClose();
      }
    },
    onError: () => {
      toast({
        title: "Satın alma başarısız",
        description: "Ödeme işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    }
  });

  // Handle purchase
  const handlePurchase = () => {
    const amount = selectedPackage ? selectedPackage.amount : customAmount;
    
    if (!amount || typeof amount !== 'number') {
      toast({
        title: "Geçersiz miktar",
        description: "Lütfen geçerli bir coin miktarı seçin veya girin.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real application, you would handle payment gateway integration here
    purchaseMutation.mutate({
      amount,
      paymentMethod
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="w-11/12 max-w-md bg-card rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Coin Satın Al</h3>
          <button onClick={onClose}>
            <span className="material-icons text-muted-foreground">close</span>
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-muted-foreground text-sm mb-4">
            Şovcularla mesajlaşmak için coin satın alın. Daha fazla coin alarak daha fazla tasarruf edin!
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {COIN_PACKAGES.map((pack, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-3 cursor-pointer hover:border-primary transition-colors ${
                  selectedPackage === pack ? 'border-primary bg-gradient-to-br from-card to-secondary/10' : 'border-border'
                }`}
                onClick={() => {
                  setSelectedPackage(pack);
                  setCustomAmount("");
                  setCustomPrice("");
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="material-icons text-[#FFD700] mr-1">monetization_on</span>
                    <span className="text-foreground font-bold text-lg">{pack.amount}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground text-xs">≈ {getPricePerCoin(pack)} TL/coin</span>
                    {pack.discount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-secondary text-white text-xs rounded-sm">
                        %{pack.discount}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className={`w-full py-2 rounded-lg text-sm font-medium ${
                    selectedPackage === pack 
                      ? 'bg-secondary text-white' 
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  ₺{pack.price.toLocaleString()}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mb-4">
            <label className="block text-muted-foreground text-sm mb-2">Özel Miktar</label>
            <div className="flex items-center">
              <div className="flex-1 relative">
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FFD700]">
                  monetization_on
                </span>
                <input 
                  type="number" 
                  placeholder="Coin miktarı"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="w-full bg-background border border-border rounded-lg text-foreground pl-10 pr-3 py-3 focus:outline-none focus:border-primary"
                  onClick={() => setSelectedPackage(null)}
                />
              </div>
              <span className="mx-2 text-muted-foreground">=</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₺</span>
                <input 
                  type="number" 
                  placeholder="Tutar"
                  value={customPrice}
                  onChange={handleCustomPriceChange}
                  className="w-full bg-background border border-border rounded-lg text-foreground pl-8 pr-3 py-3 focus:outline-none focus:border-primary"
                  onClick={() => setSelectedPackage(null)}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-foreground mb-2">Ödeme Yöntemi</h4>
            <div className="flex overflow-x-auto space-x-2 py-1 hide-scrollbar">
              <div 
                className={`flex-shrink-0 rounded-lg p-2 w-16 h-10 flex items-center justify-center ${
                  paymentMethod === 'credit_card' 
                    ? 'border border-primary bg-primary/5' 
                    : 'border border-border'
                }`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <span className={`material-icons ${paymentMethod === 'credit_card' ? 'text-primary' : 'text-muted-foreground'}`}>
                  credit_card
                </span>
              </div>
              <div 
                className={`flex-shrink-0 rounded-lg p-2 w-16 h-10 flex items-center justify-center ${
                  paymentMethod === 'bank' 
                    ? 'border border-primary bg-primary/5' 
                    : 'border border-border'
                }`}
                onClick={() => setPaymentMethod('bank')}
              >
                <span className={`material-icons ${paymentMethod === 'bank' ? 'text-primary' : 'text-muted-foreground'}`}>
                  account_balance
                </span>
              </div>
              <div 
                className={`flex-shrink-0 rounded-lg p-2 w-16 h-10 flex items-center justify-center ${
                  paymentMethod === 'mobile' 
                    ? 'border border-primary bg-primary/5' 
                    : 'border border-border'
                }`}
                onClick={() => setPaymentMethod('mobile')}
              >
                <span className={`material-icons ${paymentMethod === 'mobile' ? 'text-primary' : 'text-muted-foreground'}`}>
                  smartphone
                </span>
              </div>
              <div 
                className={`flex-shrink-0 rounded-lg p-2 w-16 h-10 flex items-center justify-center ${
                  paymentMethod === 'wallet' 
                    ? 'border border-primary bg-primary/5' 
                    : 'border border-border'
                }`}
                onClick={() => setPaymentMethod('wallet')}
              >
                <span className={`material-icons ${paymentMethod === 'wallet' ? 'text-primary' : 'text-muted-foreground'}`}>
                  wallet
                </span>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full py-3 bg-primary text-white rounded-lg font-medium mb-2 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || (!selectedPackage && (!customAmount || customAmount === ""))}
          >
            {purchaseMutation.isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                İşleniyor...
              </span>
            ) : (
              'Hemen Satın Al'
            )}
          </button>
          <p className="text-muted-foreground text-xs text-center">
            Satın alarak, <a href="#" className="text-primary">Kullanım Şartları</a>'nı kabul etmiş olursunuz
          </p>
        </div>
      </div>
    </div>
  );
}
