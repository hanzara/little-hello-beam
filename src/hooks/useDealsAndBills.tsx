import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Merchant {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  description?: string;
  rating: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  merchant_id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  discount_amount?: number;
  min_spend: number;
  max_discount?: number;
  terms_conditions?: string;
  valid_from: string;
  valid_until?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  merchants?: Merchant;
}

export interface BillProvider {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  supported_fields: string[];
  provider_endpoint?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  user_id: string;
  provider_id: string;
  account_number: string;
  amount: number;
  reference_number?: string;
  payment_method: string;
  status: string;
  transaction_id?: string;
  provider_response?: any;
  fee_amount: number;
  total_amount: number;
  scheduled_for?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  bill_providers?: BillProvider;
}

export interface DealUsage {
  id: string;
  user_id: string;
  deal_id: string;
  merchant_id: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  commission_earned: number;
  transaction_reference?: string;
  used_at: string;
}

export const useDealsAndBills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active deals
  const dealsQuery = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          merchants (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch merchants
  const merchantsQuery = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bill providers
  const billProvidersQuery = useQuery({
    queryKey: ['bill-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bill_providers')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user's bill payments
  const billPaymentsQuery = useQuery({
    queryKey: ['bill-payments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('bill_payments')
        .select(`
          *,
          bill_providers (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's deal usage
  const dealUsageQuery = useQuery({
    queryKey: ['deal-usage', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deal_usage')
        .select(`
          *,
          deals (*),
          merchants (*)
        `)
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Use deal mutation
  const useDealMutation = useMutation({
    mutationFn: async ({
      dealId,
      originalAmount,
      merchantId,
    }: {
      dealId: string;
      originalAmount: number;
      merchantId: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get deal details
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;

      // Check if deal is valid
      if (!deal.is_active) {
        throw new Error('This deal is no longer active');
      }

      if (deal.valid_until && new Date(deal.valid_until) < new Date()) {
        throw new Error('This deal has expired');
      }

      if (originalAmount < deal.min_spend) {
        throw new Error(`Minimum spend is KES ${deal.min_spend}`);
      }

      if (deal.usage_limit && deal.used_count >= deal.usage_limit) {
        throw new Error('This deal has reached its usage limit');
      }

      // Calculate discount
      let discountAmount = 0;
      if (deal.discount_percentage) {
        discountAmount = (originalAmount * deal.discount_percentage) / 100;
        if (deal.max_discount) {
          discountAmount = Math.min(discountAmount, deal.max_discount);
        }
      } else if (deal.discount_amount) {
        discountAmount = deal.discount_amount;
      }

      const finalAmount = originalAmount - discountAmount;

      // Get merchant details for commission
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('commission_rate')
        .eq('id', merchantId)
        .single();

      if (merchantError) throw merchantError;

      const commissionEarned = (originalAmount * merchant.commission_rate) / 100;

      // Record deal usage
      const { data, error } = await supabase
        .from('deal_usage')
        .insert({
          user_id: user.id,
          deal_id: dealId,
          merchant_id: merchantId,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          commission_earned: commissionEarned,
        })
        .select()
        .single();

      if (error) throw error;

      // Update deal usage count
      await supabase
        .from('deals')
        .update({ used_count: deal.used_count + 1 })
        .eq('id', dealId);

      return { ...data, discountAmount, finalAmount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-usage'] });
      toast({
        title: "Deal Applied! 🎉",
        description: `You saved KES ${data.discountAmount}! Pay only KES ${data.finalAmount}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply deal",
        variant: "destructive",
      });
    },
  });

  // Pay bill mutation
  const payBillMutation = useMutation({
    mutationFn: async ({
      providerId,
      accountNumber,
      amount,
      paymentMethod = 'mobile_money',
    }: {
      providerId: string;
      accountNumber: string;
      amount: number;
      paymentMethod?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate fee (2% of amount with minimum of KES 5)
      const feeAmount = Math.max(amount * 0.02, 5);
      const totalAmount = amount + feeAmount;

      const { data, error } = await supabase
        .from('bill_payments')
        .insert({
          user_id: user.id,
          provider_id: providerId,
          account_number: accountNumber,
          amount: amount,
          payment_method: paymentMethod,
          fee_amount: feeAmount,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, you would integrate with M-Pesa or other payment providers here
      // For now, we'll simulate processing
      setTimeout(async () => {
        await supabase
          .from('bill_payments')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            transaction_id: `TXN${Date.now()}`,
          })
          .eq('id', data.id);
        
        queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      }, 3000);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      toast({
        title: "Bill Payment Initiated! 💳",
        description: `Payment of KES ${data.total_amount} is being processed`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process bill payment",
        variant: "destructive",
      });
    },
  });

  // Get deals by category
  const getDealsByCategory = () => {
    const deals = dealsQuery.data || [];
    const categories: Record<string, Deal[]> = {};
    
    deals.forEach(deal => {
      const category = deal.merchants?.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(deal);
    });
    
    return categories;
  };

  // Get bill providers by category
  const getBillProvidersByCategory = () => {
    const providers = billProvidersQuery.data || [];
    const categories: Record<string, BillProvider[]> = {};
    
    providers.forEach(provider => {
      const category = provider.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(provider);
    });
    
    return categories;
  };

  return {
    // Data
    deals: dealsQuery.data || [],
    merchants: merchantsQuery.data || [],
    billProviders: billProvidersQuery.data || [],
    billPayments: billPaymentsQuery.data || [],
    dealUsage: dealUsageQuery.data || [],
    
    // Computed data
    dealsByCategory: getDealsByCategory(),
    billProvidersByCategory: getBillProvidersByCategory(),
    
    // Loading states
    isLoading: dealsQuery.isLoading || merchantsQuery.isLoading || billProvidersQuery.isLoading,
    
    // Actions
    useDeal: useDealMutation.mutate,
    payBill: payBillMutation.mutate,
    
    // Mutation states
    isUsingDeal: useDealMutation.isPending,
    isPayingBill: payBillMutation.isPending,
  };
};