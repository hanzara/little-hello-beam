import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Gift, 
  Receipt, 
  Star, 
  Clock, 
  Percent, 
  Zap,
  Search,
  Filter,
  Calendar,
  Phone,
  Tv,
  Car,
  Home,
  ShoppingBag,
  CreditCard,
  History
} from 'lucide-react';
import { useDealsAndBills } from '@/hooks/useDealsAndBills';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import DealsGrid from './DealsGrid';
import BillPaymentModal from './BillPaymentModal';
import DealDetailsModal from './DealDetailsModal';

const DealsAndBillsHub: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBillPayment, setShowBillPayment] = useState(false);
  const [showDealDetails, setShowDealDetails] = useState(false);
  const [selectedBillProvider, setSelectedBillProvider] = useState<any>(null);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const {
    deals,
    merchants,
    billProviders,
    billPayments,
    dealUsage,
    dealsByCategory,
    billProvidersByCategory,
    isLoading,
  } = useDealsAndBills();

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'telecom':
        return <Phone className="h-5 w-5" />;
      case 'utilities':
        return <Zap className="h-5 w-5" />;
      case 'entertainment':
        return <Tv className="h-5 w-5" />;
      case 'transport':
        return <Car className="h-5 w-5" />;
      case 'retail':
        return <ShoppingBag className="h-5 w-5" />;
      case 'banking':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  const handlePayBill = (provider: any) => {
    setSelectedBillProvider(provider);
    setShowBillPayment(true);
  };

  const handleViewDeal = (deal: any) => {
    setSelectedDeal(deal);
    setShowDealDetails(true);
  };

  // Filter deals based on search and category
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchTerm || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.merchants?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || deal.merchants?.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Filter bill providers
  const filteredBillProviders = billProviders.filter(provider => {
    const matchesSearch = !searchTerm || 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalSavingsFromDeals = dealUsage.reduce((sum, usage) => sum + usage.discount_amount, 0);
  const recentBillPayments = billPayments.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals & Bills</h1>
          <p className="text-muted-foreground">Save money on purchases and pay bills conveniently</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay 
              amount={totalSavingsFromDeals} 
              className="text-2xl font-bold text-green-600"
              showToggle={false} 
            />
            <p className="text-xs text-muted-foreground">
              From {dealUsage.length} deals used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Deals</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">
              Active offers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bill Providers</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billProviders.length}</div>
            <p className="text-xs text-muted-foreground">
              Available billers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Bills paid
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deals">Deals & Offers</TabsTrigger>
          <TabsTrigger value="bills">Pay Bills</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Search and Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals and bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="telecom">Telecom</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="banking">Banking</SelectItem>
            </SelectContent>
          </Select>
          
          {(searchTerm || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        <TabsContent value="deals" className="space-y-6">
          <DealsGrid 
            deals={filteredDeals} 
            onDealClick={handleViewDeal}
          />
        </TabsContent>

        <TabsContent value="bills" className="space-y-6">
          {/* Bill Providers Grid */}
          {Object.entries(billProvidersByCategory).map(([category, providers]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {getCategoryIcon(category)}
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {providers.filter(provider => 
                  !searchTerm || 
                  provider.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((provider) => (
                  <Card key={provider.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {provider.logo_url ? (
                            <img 
                              src={provider.logo_url} 
                              alt={provider.name}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                              {getCategoryIcon(provider.category)}
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base">{provider.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {provider.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Button 
                        className="w-full gap-2"
                        onClick={() => handlePayBill(provider)}
                      >
                        <Receipt className="h-4 w-4" />
                        Pay Bill
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Deal Usage History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Recent Deal Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dealUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No deals used yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dealUsage.slice(0, 5).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{usage.deals?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {usage.merchants?.name} • {new Date(usage.used_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            -<CurrencyDisplay amount={usage.discount_amount} className="inline" showToggle={false} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <CurrencyDisplay amount={usage.final_amount} className="inline" showToggle={false} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bill Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Bill Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentBillPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bills paid yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentBillPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{payment.bill_providers?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.account_number} • {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                payment.status === 'completed' ? 'default' :
                                payment.status === 'pending' ? 'secondary' :
                                payment.status === 'processing' ? 'secondary' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="font-medium">
                            <CurrencyDisplay amount={payment.total_amount} className="inline" showToggle={false} />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BillPaymentModal
        open={showBillPayment}
        onOpenChange={setShowBillPayment}
        provider={selectedBillProvider}
      />

      <DealDetailsModal
        open={showDealDetails}
        onOpenChange={setShowDealDetails}
        deal={selectedDeal}
      />
    </div>
  );
};

export default DealsAndBillsHub;