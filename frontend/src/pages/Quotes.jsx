import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import QuoteForm from '@/components/quotes/QuoteForm';
import QuoteList from '@/components/quotes/QuoteList';
import { useQuoteActions } from '@/components/quotes/hooks/useQuoteActions';

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({ 
    queryKey: ['quotes'], 
    queryFn: () => base44.entities.Quote.list('-created_at') 
  });
  
  const { data: customers = [] } = useQuery({ 
    queryKey: ['customers'], 
    queryFn: () => base44.entities.Customer.list() 
  });
  
  const { data: products = [] } = useQuery({ 
    queryKey: ['products'], 
    queryFn: () => base44.entities.Product.list() 
  });

  // Utiliser le hook d'actions
  const {
    createMutation,
    updateMutation,
    deleteQuote,
    sendQuote,
    rejectQuote,
    convertToOrderMutation,
    isLoading: actionsLoading
  } = useQuoteActions();

  // Check for prefilled data from customer details page
  React.useEffect(() => {
    // Look for any prefilled quote data in sessionStorage
    const keys = Object.keys(sessionStorage);
    console.log(`[DEBUG Quotes.jsx] Checking sessionStorage keys:`, keys);
    const quoteKey = keys.find(key => key.startsWith('prefilled_quote_'));
    console.log(`[DEBUG Quotes.jsx] Found quoteKey:`, quoteKey);
    
    if (quoteKey) {
      try {
        const prefilledData = JSON.parse(sessionStorage.getItem(quoteKey));
        console.log(`[DEBUG Quotes.jsx] Parsed prefilled data:`, prefilledData);
        console.log(`[DEBUG Quotes.jsx] formOpen state:`, formOpen);
        
        if (prefilledData && !formOpen) {
          console.log(`[DEBUG Quotes.jsx] Setting editing quote and opening form`);
          // Set the prefilled data as editing quote to auto-open form
          setEditingQuote({
            ...prefilledData,
            // Ensure we have required fields
            quote_number: prefilledData.quote_number || '',
            customer_id: prefilledData.customer_id || '',
            customer_name: prefilledData.customer_name || '',
            status: prefilledData.status || 'draft',
            quote_date: prefilledData.quote_date || new Date().toISOString().split('T')[0],
            valid_until: prefilledData.valid_until || '',
            items: prefilledData.items || [],
            notes: prefilledData.notes || '',
            vat_rate: prefilledData.vat_rate || 20,
          });
          setFormOpen(true);
          // Clear the sessionStorage item
          sessionStorage.removeItem(quoteKey);
          console.log(`[DEBUG Quotes.jsx] Removed sessionStorage key:`, quoteKey);
        }
      } catch (error) {
        console.error('[DEBUG Quotes.jsx] Error parsing prefilled quote data:', error);
        sessionStorage.removeItem(quoteKey);
      }
    }
  }, [formOpen]);

  const handleSave = (data) => {
    if (editingQuote) {
      updateMutation.mutate({ id: editingQuote.id || editingQuote._id, data }, {
        onSuccess: () => {
          setFormOpen(false);
          setEditingQuote(null);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
        }
      });
    }
  };

  const handleEdit = (quote) => {
    setEditingQuote(quote);
    setFormOpen(true);
  };

  const handleSend = (quote) => {
    sendQuote(quote.id || quote._id);
  };

  const handleReject = (quote) => {
    rejectQuote(quote.id || quote._id);
  };

  const handleConvertToOrder = (quote) => {
    convertToOrderMutation.mutate(quote);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Devis</h1>
            <p className="text-slate-500 mt-1">Gérez vos propositions commerciales</p>
          </div>
          <Button 
            onClick={() => { 
              setEditingQuote(null); 
              setFormOpen(true); 
            }} 
            className="bg-slate-900 hover:bg-slate-800"
            disabled={actionsLoading}
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau devis
          </Button>
        </div>

        <QuoteList 
          quotes={quotes}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEdit}
          onDelete={deleteQuote}
          onSend={handleSend}
          onReject={handleReject}
          onConvertToOrder={handleConvertToOrder}
          showSearch={true}
          showActions={true}
        />

        <QuoteForm 
          open={formOpen} 
          onOpenChange={setFormOpen} 
          quote={editingQuote}
          onSave={handleSave}
          customers={customers} 
          products={products}
          prefilledData={null} // Pas de pré-remplissage depuis cette page
        />
      </div>
    </div>
  );
}